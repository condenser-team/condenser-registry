import type { ProjectConfig, SchemaRegistry } from "./core/types.js";

import { pluginsResourceType } from "./resources/plugins.js";
import { authorsResourceType } from "./resources/authors.js";

export interface ProjectDefinition {
  config: ProjectConfig;
  schemaRegistry: SchemaRegistry;
}

export const projectDefinition: ProjectDefinition = {
  config: {
    apiName: "Static API JSON Schema",
    apiVersion: "0.1.0",
    rootDomain: "https://condenser-team.github.io/condenser-registry",
    resourcesRoot: "resources",
    resourceTypes: {
      plugins: {
        searchAttributes: ["category", "tags", { attribute: "name", strategy: "substring" as const }],
      },
      authors: {
        searchAttributes: [{ attribute: "name", strategy: "substring" as const }],
      },
    },
  },
  schemaRegistry: {
    plugins: pluginsResourceType,
    authors: authorsResourceType,
  },
};
