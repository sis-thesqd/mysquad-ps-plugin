# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

```bash
npm run build        # Production build
npm run build:dev    # Development build
npm run dev          # Watch mode with auto-rebuild
npm run clean        # Remove generated files (bundle.js, index.html)
```

## Loading the Plugin in Photoshop

1. Open UXP Developer Tool
2. Click "Add Plugin" → select the project folder
3. Click "Load" to run the plugin

## Architecture Overview

This is a **UXP Photoshop plugin** built with React 18 and Adobe Spectrum Web Components. UXP (Unified Extensibility Platform) is Adobe's plugin framework that replaces CEP.

### Key Architectural Constraints

- **No standard browser APIs** - UXP has limited web API support. `matchMedia` requires a polyfill (`src/polyfills.js`).
- **No npm SDK clients** - Supabase SDK doesn't work; use REST API calls directly (`src/lib/supabase-api.js`).
- **Webpack bundles to single file** - Output is `bundle.js` at project root (not `/dist`).
- **External modules** - `photoshop`, `uxp`, and `os` are UXP runtime modules, not npm packages.

### Web Components in React

Spectrum Web Components don't integrate natively with React's event system:

1. **Use `class` not `className`** for elements inside web component slots
2. **Event handlers require `useRef` + `useEffect`** with manual `addEventListener`/`removeEventListener`
3. **Prefer `@swc-uxp-wrappers/*`** packages over `@spectrum-web-components/*` when available
4. **Import components in `src/index.js`** before use (e.g., `import '@swc-uxp-wrappers/card/sp-card.js'`)

### Photoshop API Pattern

All Photoshop operations must be wrapped in `executeAsModal`:

```js
const { executeAsModal } = require('photoshop').core;
await executeAsModal(async () => {
  // Photoshop operations here
}, { commandName: 'Operation Name' });
```

### Network Permissions

API domains must be whitelisted in `manifest.json` under `requiredPermissions.network.domains`.

## Component Structure

Features follow this pattern:
```
src/components/{feature}/
├── api/           # API calls
├── components/    # React components
└── hooks/         # Custom hooks
```

All components are exported via barrel file at `src/components/index.js`.

## Configuration

- **Environment variables**: `.env` file with `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY`
- **Feature flags**: `src/config/index.js`
- **Plugin manifest**: `manifest.json` (requires `manifestVersion: 5` and `enableSWCSupport: true`)
