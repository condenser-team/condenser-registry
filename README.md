# Static API JSON Schema

Transform YAML source files into a fully-featured, schema.org-compatible JSON-LD static API — deployable to GitHub Pages or any static host with zero server infrastructure.

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

Each YAML file in `resources/` is compiled into a [JSON-LD](https://json-ld.org/) document following [schema.org](https://schema.org/) vocabulary. The engine also generates collection indexes, version lists, search indexes, and JSON Schema definitions — all as static files accessible via static urls.

## Live demo

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
  "name": "Static API JSON Schema",
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
      "item": { "@id": ".../plugins/space-quest", "@type": "SoftwareApplication", "name": "Space Quest" }
    },
    {
      "@type": "ListItem",
      "item": { "@id": ".../plugins/lumen-drift", "@type": "SoftwareApplication", "name": "Lumen Drift" }
    }
  ]
}
```

### Resources

| Endpoint                                                                                          | Description                           |
| ------------------------------------------------------------------------------------------------- | ------------------------------------- |
| [`/plugins/space-quest`](https://condenser-team.github.io/condenser-registry/plugins/space-quest) | A single game (`SoftwareApplication`) |
| [`/authors/acme`](https://condenser-team.github.io/condenser-registry/authors/acme)               | A single publisher (`Organization`)   |

```json
{
  "@type": "SoftwareApplication",
  "@id": "https://condenser-team.github.io/condenser-registry/plugins/space-quest",
  "name": "Space Quest",
  "description": "Narrative exploration game used as the sample static API resource.",
  "applicationCategory": "adventure",
  "keywords": ["sci-fi", "single-player"],
  "author": { "@id": ".../authors/acme", "@type": "Organization", "name": "Acme Interactive" },
  "latestVersion": { "@id": ".../plugins/space-quest/versions/1.1.0", "@type": "SoftwareApplication" },
  "versions": [
    { "@id": ".../plugins/space-quest/versions/1.1.0", "@type": "SoftwareApplication" },
    { "@id": ".../plugins/space-quest/versions/1.0.0", "@type": "SoftwareApplication" }
  ]
}
```

### Versions

| Endpoint                                                                                                                          | Description                                |
| --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| [`/plugins/space-quest/versions`](https://condenser-team.github.io/condenser-registry/plugins/space-quest/versions)               | All versions of a game                     |
| [`/plugins/space-quest/versions/latest`](https://condenser-team.github.io/condenser-registry/plugins/space-quest/versions/latest) | Alias for the latest version               |
| [`/plugins/space-quest/versions/1.1.0`](https://condenser-team.github.io/condenser-registry/plugins/space-quest/versions/1.1.0)   | A specific version (`SoftwareApplication`) |

Each version document includes downloadable assets as `MediaObject` entries with auto-generated `contentSize` and `sha256` for integrity verification:

```json
{
  "@type": "SoftwareApplication",
  "@id": "https://condenser-team.github.io/condenser-registry/plugins/space-quest/versions/1.1.0",
  "name": "Space Quest 1.1.0",
  "version": "1.1.0",
  "datePublished": "2025-02-20",
  "isPartOf": { "@id": ".../plugins/space-quest", "@type": "SoftwareApplication", "name": "Space Quest" },
  "associatedMedia": [
    {
      "@type": "MediaObject",
      "name": "Space Quest 1.1.0 macOS",
      "encodingFormat": "text/plain",
      "license": "https://spdx.org/licenses/MIT.html",
      "operatingSystem": ["macos"],
      "processorRequirements": ["x86_64", "arm64"],
      "contentSize": 44,
      "sha256": "a2d40a411a2036e8f8caccc3bbc1ab21b6abaa78b5c721095404d2f9f23fec84",
      "contentUrl": "https://condenser-team.github.io/.../space-quest-1.1.0-macos.txt"
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

| Endpoint                                                                                                                | Description                    |
| ----------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| [`/plugins/search/genre`](https://condenser-team.github.io/condenser-registry/plugins/search/genre)                     | All genre values               |
| [`/plugins/search/genre/adventure`](https://condenser-team.github.io/condenser-registry/plugins/search/genre/adventure) | Games with genre = `adventure` |
| [`/plugins/search/tags`](https://condenser-team.github.io/condenser-registry/plugins/search/tags)                       | All tag values                 |
| [`/plugins/search/tags/sci-fi`](https://condenser-team.github.io/condenser-registry/plugins/search/tags/sci-fi)         | Games tagged `sci-fi`          |

#### Substring match (name)

Name search uses a per-word inverted index. Each character sequence (up to 5 chars per word) has its own file. Fetch as the user types to power typeahead:

| Endpoint                                                                                                | Description                                              |
| ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| [`/plugins/search/name`](https://condenser-team.github.io/condenser-registry/plugins/search/name)       | All indexed name prefixes                                |
| [`/plugins/search/name/s`](https://condenser-team.github.io/condenser-registry/plugins/search/name/s)   | Games whose name contains a word starting with `s`       |
| [`/plugins/search/name/sp`](https://condenser-team.github.io/condenser-registry/plugins/search/name/sp) | Games whose name contains a word starting with `sp`      |
| [`/authors/search/name/ac`](https://condenser-team.github.io/condenser-registry/authors/search/name/ac) | Publishers whose name contains a word starting with `ac` |

```js
// Typeahead example
const query = "sp";
const res = await fetch(`https://condenser-team.github.io/condenser-registry/plugins/search/name/${query}`);
const { itemListElement } = await res.json();
// itemListElement[].item → matching SoftwareApplication references
```

### Schemas

Machine-readable JSON Schema definitions for all document types:

| Endpoint                                                                                                  | Description                               |
| --------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| [`/schema`](https://condenser-team.github.io/condenser-registry/schema)                                   | All available schemas                     |
| [`/schema/plugins`](https://condenser-team.github.io/condenser-registry/schema/plugins)                   | JSON Schema for a game resource           |
| [`/schema/plugins/versions`](https://condenser-team.github.io/condenser-registry/schema/plugins/versions) | JSON Schema for a game version            |
| [`/schema/authors`](https://condenser-team.github.io/condenser-registry/schema/authors)                   | JSON Schema for a publisher               |
| [`/schema/collection`](https://condenser-team.github.io/condenser-registry/schema/collection)             | JSON Schema for a collection (`ItemList`) |
| [`/schema/search-manifest`](https://condenser-team.github.io/condenser-registry/schema/search-manifest)   | JSON Schema for a search manifest         |
| [`/schema/search-value`](https://condenser-team.github.io/condenser-registry/schema/search-value)         | JSON Schema for a search results page     |

---

## Using this template

### 1. Fork or use as a template

Click **Use this template** on GitHub, then clone your new repo.

### 2. Define your resource types

Edit [`src/resources/`](src/resources/) to add Zod schemas and compilers for your domain. Each resource type defines:

- `resourceSchema` — validates YAML source files
- `versionSchema` — validates version YAML files (optional)
- `compileResource` / `compileVersion` — transforms YAML data into JSON-LD

Register your resource types in [`src/project.ts`](src/project.ts):

```ts
export const projectDefinition: ProjectDefinition = {
  config: {
    apiName: "My Static API",
    apiVersion: "1.0.0",
    rootDomain: "https://myuser.github.io/my-repo",
    resourcesRoot: "resources",
    resourceTypes: {
      plugins: {
        searchAttributes: ["category", "tags", { attribute: "name", strategy: "substring" }],
      },
    },
  },
  schemaRegistry: { plugins: pluginsResourceType },
};
```

### 3. Add YAML content

Create resource files under `resources/<type>/<id>/index.yaml`:

```yaml
# resources/plugins/my-game/index.yaml
type: SoftwareApplication
name: My Game
description: A short description.
category: adventure
author: /authors/my-studio
url: https://mygame.example.com
```

Add version files at `resources/<type>/<id>/versions/<semver>.yaml`:

```yaml
# resources/plugins/my-game/versions/1.0.0.yaml
type: SoftwareApplication
version: 1.0.0
datePublished: 2025-01-01
releaseNotes: Initial release.
files:
  - name: My Game 1.0.0 macOS
    path: /plugins/my-game/files/my-game-1.0.0-macos.zip
    encodingFormat: application/zip
    license: https://spdx.org/licenses/MIT.html
    operatingSystem:
      - macos
    processorRequirements:
      - arm64
      - x86_64
```

`contentSize` and `sha256` are computed automatically from the actual file at build time — no manual entry needed.

### 4. Run locally

```sh
npm install
npm run dev       # watch mode with live rebuild
npm start         # one-shot build → out/
npm run validate  # validate sources without writing output
npm test          # run the test suite
```

### 5. Deploy

Push to `main`. The included GitHub Actions workflow builds `out/` and publishes it to GitHub Pages automatically.

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
    space-quest/
      index.yaml
      index.jpg
      versions/
        1.0.0.yaml
        1.1.0.yaml
      files/
        space-quest-1.0.0-macos.txt
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
