# Migration Guide: New Utility Imports

This guide helps team members understand the new utility structure after refactoring.

---

## 🔄 Import Changes for Each Component

### CampusMapView.js
```javascript
// OLD
const HOUSING_IDS = ['1000', '2000', '3000', 'B1000', '2', '3', ...];

// NEW
import { RESTRICTED_BUILDING_IDS, RESTRICTION_ERROR_MESSAGE, isRestrictedBuilding } from '../lib/constants';

// Usage
if (isRestrictedBuilding(id)) {
  alert(RESTRICTION_ERROR_MESSAGE);
}
```

---

### Sidebar.js
```javascript
// OLD - Multiple definitions
const HOUSING_IDS = ['1000', '2000', ...];
function dispatchHoverEvent(type, source, detail) { ... }

// NEW - Centralized imports
import { RESTRICTED_BUILDING_IDS } from '../lib/constants';
import { dispatchHoverEvent, createHoverHandlers, clearHoverEvents } from '../lib/eventSystem';

// Usage
const buildings = buildingsList.filter(b => !RESTRICTED_BUILDING_IDS.includes(b.id));
const handlers = createHoverHandlers('sidebar:building-' + building.id, { ids: [building.id] });
```

---

### InlineSvg.js
```javascript
// OLD - Local functions
function sanitize(markup) { ... }
function inferKind(element) { ... }
const prevRef = useRef(null);

// NEW - Utilities + Hook
import { sanitizeSvgMarkup, escapeSelectorId, inferElementKind } from '../lib/svgUtils';
import { useElementSelection } from '../hooks/useElementSelection';

const { selectedId, setSelectedId } = useElementSelection();
const svg = sanitizeSvgMarkup(rawSvg);
const kind = inferElementKind(element);
const escaped = escapeSelectorId(elementId);
```

---

### FloorMapView.js
```javascript
// OLD - Multiple concerns
function sanitizeSvgMarkup(markup) { ... }
function escapeSelectorId(id) { ... }
const prevHighlightedRef = useRef(null);
const [selectedRoomId, setSelectedRoomId] = useState(null);

// NEW - Separated utilities
import { sanitizeSvgMarkup, escapeSelectorId } from '../lib/svgUtils';
import { getNextFloor, getPreviousFloor, canGoUp, canGoDown } from '../lib/floorNavigation';
import { useElementSelection } from '../hooks/useElementSelection';

const { selectedId, setSelectedId } = useElementSelection();
const svg = sanitizeSvgMarkup(rawSvg);

// Floor navigation
if (canGoUp(building, currentFloor)) {
  const nextFloor = getNextFloor(building, currentFloor);
  router.push(`/building/${building}/${nextFloor}`);
}
```

---

### legend.jsx
```javascript
// OLD - Inline event dispatching
function sendHover(item) {
  window.dispatchEvent(new CustomEvent('ggcmap-hover', { ... }));
}
function clearHover() {
  window.dispatchEvent(new CustomEvent('ggcmap-hover-clear', { ... }));
}

// NEW - Utility functions
import { dispatchHoverEvent, createHoverHandlers, clearHoverEvents } from '../lib/eventSystem';

const onMouseEnter = () => dispatchHoverEvent('ggcmap-hover', 'legend', { ... });
const onMouseLeave = () => clearHoverEvents('legend');
```

---

### OverlayHUD.js
```javascript
// OLD - Inline floor calculations
const floors = building.floors || [];
const floorIds = floors.map(f => f.id);
const index = floorIds.indexOf(currentFloor);
const canGoUp = index < floorIds.length - 1;
const canGoDown = index > 0;

// NEW - Utility functions
import { canGoUp, canGoDown, getNextFloor, getPreviousFloor } from '../lib/floorNavigation';

const upButtonDisabled = !canGoUp(building, currentFloor);
const downButtonDisabled = !canGoDown(building, currentFloor);
```

---

### Find.js
```javascript
// OLD - Complex nested if-else with bugs
const onFindClickButton = () => {
  let match = rooms.find((room) => {
    (room) => (room.uniqueId || "").toLowerCase() === userInput  // ❌ BUG: Never called!
  });
  
  if (!match) {
    match = rooms.find(/* ... */);
  }
  // Complex logic with duplicates...
};

// NEW - Clear flow with utilities
import { searchForRoom, validateSearchInput, parseFloorInput, formatNotFoundError, extractRoomNavInfo } from '../lib/searchUtils';

const onFindClickButton = () => {
  const userInput = findValue.trim().toLowerCase();
  
  if (!validateSearchInput(userInput)) {
    setError("You must enter a search term.");
    return;
  }
  
  // 1. Check aliases
  // 2. Check building
  // 3. Check floor
  // 4. Check help
  // 5. Search room
  const match = searchForRoom(userInput, rooms);  // ✅ FIXED
};
```

---

## 📚 Quick Reference

### SVG Utilities (lib/svgUtils.js)
| Function | Use When | Returns |
|----------|----------|---------|
| `sanitizeSvgMarkup(markup)` | Loading raw SVG | Cleaned markup string |
| `escapeSelectorId(id)` | Using ID in CSS selector | Escaped ID string |
| `createSvgClickHandler(...)` | Creating click handlers | Handler function |
| `inferElementKind(element)` | Detecting element type | 'building'\|'room'\|'label' |

### Constants (lib/constants.js)
| Export | Use For |
|--------|---------|
| `RESTRICTED_BUILDING_IDS` | Array to check if building restricted |
| `isRestrictedBuilding(id)` | Function to check single ID |
| `RESTRICTION_ERROR_MESSAGE` | Consistent error text |

### Event System (lib/eventSystem.js)
| Function | Purpose | Example |
|----------|---------|---------|
| `dispatchHoverEvent(type, source, detail)` | Dispatch hover event | `dispatchHoverEvent('ggcmap-hover', 'sidebar', { ids: ['A'] })` |
| `createHoverHandlers(source, detail)` | Get mouse handlers | `const handlers = createHoverHandlers('sidebar:building-a', { ids: ['a'] })` |
| `clearHoverEvents(source)` | Clear hover state | `clearHoverEvents('sidebar')` |

### Floor Navigation (lib/floorNavigation.js)
| Function | Returns | Example |
|----------|---------|---------|
| `getFloorIndex(floorId)` | Number | `getFloorIndex('L2')` → 1 |
| `canGoUp(building, floor)` | Boolean | `canGoUp('B', 'L2')` → true |
| `canGoDown(building, floor)` | Boolean | `canGoDown('B', 'L1')` → false |
| `getNextFloor(building, floor)` | String | `getNextFloor('B', 'L1')` → 'L2' |
| `getPreviousFloor(building, floor)` | String | `getPreviousFloor('B', 'L2')` → 'L1' |
| `getFloorLabel(floorId)` | String | `getFloorLabel('L1')` → '1' |

### Search Utilities (lib/searchUtils.js)
| Function | Input | Returns |
|----------|-------|---------|
| `searchForRoom(query, rooms)` | string, array | Room object or null |
| `validateSearchInput(input)` | string | Boolean |
| `parseFloorInput(input)` | "b2" | {building: 'B', floor: '2'} |
| `formatNotFoundError(query)` | string | Error message |
| `extractRoomNavInfo(room)` | room object | {building, floor, roomNumber} |

### Custom Hook (hooks/useElementSelection.js)
```javascript
const { selectedId, setSelectedId } = useElementSelection();

// selectedId: Currently selected element ID (or null)
// setSelectedId: Function to update selection
```

---

## 🎯 Common Patterns After Refactoring

### Pattern 1: Restricting Buildings
```javascript
import { isRestrictedBuilding, RESTRICTION_ERROR_MESSAGE } from '../lib/constants';

if (isRestrictedBuilding(buildingId)) {
  alert(RESTRICTION_ERROR_MESSAGE);
  return;
}
```

### Pattern 2: Hover Effects
```javascript
import { createHoverHandlers, clearHoverEvents } from '../lib/eventSystem';

const handlers = createHoverHandlers('source-id', { ids: ['element-id'] });

return (
  <div onMouseEnter={handlers.onMouseEnter} onMouseLeave={handlers.onMouseLeave}>
    {/* ... */}
  </div>
);
```

### Pattern 3: Floor Navigation
```javascript
import { canGoUp, canGoDown, getNextFloor } from '../lib/floorNavigation';

if (canGoUp(building, currentFloor)) {
  const next = getNextFloor(building, currentFloor);
  router.push(`/building/${building}/${next}`);
}
```

### Pattern 4: Element Highlighting
```javascript
import { useElementSelection } from '../hooks/useElementSelection';

const { selectedId, setSelectedId } = useElementSelection();

const handleRoomClick = (roomId) => {
  setSelectedId(roomId);
};
```

### Pattern 5: Room Search
```javascript
import { searchForRoom, extractRoomNavInfo } from '../lib/searchUtils';

const match = searchForRoom(query, rooms);
if (match) {
  const { building, floor, roomNumber } = extractRoomNavInfo(match);
  router.push(`/building/${building}/L${floor}`);
}
```

---

## ⚠️ Breaking Changes

**NONE!** All refactoring is backward compatible.

---

## 📖 JSDoc Documentation

All new utility functions include JSDoc comments. View them with:
- VS Code: Hover over function name to see documentation
- Terminal: `grep -A 5 "/**" lib/svgUtils.js`

---

## ❓ FAQ

**Q: Where do I find the room search logic?**
A: `lib/searchUtils.js` - includes search, validation, parsing, error formatting

**Q: How do I highlight an element?**
A: Use the `useElementSelection` hook in your component

**Q: What building IDs are restricted?**
A: Check `lib/constants.js` - `RESTRICTED_BUILDING_IDS` array

**Q: How do I dispatch hover events?**
A: Import from `lib/eventSystem.js` and use `dispatchHoverEvent()` or `createHoverHandlers()`

**Q: Where's the floor navigation logic?**
A: `lib/floorNavigation.js` - functions like `getNextFloor()`, `canGoUp()`, etc.

---

## 🔗 File Structure

```
lib/
├── svgUtils.js           ← SVG sanitization, escaping, handlers
├── constants.js          ← Restricted building IDs
├── eventSystem.js        ← Hover event dispatching
├── floorNavigation.js    ← Floor navigation logic
└── searchUtils.js        ← Search utilities

hooks/
└── useElementSelection.js ← Element highlighting hook

components/
├── CampusMapView.js      ← Updated (uses constants)
├── InlineSvg.js          ← Updated (uses svgUtils + hook)
├── FloorMapView.js       ← Updated (uses svgUtils + floorNav + hook)
├── Sidebar.js            ← Updated (uses constants + eventSystem)
├── legend.jsx            ← Updated (uses eventSystem)
├── OverlayHUD.js         ← Updated (uses floorNavigation)
└── Find.js               ← Updated (uses searchUtils)
```

---

*Last Updated: After Phase 3 Refactoring - All utility files created and integrated*
