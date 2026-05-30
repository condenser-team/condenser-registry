import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

import { z } from "zod";

import { runBuild } from "../src/core/engine.js";
import {
  DEV_SERVER_ORIGIN,
  getDevServerContentType,
  getDevServerPathCandidates,
  withDevServerConfig,
} from "../src/core/dev-server.js";
import type { JsonObject, ProjectConfig, SchemaRegistry } from "../src/core/types.js";
import { makeFixture, makeTestConfig } from "./helpers.js";

test("overrides the root domain for the dev server", () => {
  const config: ProjectConfig = {
    apiName: "Example API",
    apiVersion: "1.0.0",
    rootDomain: "https://example.com",
    resourcesRoot: "resources",
    resourceTypes: {
      plugins: {},
    },
  };

  const devConfig = withDevServerConfig(config);

  assert.equal(devConfig.rootDomain, DEV_SERVER_ORIGIN);
  assert.equal(config.rootDomain, "https://example.com");
});

test("maps clean resource URLs to generated index files", () => {
  assert.deepEqual(getDevServerPathCandidates("/"), ["/index.json"]);
  assert.deepEqual(getDevServerPathCandidates("/plugins"), [
    "/plugins",
    "/plugins/index.schema.json",
    "/plugins/index.json",
    "/plugins/index.html",
    "/plugins.json",
  ]);
  assert.deepEqual(getDevServerPathCandidates("/plugins/lumen-drift"), [
    "/plugins/lumen-drift",
    "/plugins/lumen-drift/index.schema.json",
    "/plugins/lumen-drift/index.json",
    "/plugins/lumen-drift/index.html",
    "/plugins/lumen-drift.json",
  ]);
});

test("preserves explicit filenames and strips query strings", () => {
  assert.deepEqual(getDevServerPathCandidates("/docs/index.html?view=full"), ["/docs/index.html"]);
  assert.deepEqual(getDevServerPathCandidates("/docs/?view=full"), [
    "/docs/index.schema.json",
    "/docs/index.json",
    "/docs/index.html",
  ]);
});

test("detects content types for static files", () => {
  assert.equal(getDevServerContentType("/plugins/lumen-drift/index.jpg"), "image/jpeg");
  assert.equal(getDevServerContentType("/plugins/lumen-drift/index.png"), "image/png");
  assert.equal(getDevServerContentType("/docs/index.html"), "text/html; charset=utf-8");
  assert.equal(getDevServerContentType("/plugins/index.json"), "application/json; charset=utf-8");
  assert.equal(getDevServerContentType("/assets/file.bin"), "application/octet-stream");
});

test("development builds remove stale output and do not mix production origins", async () => {
  const registry: SchemaRegistry = {
    plugins: {
      resourceSchema: z.object({
        type: z.literal("SoftwareApplication"),
        name: z.string(),
        url: z.string(),
        image: z.string().optional(),
      }),
      resourceJsonLdType: "SoftwareApplication",
      allowedResourceTypes: ["SoftwareApplication"],
      compileResource({ resource, helper }) {
        return helper.makeJsonLdDocument("SoftwareApplication", {
          name: resource.data.name as string,
          url: `${helper.rootDomain()}${resource.data.url as string}`,
          image: resource.data.image ? `${helper.rootDomain()}${resource.data.image as string}` : null,
        });
      },
    },
  };

  const cwd = await makeFixture({
    "resources/plugins/lumen-drift/index.yaml":
      "type: SoftwareApplication\nname: Lumen Drift\nurl: /plugins/lumen-drift\nimage: /plugins/lumen-drift/index.jpg\n",
    "resources/plugins/lumen-drift/index.jpg": "jpg payload",
    "out/plugins/lumen/index.json":
      '{ "@id": "http://localhost:3000/plugins/lumen", "url": "https://example.com/plugins/lumen", "image": "https://example.com/images/lumen.png" }',
  });

  await runBuild(
    {
      cwd,
      write: true,
      mode: "development",
      config: withDevServerConfig(makeTestConfig({ plugins: {} })),
    },
    registry,
  );

  await assert.rejects(() => fs.readFile(path.join(cwd, "out/plugins/lumen/index.json"), "utf8"));

  const resource = JSON.parse(
    await fs.readFile(path.join(cwd, "out/plugins/lumen-drift/index.json"), "utf8"),
  ) as JsonObject;
  const serialized = JSON.stringify(resource);
  assert.ok(serialized.includes(DEV_SERVER_ORIGIN));
  assert.ok(!serialized.includes("https://example.com"));
});
