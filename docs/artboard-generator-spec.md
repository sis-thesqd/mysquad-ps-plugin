# Photoshop UXP Artboard Generator

## Overview

A Photoshop UXP plugin that generates multiple artboards from an API endpoint, automatically scaling and positioning content from source artboards based on aspect ratio and layer roles.

## Core Workflow

1. Designer creates three source artboards: landscape (16:9), portrait (9:16), square (1:1)
2. Designer assigns layer groups to roles (background, title, overlays, corners)
3. Plugin fetches size configurations from API
4. Plugin creates artboards, copying content from the appropriate source based on target aspect ratio
5. Content scales proportionally (never stretched) with intelligent positioning

---

## API Endpoint Format

The plugin fetches artboard configurations from an API endpoint. Expected JSON response:

```json
[
  {
    "width": 1200,
    "height": 628,
    "name": "FB_Link_Preview",
    "type": "social"
  },
  {
    "width": 1080,
    "height": 1920,
    "name": "IG_Story",
    "type": "social"
  },
  {
    "width": 300,
    "height": 250,
    "name": "Medium_Rectangle",
    "type": "display"
  },
  {
    "width": 1800,
    "height": 2700,
    "name": "Poster_6x9",
    "type": "print",
    "requiresBleed": true,
    "bleed": 0.125,
    "bleedUnit": "inches"
  }
]
```

### Size Object Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| width | number | Yes | Width in pixels (trim size for print) |
| height | number | Yes | Height in pixels (trim size for print) |
| name | string | No | Artboard name (defaults to `{type}_{width}x{height}`) |
| type | string | No | Category for grouping: social, display, video, email, print, web, other |
| requiresBleed | boolean | No | Print only - whether to add bleed area |
| bleed | number | No | Bleed amount (default: 0.125) |
| bleedUnit | string | No | Unit for bleed: inches, mm, pixels (default: inches) |

---

## Source Configuration

The plugin requires three source artboards to be set up in the document:

```javascript
{
  landscape: {
    artboard: "Source_16x9",      // Artboard name in document
    layers: {
      background: "Background",    // Layer/group name
      title: "Title",
      overlays: "Overlays",
      cornerTopLeft: "Logo",
      cornerTopRight: null,        // Optional - null or omit if not used
      cornerBottomLeft: null,
      cornerBottomRight: "CTA"
    }
  },
  portrait: {
    artboard: "Source_9x16",
    layers: {
      background: "Background",
      title: "Title",
      overlays: "Overlays",
      cornerTopLeft: "Logo",
      cornerBottomRight: "CTA"
    }
  },
  square: {
    artboard: "Source_1x1",
    layers: {
      background: "Background",
      title: "Title",
      overlays: "Overlays",
      cornerTopLeft: "Logo",
      cornerBottomRight: "CTA"
    }
  }
}
```

### Source Selection Logic

Target artboards automatically use the source with the closest aspect ratio:

| Target Ratio | Source Used |
|--------------|-------------|
| < 0.85 | portrait |
| 0.85 - 1.15 | square |
| > 1.15 | landscape |

---

## Layer Roles

Each layer role has specific scaling and positioning behavior. All scaling is proportional (uniform X and Y - never stretched).

| Role | Scale Mode | Anchor | Behavior |
|------|------------|--------|----------|
| background | cover | center | Scales to cover entire artboard, overflow cropped |
| title | contain | center | Scales to fit entirely inside artboard, centered |
| overlays | cover | center | Same as background |
| cornerTopLeft | relative | top-left | Scales with artboard, maintains % margin from edge |
| cornerTopRight | relative | top-right | Scales with artboard, maintains % margin from edge |
| cornerBottomLeft | relative | bottom-left | Scales with artboard, maintains % margin from edge |
| cornerBottomRight | relative | bottom-right | Scales with artboard, maintains % margin from edge |

### Scale Mode Definitions

**cover**: Scale up using `Math.max(widthScale, heightScale)` - content covers entire artboard, edges may be cropped

**contain**: Scale down using `Math.min(widthScale, heightScale)` - content fits entirely inside, may have margins

**relative**: Scale using diagonal ratio `√(targetW² + targetH²) / √(sourceW² + sourceH²)` - consistent visual scaling across different aspect ratios

### Corner Element Positioning

Corner elements maintain their relative margin from edges as a percentage of artboard size:

```
Source: 1920x1080, Logo at (50, 40)
- Left margin: 50/1920 = 2.6%
- Top margin: 40/1080 = 3.7%

Target: 960x540
- New position: (25, 20) - same percentages

Target: 1080x1920 (portrait)
- New position: (28, 71) - percentages applied to new dimensions
```

---

## Print Settings

Print artboards support bleed areas and crop marks.

### Default Print Settings

```javascript
{
  bleed: 0.125,           // inches
  bleedUnit: "inches",    // inches, mm, pixels
  cropMarkLength: 0.25,   // inches
  cropMarkWeight: 1,      // pixels
  cropMarkColor: { r: 0, g: 0, b: 0 },
  cropMarkOffset: 0.0625  // inches - gap between trim edge and mark
}
```

### Print Artboard Structure

```
┌─────────────────────────────────────┐
│            CROP MARKS               │
│  ┼───┬─────────────────┬───┼       │
│      │                 │            │
│      │   TRIM AREA     │            │
│      │   (finish size) │            │
│      │                 │            │
│      │   Corners stay  │            │
│      │   relative to   │            │
│      │   trim edges    │            │
│      │                 │            │
│  ┼───┴─────────────────┴───┼       │
│            BLEED AREA               │
│    (background extends here)        │
└─────────────────────────────────────┘
```

### Print Behavior

- Artboard size = trim size + (bleed × 2)
- Background/overlays fill entire artboard including bleed
- Title scales to fit within trim area
- Corner elements position relative to trim edges (not bleed edges)
- Crop marks placed outside bleed area
- Crop marks grouped into "Crop Marks" layer group

---

## Grid Layout

Artboards are arranged in a grid, grouped by type category.

### Layout Options

```javascript
{
  columns: 4,        // Artboards per row
  gap: 100,          // Pixels between artboards
  groupGap: 300,     // Pixels between type groups
  startX: 2500,      // X offset from source artboards
  typeOrder: ["social", "display", "video", "email", "print", "web", "other"]
}
```

### Sorting

- Groups arranged in typeOrder sequence
- Within each group: sorted by aspect ratio (landscape first)
- Grid accounts for actual artboard size including bleed when calculating positions

---

## Plugin UI Requirements

### Source Selection Panel

Dropdowns populated with existing artboards/layers in document:

- Source Artboard selector (one per aspect ratio: landscape, portrait, square)
- Layer role selectors:
  - Background
  - Title / Main Content
  - Overlays
  - Corner Top Left (optional)
  - Corner Top Right (optional)
  - Corner Bottom Left (optional)
  - Corner Bottom Right (optional)

### Generation Options

- API endpoint URL input
- Columns per row
- Gap between artboards
- Gap between groups

---

## Key Technical Notes

### Execute As Modal

All Photoshop modifications must be wrapped in `executeAsModal`:

```javascript
await require("photoshop").core.executeAsModal(async (context) => {
  // All batchPlay calls here
}, { commandName: "Generate Artboards" });
```

### History Suspension

Entire operation wrapped in single history state for one-step undo:

```javascript
const suspensionID = await context.hostControl.suspendHistory({
  documentID: app.activeDocument.id,
  name: "Generate Artboards"
});

try {
  // All operations
} finally {
  await context.hostControl.resumeHistory(suspensionID);
}
```

### Manifest Permissions

Required in manifest.json for API calls:

```json
{
  "requiredPermissions": {
    "network": {
      "domains": ["your-api-domain.com"]
    }
  }
}
```

---

## Function Reference

### Main Entry Point

```javascript
generateArtboards(apiEndpoint, sourceConfig, options)
```

### Core Functions

| Function | Purpose |
|----------|---------|
| `calculateProportionalScale()` | Determine uniform scale factor |
| `getRelativePosition()` | Calculate layer position as % of artboard |
| `calculatePosition()` | Compute final position based on anchor |
| `createArtboard()` | Create artboard via batchPlay |
| `processLayerRole()` | Duplicate, scale, position a layer |
| `createArtboardWithRoles()` | Full artboard creation with all layers |
| `createCropMarks()` | Generate print crop marks |
| `calculateGridPositions()` | Compute grid layout positions |
| `groupByType()` | Sort sizes into type categories |

### Unit Conversion

```javascript
unitsToPixels(value, unit, resolution)
// unit: "inches" | "mm" | "pixels"
// resolution: document PPI (default 300)
```

---

## Example Usage

```javascript
generateArtboards(
  "https://api.example.com/artboard-sizes",
  {
    landscape: {
      artboard: "Source_16x9",
      layers: {
        background: "Background",
        title: "Title",
        overlays: "Overlays",
        cornerTopLeft: "Logo",
        cornerBottomRight: "CTA"
      }
    },
    portrait: {
      artboard: "Source_9x16",
      layers: {
        background: "Background",
        title: "Title",
        cornerTopLeft: "Logo",
        cornerBottomRight: "CTA"
      }
    },
    square: {
      artboard: "Source_1x1",
      layers: {
        background: "Background",
        title: "Title",
        cornerTopLeft: "Logo",
        cornerBottomRight: "CTA"
      }
    }
  },
  {
    columns: 4,
    gap: 100,
    groupGap: 300,
    startX: 2500,
    typeOrder: ["social", "display", "video", "email", "print"],
    printSettings: {
      bleed: 0.125,
      bleedUnit: "inches",
      cropMarkLength: 0.25,
      cropMarkWeight: 1,
      cropMarkColor: { r: 0, g: 0, b: 0 },
      cropMarkOffset: 0.0625
    }
  }
);
```

---

## Dependencies

- Photoshop 2022+ (v23+)
- UXP API v4.1+
- Network access for API calls

## Files

- `manifest.json` - Plugin configuration
- `index.html` - UI panel
- `index.js` - Main plugin code
- `artboard-generator.js` - Core generation logic
