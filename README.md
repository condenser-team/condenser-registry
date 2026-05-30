# Condenser Registry

The official plugin registry for [Condenser](https://github.com/condenser-team/condenser). Plugins are defined as YAML source files and compiled into a schema.org-compatible JSON-LD static API, deployed to GitHub Pages.

## How it works

```
resources/          YAML source files + static assets
    └── plugins/
    └── authors/

↓  npm start

out/                Generated static JSON-LD API
    └── plugins/
    └── authors/
    └── schema/
```

Each YAML file in `resources/` is compiled into a [JSON-LD](https://json-ld.org/) document following [schema.org](https://schema.org/) vocabulary. The engine generates collection indexes, version lists, search indexes, and JSON Schema definitions — all as static files served via GitHub Pages.

## Live API

Root catalog: [https://condenser-team.github.io/condenser-registry](https://condenser-team.github.io/condenser-registry)

## API reference

All endpoints return `application/json` with JSON-LD context (`@context`, `@type`, `@id`).

### Root

| Endpoint                                                   | Description                                    |
| ---------------------------------------------------------- | ---------------------------------------------- |
| [`/`](https://condenser-team.github.io/condenser-registry) | `DataCatalog` — lists all resource collections |

```json
{
  "@type": "DataCatalog",
  "@id": "https://condenser-team.github.io/condenser-registry",
  "name": "Condenser Registry",
  "hasPart": [
    { "@id": ".../plugins", "@type": "ItemList", "name": "plugins" },
    { "@id": ".../authors", "@type": "ItemList", "name": "authors" }
  ]
}
```

### Collections

| Endpoint                                                                  | Description              |
| ------------------------------------------------------------------------- | ------------------------ |
| [`/plugins`](https://condenser-team.github.io/condenser-registry/plugins) | All plugins (`ItemList`) |
| [`/authors`](https://condenser-team.github.io/condenser-registry/authors) | All authors (`ItemList`) |

```json
{
  "@type": "ItemList",
  "@id": "https://condenser-team.github.io/condenser-registry/plugins",
  "name": "plugins collection",
  "itemListElement": [
    {
      "@type": "ListItem",
      "item": { "@id": ".../plugins/example-plugin", "@type": "SoftwareApplication", "name": "Example Plugin" }
    }
  ]
}
```

### Resources

| Endpoint                                                                                                | Description                             |
| ------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| [`/plugins/example-plugin`](https://condenser-team.github.io/condenser-registry/plugins/example-plugin) | A single plugin (`SoftwareApplication`) |
| [`/authors/condenser-team`](https://condenser-team.github.io/condenser-registry/authors/condenser-team) | An author (`Organization`)              |

```json
{
  "@type": "SoftwareApplication",
  "@id": "https://condenser-team.github.io/condenser-registry/plugins/example-plugin",
  "name": "Example Plugin",
  "description": "Demo plugin demonstrating all Condenser surfaces.",
  "applicationCategory": "example",
  "keywords": ["example"],
  "author": { "@id": ".../authors/condenser-team", "@type": "Organization", "name": "Condenser Team" },
  "latestVersion": { "@id": ".../plugins/example-plugin/versions/1.1.0", "@type": "SoftwareApplication" },
  "versions": [
    { "@id": ".../plugins/example-plugin/versions/1.1.0", "@type": "SoftwareApplication" },
    { "@id": ".../plugins/example-plugin/versions/1.0.0", "@type": "SoftwareApplication" }
  ]
}
```

### Versions

| Endpoint                                                                                                                                | Description                                |
| --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| [`/plugins/example-plugin/versions`](https://condenser-team.github.io/condenser-registry/plugins/example-plugin/versions)               | All versions of a plugin                   |
| [`/plugins/example-plugin/versions/latest`](https://condenser-team.github.io/condenser-registry/plugins/example-plugin/versions/latest) | Alias for the latest version               |
| [`/plugins/example-plugin/versions/1.0.0`](https://condenser-team.github.io/condenser-registry/plugins/example-plugin/versions/1.0.0)   | A specific version (`SoftwareApplication`) |

Each version document includes downloadable assets as `MediaObject` entries with auto-generated `contentSize` and `sha256` for integrity verification:

```json
{
  "@type": "SoftwareApplication",
  "@id": "https://condenser-team.github.io/condenser-registry/plugins/example-plugin/versions/1.0.0",
  "name": "Example Plugin 1.0.0",
  "version": "1.0.0",
  "datePublished": "2026-05-29",
  "isPartOf": { "@id": ".../plugins/example-plugin", "@type": "SoftwareApplication", "name": "Example Plugin" },
  "associatedMedia": [
    {
      "@type": "MediaObject",
      "name": "Example Plugin v1.0.0",
      "encodingFormat": "application/zip",
      "license": "https://spdx.org/licenses/MIT.html",
      "operatingSystem": ["linux", "macos", "windows"],
      "processorRequirements": ["x86_64", "arm64"],
      "contentSize": 1048576,
      "sha256": "a2d40a411a2036e8f8caccc3bbc1ab21b6abaa78b5c721095404d2f9f23fec84",
      "contentUrl": "https://condenser-team.github.io/condenser-registry/plugins/example-plugin/versions/1.0.0/assets/example-plugin-1.0.0.zip"
    }
  ]
}
```

### Search

Search indexes are pre-built as static files. No query string or server logic is needed — consumers construct the URL from the search term.

#### Discover available search attributes

| Endpoint                                                                                | Description                                 |
| --------------------------------------------------------------------------------------- | ------------------------------------------- |
| [`/plugins/search`](https://condenser-team.github.io/condenser-registry/plugins/search) | Lists all searchable attributes for plugins |
| [`/authors/search`](https://condenser-team.github.io/condenser-registry/authors/search) | Lists all searchable attributes for authors |

#### Exact match (category, tags)

Browse all known values, then resolve results:

| Endpoint                                                                                                              | Description                     |
| --------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| [`/plugins/search/category`](https://condenser-team.github.io/condenser-registry/plugins/search/category)             | All category values             |
| [`/plugins/search/category/audio`](https://condenser-team.github.io/condenser-registry/plugins/search/category/audio) | Plugins with category = `audio` |
| [`/plugins/search/tags`](https://condenser-team.github.io/condenser-registry/plugins/search/tags)                     | All tag values                  |
| [`/plugins/search/tags/example`](https://condenser-team.github.io/condenser-registry/plugins/search/tags/example)     | Plugins tagged `example`        |

#### Substring match (name)

Name search uses a per-word inverted index. Each character sequence (up to 5 chars per word) has its own file. Fetch as the user types to power typeahead:

| Endpoint                                                                                                | Description                                           |
| ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| [`/plugins/search/name`](https://condenser-team.github.io/condenser-registry/plugins/search/name)       | All indexed name prefixes                             |
| [`/plugins/search/name/ex`](https://condenser-team.github.io/condenser-registry/plugins/search/name/ex) | Plugins whose name contains a word starting with `ex` |
| [`/authors/search/name/co`](https://condenser-team.github.io/condenser-registry/authors/search/name/co) | Authors whose name contains a word starting with `co` |

```js
// Typeahead example
const query = "ex";
const res = await fetch(`https://condenser-team.github.io/condenser-registry/plugins/search/name/${query}`);
const { itemListElement } = await res.json();
// itemListElement[].item → matching SoftwareApplication references
```

### Schemas

Machine-readable JSON Schema definitions for all document types:

| Endpoint                                                                                                  | Description                               |
| --------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| [`/schema`](https://condenser-team.github.io/condenser-registry/schema)                                   | All available schemas                     |
| [`/schema/plugins`](https://condenser-team.github.io/condenser-registry/schema/plugins)                   | JSON Schema for a plugin resource         |
| [`/schema/plugins/versions`](https://condenser-team.github.io/condenser-registry/schema/plugins/versions) | JSON Schema for a plugin version          |
| [`/schema/authors`](https://condenser-team.github.io/condenser-registry/schema/authors)                   | JSON Schema for an author                 |
| [`/schema/collection`](https://condenser-team.github.io/condenser-registry/schema/collection)             | JSON Schema for a collection (`ItemList`) |
| [`/schema/search-manifest`](https://condenser-team.github.io/condenser-registry/schema/search-manifest)   | JSON Schema for a search manifest         |
| [`/schema/search-value`](https://condenser-team.github.io/condenser-registry/schema/search-value)         | JSON Schema for a search results page     |

---

## Contributing a plugin

### 1. Add an author

If your organization isn't already in the registry, create `resources/authors/<your-org>/index.yaml`:

```yaml
type: Organization
name: My Studio
description: A short description of your organization.
url: https://mystudio.example.com
```

### 2. Add a plugin

Create `resources/plugins/<plugin-id>/index.yaml`:

```yaml
type: SoftwareApplication
name: My Plugin
description: A short description of what the plugin does.
category: audio
author: /authors/my-studio
url: https://mystudio.example.com/my-plugin
```

### 3. Add a version

Create `resources/plugins/<plugin-id>/versions/<semver>.yaml` and place the release asset under `resources/plugins/<plugin-id>/files/`:

```yaml
type: SoftwareApplication
version: 1.0.0
datePublished: 2026-01-01
releaseNotes: Initial release.
files:
  - name: My Plugin 1.0.0
    path: /plugins/my-plugin/files/my-plugin-1.0.0.zip
    encodingFormat: application/zip
    license: https://spdx.org/licenses/MIT.html
    operatingSystem:
      - linux
      - macos
      - windows
    processorRequirements:
      - arm64
      - x86_64
```

`contentSize` and `sha256` are computed automatically from the actual file at build time — no manual entry needed.

### 4. Open a pull request

Push your branch and open a PR. CI will validate, build, and preview the output automatically.

---

## Project layout

```
src/
  project.ts          Project config and schema registry
  resources/          Resource type schemas and compilers
    plugins.ts
    authors.ts
  core/               Build engine, CLI, validation, utilities
resources/            YAML source content and static assets
  plugins/
    example-plugin/
      index.yaml
      index.jpg
      versions/
        1.0.0.yaml
        1.1.0.yaml
      files/
        example-plugin-1.0.0.zip
  authors/
    condenser-team/
      index.yaml
out/                  Generated static API (do not edit)
```

---

## Commands

| Command                          | Description                                    |
| -------------------------------- | ---------------------------------------------- |
| `npm run dev`                    | Watch mode — rebuilds incrementally on changes |
| `npm start`                      | Build `out/` from sources                      |
| `npm start -- --mode=production` | Build with minified output                     |
| `npm run validate`               | Validate sources without writing output        |
| `npm test`                       | Run the test suite                             |
| `npm run typecheck`              | TypeScript type check                          |
| `npm run lint`                   | ESLint                                         |
| `npm run format`                 | Prettier                                       |
| `npm run clean`                  | Remove `out/` and `dist/`                      |

---

## CI / CD

- **Pull requests** — runs typecheck, validate, test, and build.
- **Push to `main`** — builds and publishes `out/` to the `gh-pages` branch.
