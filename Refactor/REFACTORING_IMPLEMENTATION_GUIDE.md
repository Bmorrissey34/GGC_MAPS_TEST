# Refactoring Implementation Guide

## Quick Reference: Which Files to Update

### Phase 1: Extract Utilities (Low Risk)

#### Step 1A: Create `lib/svgUtils.js`
```javascript
// SVG Sanitization
export const sanitizeSvgMarkup = (markup) =>
  markup
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')
    .replace(/\s(xlink:)?href=["']\s*javascript:[^"']*["']/gi, ' ');

// Selector escaping
export const escapeSelectorId = (value) => {
  if (!value) return '';
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(value);
  }
  return String(value).replace(/([ -\\/:-@[-`{-~])/g, '\\$1');
};

// Unified SVG click handler
export const createSvgClickHandler = (interactiveSelector, onSelect) => (e) => {
  const clickable = e.target.closest(interactiveSelector) || e.target.closest('[id]');
  if (!clickable) return;
  
  const group = clickable.closest('.room-group') || clickable.closest('.building-group');
  const id = (group?.id || clickable.id || clickable.getAttribute('id') || '').trim();
  
  if (id) {
    onSelect?.(id);
  }
};
```

**Files to update:**
- Update `FloorMapView.js`: Import `sanitizeSvgMarkup`, remove local function
- Update `InlineSvg.js`: Import `sanitizeSvgMarkup`, remove local `sanitize()` function
- Update `FloorMapView.js`: Import `escapeSelectorId`, remove local function

---

#### Step 1B: Create `lib/constants.js`
```javascript
export const RESTRICTED_BUILDING_IDS = [
  '1000', '2000', '3000', 'B1000', '2', '3',
  'BUILDING_1000', 'BUILDING_2000', 'BUILDING_3000'
];

export const isRestrictedBuilding = (id) =>
  RESTRICTED_BUILDING_IDS.includes(String(id).toUpperCase());

export const RESTRICTION_ERROR_MESSAGE = 
  'Student housing layouts are not available to the public.';
```

**Files to update:**
- Update `CampusMapView.js`: Import and use `RESTRICTED_BUILDING_IDS`
- Update `Sidebar.js`: Import and use when filtering buildings

---

### Phase 2: Extract Business Logic

#### Step 2A: Create `lib/eventSystem.js`
```javascript
export const dispatchHoverEvent = (type, source, detail) => {
  if (typeof window === 'undefined') return;
  const eventDetail = { source, ...(detail ?? {}) };
  window.dispatchEvent(new CustomEvent(type, { detail: eventDetail }));
};

export const createHoverHandlers = (source, detail) => ({
  onMouseEnter: () => dispatchHoverEvent('ggcmap-hover', source, detail),
  onMouseLeave: () => dispatchHoverEvent('ggcmap-hover-clear', source),
  onFocus: () => dispatchHoverEvent('ggcmap-hover', source, detail),
  onBlur: () => dispatchHoverEvent('ggcmap-hover-clear', source),
});
```

**Files to update:**
- Update `Sidebar.js`: Import `dispatchHoverEvent`, `createHoverHandlers`; remove local functions
- Update `legend.jsx`: Import `dispatchHoverEvent`; replace `sendHover()` and `clearHover()`

---

#### Step 2B: Create `lib/floorNavigation.js`
```javascript
export const getFloorIndex = (floors = [], floorId) =>
  floors.findIndex(floor => floor.id === floorId);

export const canGoUp = (floors = [], currentFloorId) => {
  const index = getFloorIndex(floors, currentFloorId);
  return index < floors.length - 1 && index !== -1;
};

export const canGoDown = (floors = [], currentFloorId) => {
  const index = getFloorIndex(floors, currentFloorId);
  return index > 0 && index !== -1;
};

export const getNextFloor = (floors = [], currentFloorId) => {
  const index = getFloorIndex(floors, currentFloorId);
  if (index !== -1 && index < floors.length - 1) {
    return floors[index + 1];
  }
  return null;
};

export const getPreviousFloor = (floors = [], currentFloorId) => {
  const index = getFloorIndex(floors, currentFloorId);
  if (index > 0) {
    return floors[index - 1];
  }
  return null;
};

export const getFloorLabel = (floors = [], floorId) => {
  const floor = floors.find(f => f.id === floorId);
  return floor?.label || '';
};
```

**Files to update:**
- Update `OverlayHUD.js`: Import utilities, replace inline navigation logic
- Update `FloorMapView.js`: Import utilities, replace inline navigation handlers

---

#### Step 2C: Create `hooks/useElementSelection.js`
```javascript
import { useState, useEffect, useRef } from 'react';
import { escapeSelectorId } from '../lib/svgUtils';

export const useElementSelection = (container, triggerDependency) => {
  const [selectedId, setSelectedId] = useState(null);
  const prevRef = useRef(null);

  useEffect(() => {
    if (!container) return;
    
    // Clean up previous selection
    if (prevRef.current?.isConnected) {
      prevRef.current.classList.remove('active-room');
      prevRef.current.removeAttribute('aria-selected');
      prevRef.current = null;
    }

    if (!selectedId) return;

    const escapedId = escapeSelectorId(selectedId);
    if (!escapedId) return;

    const target = container.querySelector(`#${escapedId}`);
    
    if (target) {
      target.classList.add('active-room');
      target.setAttribute('aria-selected', 'true');
      prevRef.current = target;
    }
  }, [selectedId, triggerDependency, container]);

  return [selectedId, setSelectedId];
};
```

**Files to update:**
- Update `FloorMapView.js`: Use `useElementSelection` hook
- Update `InlineSvg.js`: Use `useElementSelection` hook

---

#### Step 2D: Create `lib/searchUtils.js`
```javascript
export const searchForRoom = (query, rooms) => {
  const lower = query.toLowerCase().trim();
  
  // Try exact match
  let match = rooms.find(room => (room.uniqueId || '').toLowerCase() === lower);
  
  if (!match) {
    // Try building + room number combination
    match = rooms.find(room => {
      const [building, , roomNumber] = (room.uniqueId || '').split('-');
      if (!building || !roomNumber) return false;
      return (building.toLowerCase() + roomNumber.toLowerCase()) === lower;
    });
  }
  
  return match || null;
};

export const validateSearchInput = (input) => {
  if (!input || typeof input !== 'string') return false;
  return input.trim().length > 0;
};

export const parseFloorInput = (input) => {
  const match = String(input).toLowerCase().match(/^([a-z])(\d)$/);
  if (!match) return null;
  return { building: match[1].toUpperCase(), floor: match[2] };
};
```

**Files to update:**
- Refactor `Find.js` to use these utilities

---

## Refactoring Checklist

### Phase 1
- [ ] Create `lib/svgUtils.js`
- [ ] Create `lib/constants.js`
- [ ] Update `FloorMapView.js` to import from `lib/svgUtils.js` and `lib/constants.js`
- [ ] Update `InlineSvg.js` to import from `lib/svgUtils.js`
- [ ] Update `CampusMapView.js` to import from `lib/constants.js`
- [ ] Update `Sidebar.js` to import from `lib/constants.js`
- [ ] Test: Campus view, Floor view, and Sidebar all work

### Phase 2
- [ ] Create `lib/eventSystem.js`
- [ ] Create `lib/floorNavigation.js`
- [ ] Create `hooks/useElementSelection.js`
- [ ] Update `Sidebar.js` to use `lib/eventSystem.js`
- [ ] Update `legend.jsx` to use `lib/eventSystem.js`
- [ ] Update `OverlayHUD.js` to use `lib/floorNavigation.js`
- [ ] Update `FloorMapView.js` to use `lib/floorNavigation.js` and `hooks/useElementSelection.js`
- [ ] Update `InlineSvg.js` to use `hooks/useElementSelection.js`
- [ ] Test: Hover system, floor navigation, and selection all work

### Phase 3
- [ ] Create `lib/searchUtils.js`
- [ ] Refactor `Find.js` to use `lib/searchUtils.js`
- [ ] Simplify logic and fix bugs
- [ ] Test: All search functions work correctly

---

## Testing After Each Phase

### Phase 1 Tests
```
✓ Navigate to campus - building click works
✓ Navigate to floor - room selection works
✓ Student housing restriction shows error
✓ No visual/functional changes (internal refactor)
```

### Phase 2 Tests
```
✓ Sidebar hover highlights buildings
✓ Legend hover highlights areas
✓ Floor navigation arrows work
✓ Floor navigation arrows disable correctly
✓ Room selection highlights persist
```

### Phase 3 Tests
```
✓ Search by building letter (e.g., "b")
✓ Search by floor (e.g., "b2")
✓ Search by room (e.g., "b2210")
✓ Search by alias (e.g., "aec")
✓ Help dialog displays
✓ Error messages show for invalid input
```

---

## Files to Create Summary

```
lib/
  ├── svgUtils.js          (NEW)
  ├── constants.js         (NEW)
  ├── eventSystem.js       (NEW)
  ├── floorNavigation.js   (NEW)
  └── searchUtils.js       (NEW)

hooks/
  └── useElementSelection.js (NEW)
```

## Files to Modify Summary

```
components/
  ├── FloorMapView.js       (MODIFY: imports)
  ├── InlineSvg.js          (MODIFY: imports, use hook)
  ├── CampusMapView.js      (MODIFY: imports)
  ├── Sidebar.js            (MODIFY: imports)
  ├── legend.jsx            (MODIFY: imports)
  └── OverlayHUD.js         (MODIFY: imports, refactor)

components/Find.js          (MODIFY: major refactor)
```

---

## Potential Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Breaking changes in selector escaping | Test with special characters in IDs |
| Hover event system stops working | Verify event detail payload structure |
| Floor navigation edge cases | Test first/last floor disabling |
| Room selection highlighting fails | Ensure CSS.escape is used consistently |
| Search functionality breaks | Keep Find.js tested step-by-step |

