import { z } from "zod";

import type { JsonObject, JsonValue, ResourceTypeDefinition } from "../core/types.js";
import { resolvePublicUrl } from "../core/utils.js";

const HttpsUrl = z.string().min(8).max(512).startsWith("https://");
// File download URLs must be hosted on GitHub — prevents arbitrary external fetches.
const GitHubUrl = z.string().min(8).max(512).startsWith("https://github.com/");
const PublicUrl = z.union([HttpsUrl, z.string().min(1).max(256).startsWith("/")]);

const PluginSchema = z.object({
  type: z.literal("SoftwareApplication"),
  name: z.string().min(1).max(256),
  description: z.string().min(1).max(256),
  category: z.string().min(1).max(64),
  author: z.string().min(3).max(256),
  url: PublicUrl,
  image: PublicUrl.optional(),
  tags: z.array(z.string().min(1).max(64)).min(1).max(8).optional(),
});

const OS = z.enum(["windows", "macos", "linux", "android", "ios", "web"]);
const Arch = z.enum(["x86", "x86_64", "arm", "arm64", "wasm"]);

// A file can be either a local asset (path:) or an external release URL (url:).
const PluginFileLocalSchema = z.object({
  name: z.string().min(1).max(128),
  path: z.string().min(3).max(256),
  encodingFormat: z.string().min(1).max(128),
  license: HttpsUrl,
  operatingSystem: z.array(OS).min(1).optional(),
  processorRequirements: z.array(Arch).min(1).optional(),
});

const PluginFileExternalSchema = z.object({
  name: z.string().min(1).max(128),
  url: GitHubUrl,
  sha256: z
    .string()
    .regex(/^[a-f0-9]{64}$/)
    .optional(),
  encodingFormat: z.string().min(1).max(128),
  license: HttpsUrl,
  operatingSystem: z.array(OS).min(1).optional(),
  processorRequirements: z.array(Arch).min(1).optional(),
});

const PluginFileSchema = z.union([PluginFileLocalSchema, PluginFileExternalSchema]);

const PluginVersionSchema = z.object({
  type: z.literal("SoftwareApplication"),
  version: z.string().min(1).max(64),
  datePublished: z.string().min(1).max(64),
  releaseNotes: z.string().min(1).max(256),
  files: z.array(PluginFileSchema).min(1).max(16),
});

const PluginOutputSchema = z.object({
  "@context": z.string(),
  "@type": z.literal("SoftwareApplication"),
  "@id": z.string().url(),
  name: z.string(),
  description: z.string(),
  applicationCategory: z.string(),
  keywords: z.array(z.string()).optional(),
  author: z.object({
    "@id": z.string().url(),
    "@type": z.literal("Organization"),
    name: z.string().optional(),
  }),
  url: z.string().url(),
  image: z.string().url().nullable().optional(),
  versions: z
    .array(
      z.object({
        "@id": z.string().url(),
        "@type": z.literal("SoftwareApplication"),
        name: z.string().optional(),
      }),
    )
    .optional(),
  latestVersion: z
    .object({
      "@id": z.string().url(),
      "@type": z.literal("SoftwareApplication"),
      name: z.string().optional(),
    })
    .optional(),
});

const PluginVersionOutputSchema = z.object({
  "@context": z.string(),
  "@type": z.literal("SoftwareApplication"),
  "@id": z.string().url(),
  name: z.string(),
  version: z.string(),
  datePublished: z.string(),
  releaseNotes: z.string(),
  isPartOf: z.object({
    "@id": z.string().url(),
    "@type": z.literal("SoftwareApplication"),
    name: z.string().optional(),
  }),
  associatedMedia: z.array(
    z.object({
      "@type": z.literal("MediaObject"),
      name: z.string(),
      contentSize: z.number().int().nonnegative().optional(),
      sha256: z
        .string()
        .regex(/^[a-f0-9]{64}$/)
        .optional(),
      contentUrl: z.string().url(),
      encodingFormat: z.string(),
      license: z.string().url(),
      operatingSystem: z.array(z.string()).optional(),
      processorRequirements: z.array(z.string()).optional(),
    }),
  ),
});

export const pluginsResourceType: ResourceTypeDefinition = {
  resourceSchema: PluginSchema,
  versionSchema: PluginVersionSchema,
  resourceJsonLdType: "SoftwareApplication",
  versionJsonLdType: "SoftwareApplication",
  allowedResourceTypes: ["SoftwareApplication"],
  allowedVersionTypes: ["SoftwareApplication"],
  resourceOutputSchema: PluginOutputSchema,
  versionOutputSchema: PluginVersionOutputSchema,
  compileResource({ resource, helper }) {
    const versionRefs = helper.versionReferences();
    const latestVersion = helper.latestVersionReference();

    return helper.makeJsonLdDocument("SoftwareApplication", {
      name: resource.data.name as string,
      description: resource.data.description as string,
      applicationCategory: (resource.data.category as string).toLowerCase(),
      ...(resource.data.tags ? { keywords: resource.data.tags as string[] } : {}),
      author: helper.resolveInternalReference(resource.data.author as string),
      url: resolvePublicUrl(helper.rootDomain(), resource.data.url as string),
      ...(resource.data.image ? { image: resolvePublicUrl(helper.rootDomain(), resource.data.image as string) } : {}),
      ...(versionRefs.length > 0 ? { versions: versionRefs } : {}),
      ...(latestVersion ? { latestVersion } : {}),
    });
  },
  compileVersion({ resource, version, helper }) {
    type LocalFile = {
      name: string;
      path: string;
      encodingFormat: string;
      license: string;
      operatingSystem?: string[];
      processorRequirements?: string[];
    };
    type ExternalFile = {
      name: string;
      url: string;
      sha256?: string;
      encodingFormat: string;
      license: string;
      operatingSystem?: string[];
      processorRequirements?: string[];
    };
    type AnyFile = LocalFile | ExternalFile;

    const files = version.data.files as AnyFile[];

    return helper.makeJsonLdDocumentAt(helper.versionUrl(version.versionId), "SoftwareApplication", {
      name: `${resource.data.name as string} ${version.data.version as string}`,
      version: version.data.version as string,
      datePublished: version.data.datePublished as string,
      releaseNotes: version.data.releaseNotes as string,
      isPartOf: helper.toReferenceObject(helper.resourceUrl(), "SoftwareApplication", resource.data.name as string),
      associatedMedia: files.map((file) => {
        if ("url" in file) {
          // External release URL — emit as-is, no local asset copy.
          return {
            "@type": "MediaObject",
            name: file.name,
            contentUrl: file.url,
            encodingFormat: file.encodingFormat,
            license: file.license,
            ...(file.sha256 ? { sha256: file.sha256 } : {}),
            ...(file.operatingSystem ? { operatingSystem: file.operatingSystem as JsonValue } : {}),
            ...(file.processorRequirements ? { processorRequirements: file.processorRequirements as JsonValue } : {}),
          };
        }
        // Local asset — copy into the registry output and compute sha256/contentSize.
        return {
          "@type": "MediaObject",
          name: file.name,
          ...(helper.copyAsset(
            {
              path: file.path,
              encodingFormat: file.encodingFormat,
              license: file.license,
              ...(file.operatingSystem ? { operatingSystem: file.operatingSystem as JsonValue } : {}),
              ...(file.processorRequirements ? { processorRequirements: file.processorRequirements as JsonValue } : {}),
            },
            {
              resourceType: version.resourceType,
              resourceId: version.resourceId,
              versionId: version.versionId,
            },
          ) as JsonObject),
        };
      }),
    });
  },
};
