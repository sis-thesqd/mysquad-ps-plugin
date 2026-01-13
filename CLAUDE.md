# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

```bash
npm run build        # Production build
npm run build:dev    # Development build
npm run dev          # Watch mode with auto-rebuild
npm run clean        # Remove generated files (bundle.js, index.html)
npm run package      # Build and create .ccx package for distribution
```

## Loading the Plugin in Photoshop

1. Open UXP Developer Tool
2. Click "Add Plugin" → select the project folder
3. Click "Load" to run the plugin

## Architecture Overview

This is a **UXP Photoshop plugin** built with React 18 and Adobe Spectrum Web Components. UXP (Unified Extensibility Platform) is Adobe's plugin framework that replaces CEP.

### Key Architectural Constraints

- **No standard browser APIs** - UXP has limited web API support. `matchMedia` requires a polyfill (`src/polyfills.js`). `localStorage` is available but should be wrapped with try/catch.
- **No npm SDK clients** - Supabase SDK doesn't work; use REST API calls directly (`src/lib/supabase-api.js`).
- **Webpack bundles to single file** - Output is `bundle.js` at project root (not `/dist`). Webpack config uses `LimitChunkCountPlugin` to force single bundle.
- **External modules** - `photoshop`, `uxp`, and `os` are UXP runtime modules marked as externals in webpack config, not npm packages.

### CSS Constraints in UXP

- **Never use `gap` property** - UXP does not support CSS `gap`. Always use `margin` for spacing between elements.
- **Use `margin-right` on items** with `:last-child { margin-right: 0; }` for horizontal spacing
- **Use `margin-bottom` on items** with `:last-child { margin-bottom: 0; }` for vertical spacing

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
├── hooks/         # Custom hooks
├── services/      # Business logic & Photoshop operations
└── utils/         # Helper functions
```

All components are exported via barrel file at `src/components/index.js`.

### Main Features

1. **Folder Details** (`src/components/folder-details/`) - Extracts task ID from file path, displays task metadata from webhook API
2. **Task Details** (`src/components/task-details/`) - Displays detailed task information
3. **Artboard Generator** (`src/components/artboard-generator/`) - Generates multiple artboard sizes from source templates using Photoshop batchPlay
4. **Task Search** - Fallback dialog when task ID cannot be extracted from file path

### Task ID Extraction

The plugin extracts task IDs from the Photoshop document path using this pattern:
- Path structure: `/path/to/{taskName - taskId}/subfolder/file.psd`
- Extraction: Looks for last " - " in the third-to-last path segment
- Fallback: If extraction fails, shows search dialog (`TaskSearchDialog`) to manually select task

## Configuration

- **Environment variables**: `.env` file with `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY`
- **Feature flags**: `src/config/index.js` - Controls features, activity logging, tabs, and default sizes
- **Plugin manifest**: `manifest.json` (requires `manifestVersion: 5` and `enableSWCSupport: true`)

### Storage & Caching

The plugin uses `localStorage` (via `src/utils/storage.js`) to persist:
- Active tab selection (survives plugin reload)
- Task size configurations (15-minute cache)
- Generator configurations per task (survives plugin reload)

All storage functions include try/catch for UXP compatibility.

## User Activity Logging (Required)

**All new features must log user activity** to the `psp_user_activity` Supabase table.

### How to Log Activity

```js
import { logActivity, ACTIVITY_TYPES } from '../lib/activity-logger';

// Log an activity event
await logActivity('your_activity_type', {
  taskId: optionalTaskId,    // Optional: task ID if known
  filePath: optionalFilePath, // Optional: auto-detected if not provided
  narrative: 'User did something specific', // Required: 1-liner description
});
```

### Table Schema (`psp_user_activity`)

| Column | Type | Description |
|--------|------|-------------|
| `user` | text | System username (auto-extracted from file path) |
| `activity_type` | enum | Event type (plugin_load, tab_switch, task_fetch, generator_use) |
| `task_id` | text | ClickUp task ID if available |
| `file_path` | text | Full document path |
| `narrative` | text | 1-liner description of what the user did |
| `created_at` | timestamptz | Auto-generated timestamp |

### Activity Type Naming Convention

Use snake_case for activity types. Examples:
- `plugin_load` - Plugin initialization
- `tab_switch` - Tab navigation
- `task_fetch` - Task data retrieval
- `generator_use` - Artboard generation
- `{feature}_action` - New feature actions

### Implementation Requirements

1. Import `logActivity` from `src/lib/activity-logger.js`
2. Call `logActivity()` at key interaction points
3. Use descriptive activity type names
4. Wrap in try/catch if logging is critical to the flow
5. Activity logging fails silently to not interrupt user workflow

## Artboard Generator Architecture

The artboard generator (`src/components/artboard-generator/`) is a multi-step wizard that creates multiple artboard sizes from source templates.

### Core Concepts

1. **Source Types** - Three template types: landscape (16:9), portrait (9:16), square (1:1)
2. **Layer Roles** - Each source assigns layers to three roles: background, title, and overlays (corner pinning not yet supported)
3. **Auto-detection** - Layer names are matched against standardized patterns: **BKG** → background, **TEXT** → title, **ADJUST** → overlays (case-insensitive)
4. **Batch Generation** - Uses `batchArtboardService.js` to duplicate artboards and transform layers in bulk

### Services

- **`artboardGenerator.js`** - Core generation logic with batchPlay commands for creating/transforming artboards
- **`batchArtboardService.js`** - Batch generation service using duplicate + resize + transform pattern (follows Photoshop action recording)
- **`layerDetection.js`** - Auto-detection of layer roles based on name patterns (detects BKG, TEXT, ADJUST only)

### Key Implementation Details

- **batchPlay API** - Uses Photoshop's batchPlay for low-level operations not available in DOM API
- **Layer ID tracking** - After duplicating artboards, MUST get new layer IDs from duplicate before transforming (selecting by name would affect source layers)
- **Scale modes** - Supports cover (fill), contain (fit), and relative (diagonal ratio) scaling
- **Print support** - Adds bleed, crop marks, and guides for print artboards
- **Layout system** - Auto-arranges generated artboards in grid layout grouped by type

### Wizard Steps

1. **Sources** - Select source artboards and assign layer roles
2. **Sizes** - Choose target sizes (fetched from webhook or defaults)
3. **Settings** - Configure generation options (layout, print settings)
4. **Generate** - Execute batch generation with progress tracking
