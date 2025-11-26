# mySquad.ps (Spectrum)

A UXP Photoshop plugin built with React and Adobe Spectrum Web Components.

## Project Structure

```
src/
├── index.js                 # Entry point - imports SWC components & renders App
├── App.js                   # Root component with sp-theme wrapper
├── polyfills.js             # UXP polyfills (matchMedia, etc.)
├── styles.css               # Global styles
├── config/
│   └── index.js             # Centralized configuration (API URLs, feature flags)
├── lib/
│   ├── index.js             # Barrel export
│   └── supabase-api.js      # Supabase REST API client
└── components/
    ├── index.js             # Barrel export for all components
    ├── Header.jsx           # App header with logo
    ├── folder-details/      # Folder/task details feature
    │   ├── api/
    │   │   └── folderApi.js # API calls (webhook, Photoshop path extraction)
    │   ├── components/
    │   │   └── FolderDetailsCard.jsx
    │   └── hooks/
    │       └── useFolderDetails.js
    ├── task-details/
    │   └── components/
    │       └── TaskDetailsCard.jsx
    └── actions/
        └── components/
            └── ActionsCard.jsx
```

## Adding a New Component

### 1. Create the component directory structure

```bash
mkdir -p src/components/my-feature/components
```

### 2. Create the component file

```jsx
// src/components/my-feature/components/MyFeatureCard.jsx
import React from 'react';

const MyFeatureCard = ({ data }) => {
  return (
    <sp-card heading="My Feature">
      <div slot="description">
        {/* Your content here */}
      </div>
    </sp-card>
  );
};

export default MyFeatureCard;
```

### 3. Export from the barrel file

```js
// src/components/index.js
export { default as MyFeatureCard } from './my-feature/components/MyFeatureCard';
```

### 4. Use in App.js

```jsx
import { MyFeatureCard } from './components';

// In the render:
<MyFeatureCard data={someData} />
```

---

## Adding Spectrum Web Components

Spectrum Web Components (SWC) provide Adobe's design system for UXP plugins.

**Documentation:** https://opensource.adobe.com/spectrum-web-components/

### Step 1: Check if a UXP wrapper exists

UXP requires special wrappers for some components. Check if `@swc-uxp-wrappers/{component}` exists:

```bash
npm search @swc-uxp-wrappers
```

**Use wrapper if available:**
```bash
npm install @swc-uxp-wrappers/button @swc-uxp-wrappers/card
```

**Use standard SWC if no wrapper:**
```bash
npm install @spectrum-web-components/badge @spectrum-web-components/progress-bar
```

### Step 2: Import in `src/index.js`

```js
// UXP Wrappers (preferred when available)
import '@swc-uxp-wrappers/card/sp-card.js';
import '@swc-uxp-wrappers/button/sp-button.js';
import '@swc-uxp-wrappers/action-button/sp-action-button.js';

// Standard SWC (when no wrapper exists)
import '@spectrum-web-components/badge/sp-badge.js';
import '@spectrum-web-components/progress-bar/sp-progress-bar.js';
```

### Step 3: Use in JSX

```jsx
// Note: Use "class" not "className" for elements inside web component slots
<sp-card heading="Title">
  <div slot="description" class="my-class">
    <sp-badge size="s" variant="informative">Badge Text</sp-badge>
  </div>
  <sp-action-group slot="footer">
    <sp-action-button>Click Me</sp-action-button>
  </sp-action-group>
</sp-card>
```

### Common Components

| Component | Package | Import |
|-----------|---------|--------|
| Card | `@swc-uxp-wrappers/card` | `@swc-uxp-wrappers/card/sp-card.js` |
| Button | `@swc-uxp-wrappers/button` | `@swc-uxp-wrappers/button/sp-button.js` |
| Action Button | `@swc-uxp-wrappers/action-button` | `@swc-uxp-wrappers/action-button/sp-action-button.js` |
| Action Group | `@swc-uxp-wrappers/action-group` | `@swc-uxp-wrappers/action-group/sp-action-group.js` |
| Menu | `@swc-uxp-wrappers/menu` | `@swc-uxp-wrappers/menu/sp-menu.js` |
| Action Menu | `@spectrum-web-components/action-menu` | `@spectrum-web-components/action-menu/sp-action-menu.js` |
| Badge | `@spectrum-web-components/badge` | `@spectrum-web-components/badge/sp-badge.js` |
| Progress Bar | `@spectrum-web-components/progress-bar` | `@spectrum-web-components/progress-bar/sp-progress-bar.js` |

### Handling Events on Web Components

React doesn't automatically bind events to web components. Use `useRef` and `useEffect`:

```jsx
import React, { useRef, useEffect } from 'react';

const MyComponent = ({ onAction }) => {
  const buttonRef = useRef(null);

  useEffect(() => {
    const button = buttonRef.current;
    if (button) {
      const handleClick = () => onAction();
      button.addEventListener('click', handleClick);
      return () => button.removeEventListener('click', handleClick);
    }
  }, [onAction]);

  return <sp-action-button ref={buttonRef}>Do Something</sp-action-button>;
};
```

---

## Calling APIs

### Webhook API (Current)

The app uses a webhook endpoint for task data:

```js
// src/components/folder-details/api/folderApi.js

const WEBHOOK_BASE_URL = 'https://sisx.thesqd.com/webhook';

export const getTaskDetails = async (taskId) => {
  const url = `${WEBHOOK_BASE_URL}/ps-plugin-get-task-details?taskid=${encodeURIComponent(taskId)}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status}`);
  }

  return response.json();
};
```

### Supabase RPC (Available)

For Supabase database calls, use the REST API client:

```js
// src/lib/supabase-api.js
import { config } from '../config';

export const callRpc = async (functionName, params = {}) => {
  const { url, anonKey } = config.api.supabase;

  const response = await fetch(`${url}/rest/v1/rpc/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': anonKey,
      'Authorization': `Bearer ${anonKey}`,
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`RPC error: ${response.status}`);
  }

  return response.json();
};
```

**Usage:**
```js
import { callRpc } from '../../../lib';

const data = await callRpc('get_task_details_v3', { p_task_id: taskId });
```

### Adding New API Endpoints

1. Add the domain to `manifest.json`:
```json
{
  "requiredPermissions": {
    "network": {
      "domains": [
        "https://your-api-domain.com"
      ]
    }
  }
}
```

2. Create an API function in the relevant feature's `api/` folder.

---

## Photoshop API - Adding Actions to Buttons

### Getting the Photoshop App Instance

```js
const getPhotoshopApp = () => {
  try {
    const photoshop = require('photoshop');
    return photoshop.app;
  } catch (e) {
    console.error('Photoshop not available');
    return null;
  }
};
```

### Common Photoshop Actions

#### Get Active Document Info

```js
const getDocumentInfo = () => {
  const app = getPhotoshopApp();
  if (!app || !app.activeDocument) return null;

  const doc = app.activeDocument;
  return {
    name: doc.name,
    width: doc.width,
    height: doc.height,
    path: doc.fullName?.fsName,
    layers: doc.layers.length,
  };
};
```

#### Create a New Layer

```js
const createLayer = async (layerName) => {
  const app = getPhotoshopApp();
  const { executeAsModal } = require('photoshop').core;

  await executeAsModal(async () => {
    const doc = app.activeDocument;
    const layer = await doc.createLayer({ name: layerName });
    return layer;
  }, { commandName: 'Create Layer' });
};
```

#### Resize Document

```js
const resizeDocument = async (width, height) => {
  const { executeAsModal } = require('photoshop').core;
  const { app } = require('photoshop');

  await executeAsModal(async () => {
    await app.activeDocument.resizeImage(width, height);
  }, { commandName: 'Resize Image' });
};
```

#### Run a Photoshop Action

```js
const runAction = async (actionName, actionSet) => {
  const { executeAsModal } = require('photoshop').core;
  const { app } = require('photoshop');

  await executeAsModal(async () => {
    await app.activeDocument.executeAction(actionName, actionSet);
  }, { commandName: `Run ${actionName}` });
};
```

#### Save Document

```js
const saveDocument = async () => {
  const { executeAsModal } = require('photoshop').core;
  const { app } = require('photoshop');

  await executeAsModal(async () => {
    await app.activeDocument.save();
  }, { commandName: 'Save Document' });
};
```

#### Export as PNG

```js
const exportAsPng = async (filePath) => {
  const { executeAsModal } = require('photoshop').core;
  const { app } = require('photoshop');
  const fs = require('uxp').storage.localFileSystem;

  await executeAsModal(async () => {
    const file = await fs.getFileForSaving(filePath);
    await app.activeDocument.saveAs.png(file, { compression: 6 });
  }, { commandName: 'Export PNG' });
};
```

### Wiring Actions to UI Buttons

#### Example: ActionsCard with Photoshop Actions

```jsx
// src/components/actions/components/ActionsCard.jsx
import React, { useRef, useEffect } from 'react';

const getPhotoshopApp = () => {
  try {
    return require('photoshop').app;
  } catch {
    return null;
  }
};

const ActionsCard = () => {
  const newLayerRef = useRef(null);
  const saveRef = useRef(null);
  const flattenRef = useRef(null);

  useEffect(() => {
    const { executeAsModal } = require('photoshop').core;

    // New Layer button
    const newLayerBtn = newLayerRef.current;
    if (newLayerBtn) {
      const handleNewLayer = async () => {
        const app = getPhotoshopApp();
        if (!app?.activeDocument) return;

        await executeAsModal(async () => {
          await app.activeDocument.createLayer({ name: 'New Layer' });
        }, { commandName: 'Create Layer' });
      };
      newLayerBtn.addEventListener('click', handleNewLayer);
    }

    // Save button
    const saveBtn = saveRef.current;
    if (saveBtn) {
      const handleSave = async () => {
        const app = getPhotoshopApp();
        if (!app?.activeDocument) return;

        await executeAsModal(async () => {
          await app.activeDocument.save();
        }, { commandName: 'Save' });
      };
      saveBtn.addEventListener('click', handleSave);
    }

    // Flatten button
    const flattenBtn = flattenRef.current;
    if (flattenBtn) {
      const handleFlatten = async () => {
        const app = getPhotoshopApp();
        if (!app?.activeDocument) return;

        await executeAsModal(async () => {
          await app.activeDocument.flatten();
        }, { commandName: 'Flatten' });
      };
      flattenBtn.addEventListener('click', handleFlatten);
    }

    return () => {
      // Cleanup listeners
    };
  }, []);

  return (
    <sp-card heading="Actions">
      <sp-action-group slot="footer" class="action-group-footer">
        <sp-action-button ref={newLayerRef}>New Layer</sp-action-button>
        <sp-action-button ref={saveRef}>Save</sp-action-button>
        <sp-action-button ref={flattenRef}>Flatten</sp-action-button>
      </sp-action-group>
    </sp-card>
  );
};

export default ActionsCard;
```

### Photoshop API Reference

**Full UXP Photoshop API Documentation:**
https://developer.adobe.com/photoshop/uxp/2022/ps_reference/

**Key namespaces:**
- `require('photoshop').app` - Application object (documents, fonts, etc.)
- `require('photoshop').core` - Core utilities (`executeAsModal`)
- `require('photoshop').action` - BatchPlay for advanced operations
- `require('uxp').storage` - File system access
- `require('uxp').shell` - Open URLs externally

### Using BatchPlay for Advanced Operations

For operations not available in the DOM API, use BatchPlay:

```js
const { batchPlay } = require('photoshop').action;
const { executeAsModal } = require('photoshop').core;

const applyGaussianBlur = async (radius) => {
  await executeAsModal(async () => {
    await batchPlay([
      {
        _obj: 'gaussianBlur',
        radius: { _unit: 'pixelsUnit', _value: radius },
        _options: { dialogOptions: 'dontDisplay' }
      }
    ], {});
  }, { commandName: 'Gaussian Blur' });
};
```

---

## Development

### Setup
```bash
npm install
```

### Build
```bash
npm run build        # Production build
npm run build:dev    # Development build
npm run dev          # Watch mode
```

### Load in Photoshop
1. Open UXP Developer Tool
2. Click "Add Plugin" → select the project folder
3. Click "Load" to run the plugin

### Environment Variables

Create a `.env` file (see `.env.example`):
```
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```

---

## Key Notes for AI Agents

1. **Web Components use `class` not `className`** when inside slot content
2. **Event handlers require `useRef` + `useEffect`** pattern for web components
3. **Photoshop operations require `executeAsModal`** wrapper
4. **Network requests require domains in `manifest.json`**
5. **UXP's fetch is limited** - don't use Supabase SDK, use REST API directly
6. **SWC wrappers preferred** - check `@swc-uxp-wrappers` before using standard `@spectrum-web-components`
