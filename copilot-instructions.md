# GGC Maps - AI Coding Agent Instructions

## Project Overview
Next.js 14 interactive campus map for Georgia Gwinnett College. Modernizes legacy app using SVG floor plans with client-side interactivity. No indoor positioning—static navigation only per client requirements.

## Architecture: SVG-Driven Routing + Event-Based Hover

### Three-Tier Route Structure
```
/ (campus overview)
└── /building/[buildingId] (redirects to first floor)
    └── /building/[buildingId]/[floorId] (floor viewer)
```

**Static generation:** All routes pre-rendered via `generateStaticParams()` using `data/buildings.json` as source of truth.

### Cross-Component Event System (Critical Pattern)
Components communicate via native `CustomEvent` on `window` object—**no prop drilling, no context API**:

**Event Types:**
- `ggcmap-hover` - Highlight elements (payload: `{source: string, selector?: string, ids?: string[]}`)
- `ggcmap-hover-clear` - Remove highlights (payload: `{source: string}`)

**Event Flow:**
1. `Sidebar.js` / `legend.jsx` dispatch events on hover/focus
2. `InlineSvg.js` listens and applies `.hover-highlight` class to matching SVG elements
3. Multiple sources can highlight simultaneously (tracked by source ID)

**Example from Sidebar.js:**
```js
const handlers = {
  onMouseEnter: () => dispatchHoverEvent('ggcmap-hover', 'sidebar:building-a', { ids: ['a'] }),
  onMouseLeave: () => dispatchHoverEvent('ggcmap-hover-clear', 'sidebar:building-a')
};
```

## Component Architecture

### Map Rendering (all wrap `ZoomPan`)
- **CampusMapView** - Campus overview, building click → navigate to floor
- **FloorMapView** - Floor plans, room selection, vertical navigation arrows
- **InlineSvg** - SVG injection, sanitization, event listener for hover system

### Layout & Navigation
- **app/layout.js** - Persistent Header/Sidebar/Legend/Footer (not per-page)
- **Sidebar** - Collapsible nav, dispatches hover events, excludes student housing (IDs: 1000/2000/3000)
- **legend.jsx** - Bilingual (en/es) with `TRANSLATIONS` object, hover dispatching for categories

### Data & Utilities
- **lib/campus.js** - Data access: `getBuildingData()`, `generateBuildingFloorStaticParams()`
- **components/Find.js** - Search with aliases (`cfa` → Chick-fil-A), room highlighting, validation
- **ZoomPan.js** - Custom pan/zoom (no external lib), `data-map-anchor` for auto-fit

## Data Structure

**`data/buildings.json`** (source of truth):
```json
{
  "id": "B",
  "name": "Building B",
  "floors": [
    {"id": "L1", "label": "Level 1", "file": "/BuildingMaps/B/L1.svg"}
  ]
}
```

**`data/rooms.json`** - 19K+ room metadata for search (from SVG extraction)

## SVG Processing Rules

### Security & Sanitization
Both `InlineSvg.js` and `FloorMapView.js` sanitize on load:
```js
.replace(/<script[\s\S]*?<\/script>/gi, '')  // Strip scripts
.replace(/\son\w+="[^"]*"/gi, '')             // Remove on* handlers
.replace(/\s(xlink:)?href=["']\s*javascript:/gi, ' ')  // Remove JS hrefs
```

### Interactive Element Detection
Relies on **CSS classes** (not data attributes):
- Campus: `.building-group`, `.building`
- Floor: `.room-group`, `.room`, `.label`
- Restricted: `.student-housing` (dynamically added)

### ID Resolution
Building IDs case-normalized (`.toUpperCase()`), but SVG IDs vary—always normalize in comparisons.

## Student Housing Restrictions

**Hardcoded restricted IDs:**
```js
['1000', '2000', '3000', 'B1000', '2', '3', 'BUILDING_1000', 'BUILDING_2000', 'BUILDING_3000']
```

- Filtered from sidebar navigation (`Sidebar.js:28`)
- Click shows error: "Student housing layouts are not available to the public"
- CSS class `.student-housing` added dynamically in `CampusMapView.js:42-66`

## CSS Architecture

### Global Variables (`app/global.css`)
Team-member prefixed custom properties:
```css
--justin-globe1: "Georgia", Arial, sans-serif;
--bm-header-bg: #006400;
--sidebar-width: 26rem;
--base-font-size: clamp(14px, 2.5vw, 18px);
```

**Bootstrap 5.3.8** base + custom overrides. No CSS modules—all styles in global.css.

## Development Workflow

### Commands
```bash
npm run dev          # Dev server (may use port 3001/3002 if 3000 occupied)
npm run build        # Production build with static export
npm run extract-rooms # Extract room metadata from SVGs (script currently missing)
```

### Adding Buildings/Floors
1. Place SVG in `public/BuildingMaps/[BuildingId]/[FloorId].svg`
2. Update `data/buildings.json` with new entry
3. Rebuild—routes auto-generate via `generateStaticParams()`
4. Ensure SVG elements have `.building-group`/`.room-group` classes

### SVG Requirements
- Interactive elements need proper classes (see "Interactive Element Detection")
- For student housing: include IDs matching restriction list
- For hover system: element IDs must match JSON building IDs (case-insensitive)

## Common Pitfalls

1. **404 on SVG?** Files must be in `public/BuildingMaps/` (Next.js serves from `public/`)
2. **Hover not working?** Check event payload has `selector` OR `ids` array, and SVG elements have matching IDs
3. **Building click goes nowhere?** ID must exist in `data/buildings.json` and be uppercase in URL
4. **Map won't center?** Add `data-map-anchor` attribute to target SVG element (ZoomPan looks for this)
5. **Floor nav broken?** `buildings.json` must have `floors` array with correct `id` and `file` paths

## Search/Find Component

`Find.js` supports:
- Single letter (e.g., `b`) → navigate to building
- Letter + floor (e.g., `b2`) → navigate to floor
- Letter + room (e.g., `b2210`) → navigate and highlight room
- Aliases: `cfa`/`chick fil a` → specific room, `gym`, `book` (library), etc.
- `help` → show search guide

Room highlighting uses retry mechanism (`highlightWithRetry()`) to handle async SVG loading.

## Testing Scenarios

**Restricted access:** Visit `/building/1000` or click student housing—should show error, not navigate

**Multi-floor:** Visit `/building/B/L1` → arrows cycle L1→L2→L3 (disable on first/last)

**Bilingual legend:** Toggle EN/ES—reads `data/legend/legendItems.{en|es}.json`

**Search:** Type `b2210` in Find → should navigate to Building B, Floor 2, highlight room 2210
