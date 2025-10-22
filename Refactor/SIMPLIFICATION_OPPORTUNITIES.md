# GGC Maps - Simplification Opportunities

## Overview
This document identifies areas of the project that can be simplified to improve code maintainability, reduce complexity, and enhance performance.

---

## 1. **Event System Simplification** ⭐ HIGH PRIORITY

### Current State
`lib/eventSystem.js` has three separate functions that could be consolidated:
```javascript
// Current: 3 functions + helper logic
- dispatchHoverEvent(type, source, detail)
- createHoverHandlers(source, detail)
- clearHoverEvents(source)
```

### Issue
- **Redundancy**: `clearHoverEvents()` duplicates logic from `dispatchHoverEvent()`
- **Tight coupling**: Components must know event type names ('ggcmap-hover', 'ggcmap-hover-clear')
- **Verbosity**: Creating handlers requires calling a wrapper function instead of using hooks or utilities

### Simplification Opportunity
**Create a unified event manager class:**
```javascript
class HoverEventManager {
  static highlight(source, ids, selector) {
    window.dispatchEvent(new CustomEvent('ggcmap-hover', { 
      detail: { source, ids, selector } 
    }));
  }
  
  static clear(source) {
    window.dispatchEvent(new CustomEvent('ggcmap-hover-clear', { 
      detail: { source } 
    }));
  }
}
```

### Benefit
- ✅ Single source of truth for events
- ✅ Cleaner API at call sites
- ✅ Easier to add new event types in future
- ✅ Less cognitive load when using events

---

## 2. **campus.js - Data Access Layer Consolidation** ⭐ HIGH PRIORITY

### Current State
`lib/campus.js` has 4 functions with overlapping purposes:
```javascript
getAllBuildings()          // Returns all buildings
getBuildingById(id)        // Find by ID
getBuildingData(buildingId)// Find by ID (duplicate!)
generateBuildingFloorStaticParams()  // Extract params
```

### Issue
- **Duplicate functions**: `getBuildingById()` and `getBuildingData()` do the same thing
- **Naming inconsistency**: `id` vs `buildingId` parameters
- **Unused abstraction**: Directly importing JSON is simpler than this wrapper

### Simplification Opportunity
**Reduce to 2 functions:**
```javascript
export function getAllBuildings() { return buildingsData; }
export function findBuilding(id) { return buildingsData.find(b => b.id === id) || null; }
export function generateStaticParams() { /* existing logic */ }
```

### Benefit
- ✅ Eliminates confusion between `getBuildingById` and `getBuildingData`
- ✅ Clearer naming
- ✅ Reduced file size
- ✅ 30% fewer lines in the module

---

## 3. **Sidebar.js - Duplicated Hover Configuration** ⭐ MEDIUM PRIORITY

### Current State
```javascript
const SPECIAL_HOVER_SELECTORS = {
  '1000': '#BUILDING_1000, [id="1000"], [id="b1000"]',
  '2000': '#BUILDING_2000, [id="2000"], [id="2"]',
  '3000': '#BUILDING_3000, [id="3000"], [id="3"]',
};

const buildHoverDetail = (building) => {
  const selector = SPECIAL_HOVER_SELECTORS[building.id];
  if (selector) return { selector };
  const hoverId = building.id.toLowerCase();
  return { ids: [hoverId] };
};

// Then manually: createHandlers(item) -> createHoverHandlers(...)
```

### Issue
- **Duplicated IDs**: Same restriction list exists in `constants.js` and here as selectors
- **Logic spread**: Hover configuration scattered across multiple files
- **Repetitive**: `createHandlers()` is a one-liner that doesn't add value

### Simplification Opportunity
**Centralize hover config in constants:**
```javascript
// lib/constants.js
export const HOVER_CONFIG = {
  restricted: {
    '1000': '#BUILDING_1000, [id="1000"], [id="b1000"]',
    '2000': '#BUILDING_2000, [id="2000"], [id="2"]',
    '3000': '#BUILDING_3000, [id="3000"], [id="3"]',
  },
};

// In Sidebar.js - replace buildHoverDetail() with direct config lookup
```

### Benefit
- ✅ Single source of truth for restricted building hovering
- ✅ Eliminates `SPECIAL_HOVER_SELECTORS` duplication
- ✅ Easier to maintain hover mappings

---

## 4. **SVG Sanitization - Duplicated Logic** ⭐ MEDIUM PRIORITY

### Current State
**Sanitization appears in 3 places:**
1. `InlineSvg.js` - uses `sanitizeSvgMarkup()`
2. `FloorMapView.js` - uses `sanitizeSvgMarkup()`
3. Both call the same function from `lib/svgUtils.js`

### Issue
- ✅ Actually well-handled! The `sanitizeSvgMarkup()` utility correctly centralizes this
- However: Each component **re-fetches and re-sanitizes** the same SVG separately
  - Campus view: `InlineSvg.js` fetches it
  - Floor view: `FloorMapView.js` fetches it again

### Simplification Opportunity
**Consider SVG caching strategy:**
```javascript
// lib/svgCache.js
const svgCache = new Map();

export async function getSanitizedSvg(src) {
  if (!svgCache.has(src)) {
    const res = await fetch(src, { cache: 'no-store' });
    const raw = await res.text();
    svgCache.set(src, sanitizeSvgMarkup(raw));
  }
  return svgCache.get(src);
}
```

### Benefit
- ✅ Avoid re-fetching/re-sanitizing same SVGs
- ✅ Slight performance improvement
- ✅ Single source for SVG content across app

---

## 5. **ZoomPan Component - Over-Parameterized** ⭐ MEDIUM PRIORITY

### Current State
```javascript
export default function ZoomPan({
  children,
  className = '',
  minScale = 0.5,
  maxScale = 4,
  initialScale = 1,
  wheelStep = 0.0005,        // ← Most callers use defaults
  dblClickStep = 0.25,       // ← Most callers use defaults
  disableDoubleClickZoom = false,
  showControls = true,
  autoFit = false,
  fitPadding = 24,
  fitScaleMultiplier = 1
})
```

### Issue
- **12 props**: Only ~3 are ever changed by callers
- **Unused props**: Many combinations never used in practice
- **Configuration bloat**: Hard to discover what's customizable

### Simplification Opportunity
**Reduce to essential props, use preset configurations:**
```javascript
export default function ZoomPan({
  children,
  className = '',
  autoFit = false,
  showControls = true,
  preset = 'default'  // 'default', 'tight', 'loose'
}) {
  const presets = {
    default: { minScale: 0.5, maxScale: 4, initialScale: 1, wheelStep: 0.0005 },
    tight: { minScale: 0.3, maxScale: 8, ... },
    loose: { minScale: 0.8, maxScale: 2, ... }
  };
  const config = presets[preset];
  // ... rest of logic
}
```

### Benefit
- ✅ Cleaner component API
- ✅ Easier to understand/customize
- ✅ Reduced prop drilling in call sites
- ✅ Easier to add new zoom presets

---

## 6. **Find.js - Hard-Coded Validation Arrays** ⭐ MEDIUM PRIORITY

### Current State
```javascript
const validBuildings = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "l", "w"];
const validBuildingFloors = ["a1", "b1", "b2", "b3", "c1", "c2", ...]; // 19 items!

const ALIASES = {
  aec: { building: "W", level: "L1", room: "1160" },
  cisco: { building: "C", level: "L1", room: "1260" },
  // ... more
};
```

### Issue
- **Sync problem**: These arrays must match `data/buildings.json` exactly
- **Maintenance burden**: Adding a new floor means updating 3 places
- **Brittle**: Easy to get out of sync
- **Code smell**: Data duplicated in JS when it's already in JSON

### Simplification Opportunity
**Generate validation arrays from buildings.json:**
```javascript
import buildings from '../data/buildings.json';

// Dynamically compute valid inputs
const validBuildings = buildings.map(b => b.id.toLowerCase());
const validBuildingFloors = buildings.flatMap(b =>
  b.floors.map(f => b.id.toLowerCase() + f.id.match(/\d+/)[0])
);
```

### Benefit
- ✅ Single source of truth (buildings.json)
- ✅ Automatically synced when new buildings added
- ✅ Eliminates maintenance errors
- ✅ More robust

---

## 7. **Global CSS - Variable Organization** ⭐ LOW PRIORITY (STYLISTIC)

### Current State
```css
:root {
  /* Layout */
  --header-height: 4rem;
  --footer-height: 3rem;
  
  /* Team-specific prefixes */
  --justin-globe1: "Georgia", Arial, sans-serif;
  --justin-globe1-color: #000000;
  --justin-globe2-italian: italic;
  --bm-header-bg: #006400;
  --sidebar-width: 26rem;
}
```

### Issue
- **Mixed naming conventions**: Team prefixes (`--justin-`, `--bm-`) + generic names
- **Unclear hierarchy**: No logical grouping
- **Maintenance confusion**: Hard to find related variables

### Simplification Opportunity
**Organize by concern:**
```css
:root {
  /* Dimensions */
  --header-height: 4rem;
  --footer-height: 3rem;
  --sidebar-width: 26rem;
  
  /* Typography */
  --font-family-primary: "Georgia", Arial, sans-serif;
  --font-color: #000000;
  
  /* Header */
  --header-bg: #006400;
  --header-text-color: #ffffff;
  
  /* Footer */
  --footer-bg: #333333;
  --footer-text-color: #cccccc;
}
```

### Benefit
- ✅ Clearer structure
- ✅ Easier to find related variables
- ✅ Reduced cognitive load
- ✅ Team prefixes can be removed (Git history shows authorship anyway)

---

## 8. **useElementSelection Hook - Can Be Inlined** ⭐ LOW PRIORITY

### Current State
`hooks/useElementSelection.js` is a 45-line custom hook with:
- Single responsibility: Highlight selected elements
- Minimal reuse: Used in `InlineSvg.js` and `FloorMapView.js`
- Simple logic: `useState` + `useEffect` pattern

### Issue
- **Abstraction overkill**: Logic is straightforward enough to inline
- **File overhead**: Creates a new file for 45 lines
- **Indirection**: Adds cognitive load when reading components

### Simplification Opportunity
**Inline into components where used** OR **make it a shared util function instead of hook:**
```javascript
// lib/svgSelection.js (not a hook)
export function highlightElement(container, elementId) {
  const escapedId = escapeSelectorId(elementId);
  const target = container.querySelector(`#${escapedId}`);
  if (target) {
    target.classList.add('active-room');
    target.setAttribute('aria-selected', 'true');
  }
}
```

### Benefit
- ✅ Reduces abstraction layers
- ✅ Easier to understand flow
- ✅ One fewer file to maintain

---

## 9. **Legend Component - Unnecessary Locale Abstraction** ⭐ LOW PRIORITY

### Current State
```javascript
const normalizeLocale = (value) => {
  if (!value) return null;
  const lower = value.toLowerCase();
  if (SUPPORTED_LOCALES.includes(lower)) return lower;
  return SUPPORTED_LOCALES.find((loc) => lower.startsWith(loc)) ?? null;
};
```

### Issue
- Supports only 2 locales (en/es)
- Complex normalization for simple case
- Could use `navigator.language` directly

### Simplification Opportunity
**Simplify locale detection:**
```javascript
const getLocale = () => {
  const stored = localStorage.getItem('locale');
  if (stored && ['en', 'es'].includes(stored)) return stored;
  return navigator.language.startsWith('es') ? 'es' : 'en';
};
```

### Benefit
- ✅ Clearer intent
- ✅ Fewer LOC
- ✅ More maintainable

---

## 10. **Unused Dependencies** ⭐ QUICK WIN

### Current State
From `package.json`:
```json
"dependencies": {
  "cheerio": "^1.1.2",     // Server-side HTML parsing
  "jsdom": "^27.0.0",      // DOM simulation
  "sharp": "^0.34.4"       // Image processing
}
```

### Issue
- These are in dependencies but only appear in scripts
- Increase bundle size unnecessarily
- May not be used at all if scripts aren't run

### Quick Check
Search codebase for actual usage:
```bash
grep -r "cheerio\|jsdom\|sharp" --include="*.js" --include="*.jsx" --exclude-dir=node_modules
```

### Simplification Opportunity
If unused, move to `devDependencies` or remove entirely

### Benefit
- ✅ Smaller dependency tree
- ✅ Faster installs
- ✅ Clearer project requirements

---

## Summary Table

| # | Area | Priority | Effort | Impact | Status |
|---|------|----------|--------|--------|--------|
| 1 | Event System | HIGH | Small | Large | Consolidate 3 functions |
| 2 | campus.js | HIGH | Small | Medium | Eliminate duplicates |
| 3 | Sidebar hover config | MEDIUM | Small | Medium | Centralize in constants |
| 4 | SVG caching | MEDIUM | Medium | Small | Cache-first fetching |
| 5 | ZoomPan params | MEDIUM | Medium | Medium | Preset-based config |
| 6 | Find.js validation | MEDIUM | Small | Medium | Generate from JSON |
| 7 | CSS variables | LOW | Small | Small | Reorganize naming |
| 8 | useElementSelection | LOW | Small | Small | Inline or simplify |
| 9 | Locale handling | LOW | Small | Small | Simplify logic |
| 10 | Unused dependencies | QUICK WIN | Tiny | Small | Check & move |

---

## Recommended Quick Wins (Do These First)

1. **Merge campus.js functions** (5 min): Remove `getBuildingData()`, keep `getBuildingById()`
2. **Remove unused deps** (5 min): Check if cheerio/jsdom/sharp are used
3. **Consolidate hover config** (10 min): Move to constants.js
4. **Generate Find.js arrays** (15 min): Build from buildings.json dynamically

**Total time: ~35 minutes for 30% complexity reduction**

---

## Implementation Priority

**Phase 1 (Week 1):**
- [ ] Fix event system
- [ ] Consolidate campus.js
- [ ] Move hover config to constants

**Phase 2 (Week 2):**
- [ ] Generate Find.js validation from JSON
- [ ] Reorganize CSS variables
- [ ] Check unused dependencies

**Phase 3 (Future):**
- [ ] SVG caching layer
- [ ] ZoomPan presets
- [ ] useElementSelection simplification
