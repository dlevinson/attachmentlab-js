# ATTACHMENTLAB

ATTACHMENTLAB is a browser-openable STREET-style module for exploring
access-based transport network growth. The release bundle is designed to run
directly from [`web/index.html`](web/index.html) with a companion module
landing page at [`web/documentation.html`](web/documentation.html).

## What This Repository Contains

- [`src/standalone/browser-core.js`](src/standalone/browser-core.js): shared standalone engine.
- [`src/standalone/browser-app.js`](src/standalone/browser-app.js): browser UI source for the module.
- [`tools/build-standalone-web.mjs`](tools/build-standalone-web.mjs): build script that regenerates the shipped runtime.
- [`web/documentation.html`](web/documentation.html): module documentation page.
- [`web/index.html`](web/index.html): runnable browser app.
- [`web/main.js`](web/main.js): generated standalone runtime.

## Canonical Locations

- Code module: `STREET-JS/repos/attachmentlab-js`
- Paper and research workspace: `Code/attachmentlab-paper`

The old `Code/attachmentlab-js` path is intentionally left as a compatibility
symlink so older `file://` links and local bookmarks still resolve.

## Run The Module

Open the module landing page:

```bash
open web/documentation.html
```

Or open the app directly:

```bash
open web/index.html
```

## Rebuild The Standalone Runtime

If you edit the standalone source, rebuild the shipped runtime with:

```bash
npm run build
```

This regenerates [`web/main.js`](web/main.js) from:

- [`src/standalone/browser-core.js`](src/standalone/browser-core.js)
- [`src/standalone/browser-app.js`](src/standalone/browser-app.js)

## Notes

- The web bundle is designed to travel as a small self-contained module folder.
- The app uses CDN-hosted copies of Cytoscape.js and D3, so first load normally
  requires an internet connection.
- Paper manuscripts, benchmark outputs, and broader research artifacts are kept
  outside this module repository in the separate paper workspace.
