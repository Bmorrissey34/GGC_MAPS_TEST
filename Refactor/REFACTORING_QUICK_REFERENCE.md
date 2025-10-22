# 🚀 Refactoring Quick Reference Card

## TL;DR - What to Do

### Issue #1: SVG Sanitization (Priority: 🔴 CRITICAL)
- **File:** Create `lib/svgUtils.js`
- **Fix:** Move `sanitizeSvgMarkup()` from `FloorMapView.js` and `InlineSvg.js` to one place
- **Time:** 10 minutes
- **Impact:** Fixes potential bugs when updating sanitization logic

### Issue #2: Selector Escaping (Priority: 🟢 QUICK)
- **File:** Add to `lib/svgUtils.js`
- **Fix:** Create `escapeSelectorId()` function
- **Time:** 5 minutes
- **Impact:** Consistent CSS selector escaping

### Issue #3: Student Housing IDs (Priority: 🟡 MEDIUM)
- **File:** Create `lib/constants.js`
- **Fix:** Move `RESTRICTED_BUILDING_IDS` to one place
- **Time:** 15 minutes
- **Impact:** Single source of truth for restrictions

### Issue #4: Hover Events (Priority: 🟡 MEDIUM)
- **File:** Create `lib/eventSystem.js`
- **Fix:** Extract `dispatchHoverEvent()` and `createHoverHandlers()`
- **Time:** 20 minutes
- **Impact:** Consistent hover behavior across components

### Issue #5: Floor Navigation (Priority: 🔴 HIGH)
- **File:** Create `lib/floorNavigation.js`
- **Fix:** Create helper functions: `canGoUp()`, `canGoDown()`, `getNextFloor()`, `getPreviousFloor()`
- **Time:** 25 minutes
- **Impact:** Eliminates duplicate floor calculation logic

### Issue #6: Element Selection (Priority: 🟡 MEDIUM)
- **File:** Create `hooks/useElementSelection.js`
- **Fix:** Extract selection/highlighting pattern into custom hook
- **Time:** 30 minutes
- **Impact:** Cleaner component code, consistent behavior

### Issue #7: Find Component (Priority: 🔴 HIGH)
- **File:** Create `lib/searchUtils.js` + Refactor `Find.js`
- **Fix:** Simplify complex search logic, fix bugs
- **Time:** 90 minutes
- **Impact:** Fixes bugs, better user experience

### Issue #8: SVG Click Handlers (Priority: 🟡 MEDIUM)
- **File:** Add to `lib/svgUtils.js`
- **Fix:** Create `createSvgClickHandler()` utility
- **Time:** 15 minutes
- **Impact:** Consistent element selection

---

## 📋 Filing Checklist - Do This First

### ✅ Phase 1: Foundation (1-2 hours)
```
[ ] Create lib/svgUtils.js
    - sanitizeSvgMarkup()
    - escapeSelectorId()
    - createSvgClickHandler()

[ ] Create lib/constants.js
    - RESTRICTED_BUILDING_IDS
    - isRestrictedBuilding()

[ ] Update FloorMapView.js
    - Import sanitizeSvgMarkup from lib/svgUtils
    - Remove local sanitizeSvgMarkup function
    - Import escapeSelectorId from lib/svgUtils
    - Remove local escapeSelectorId function

[ ] Update InlineSvg.js
    - Import sanitizeSvgMarkup from lib/svgUtils
    - Remove local sanitize function

[ ] Update CampusMapView.js
    - Import from lib/constants
    - Replace HOUSING_IDS with constant

[ ] Update Sidebar.js
    - Import from lib/constants
    - Update filter logic

[ ] Test campus, floor, sidebar all work
```

### ✅ Phase 2: Business Logic (2-3 hours)
```
[ ] Create lib/eventSystem.js
    - dispatchHoverEvent()
    - createHoverHandlers()

[ ] Create lib/floorNavigation.js
    - getFloorIndex()
    - canGoUp()
    - canGoDown()
    - getNextFloor()
    - getPreviousFloor()

[ ] Create hooks/useElementSelection.js
    - Custom hook for selection logic

[ ] Update Sidebar.js
    - Import from lib/eventSystem
    - Remove local functions

[ ] Update legend.jsx
    - Import from lib/eventSystem
    - Remove local functions

[ ] Update OverlayHUD.js
    - Import from lib/floorNavigation
    - Replace inline logic

[ ] Update FloorMapView.js
    - Import from lib/floorNavigation
    - Use useElementSelection hook
    - Remove local selection logic

[ ] Update InlineSvg.js
    - Use useElementSelection hook
    - Remove local selection logic

[ ] Test hover, floor nav, selection all work
```

### ✅ Phase 3: Search Cleanup (2 hours)
```
[ ] Create lib/searchUtils.js
    - searchForRoom()
    - parseFloorInput()
    - validateSearchInput()

[ ] Refactor Find.js
    - Simplify logic
    - Fix bugs
    - Add early returns

[ ] Test all search functions work
```

---

## 🧪 Quick Testing Checklist

### After Phase 1:
```
[ ] Campus view loads
[ ] Can click buildings
[ ] Buildings navigate to floors
[ ] Student housing shows error
[ ] No console errors
```

### After Phase 2:
```
[ ] Sidebar hover highlights buildings
[ ] Legend hover highlights areas
[ ] Floor up/down arrows work
[ ] Arrows disable on first/last floor
[ ] Room selection highlights persist
[ ] No console errors
```

### After Phase 3:
```
[ ] Search by building letter works (e.g., "b")
[ ] Search by floor works (e.g., "b2")
[ ] Search by room works (e.g., "b2210")
[ ] Search by alias works (e.g., "aec")
[ ] Help dialog displays
[ ] Error messages show for invalid input
[ ] No console errors
```

---

## 🔑 Key Code Patterns

### Pattern 1: Import & Use
```javascript
// lib/svgUtils.js
export const sanitizeSvgMarkup = (markup) => { /* ... */ };

// components/FloorMapView.js
import { sanitizeSvgMarkup } from '../lib/svgUtils';
const sanitized = sanitizeSvgMarkup(raw);
```

### Pattern 2: Custom Event
```javascript
// lib/eventSystem.js
export const dispatchHoverEvent = (type, source, detail) => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(type, { detail: { source, ...detail } }));
};

// components/Sidebar.js
import { dispatchHoverEvent } from '../lib/eventSystem';
dispatchHoverEvent('ggcmap-hover', 'sidebar:a', { ids: ['a'] });
```

### Pattern 3: Custom Hook
```javascript
// hooks/useElementSelection.js
export const useElementSelection = (container, dependency) => {
  const [selectedId, setSelectedId] = useState(null);
  // ... logic here ...
  return [selectedId, setSelectedId];
};

// components/FloorMapView.js
import { useElementSelection } from '../hooks/useElementSelection';
const [selectedId, setSelectedId] = useElementSelection(ref.current, svgContent);
```

---

## 📁 New File Structure

```
lib/
├── campus.js                    (existing)
├── svgUtils.js                 (NEW)
├── constants.js                (NEW)
├── eventSystem.js              (NEW)
├── floorNavigation.js          (NEW)
└── searchUtils.js              (NEW)

hooks/
└── useElementSelection.js       (NEW)
```

---

## ⚡ Pro Tips

1. **Commit after each file creation** - Small commits are easier to revert if needed
2. **Test in browser after each change** - Don't wait until end
3. **Keep old code visible while refactoring** - Use side-by-side editor
4. **Use VS Code's rename all** - To update all imports at once
5. **Check console for errors** - Each test should have zero errors

---

## 🆘 If Something Breaks

1. **Check import paths** - Most common issue
2. **Verify function signatures** - Make sure calling code matches
3. **Check for typos** - Especially in component names
4. **Use browser DevTools** - Check Network and Console tabs
5. **Compare with before/after guide** - Reference the examples provided

---

## 📊 Progress Tracker

```
Phase 1 Utilities:           [ ] 0%  [ ] 25%  [ ] 50%  [ ] 75%  [ ] ✅ 100%
Phase 2 Business Logic:      [ ] 0%  [ ] 25%  [ ] 50%  [ ] 75%  [ ] ✅ 100%
Phase 3 Search Cleanup:      [ ] 0%  [ ] 25%  [ ] 50%  [ ] 75%  [ ] ✅ 100%
All Testing:                 [ ] 0%  [ ] 25%  [ ] 50%  [ ] 75%  [ ] ✅ 100%
```

---

## 🎯 Success Criteria

After refactoring, your codebase should have:

- ✅ Zero duplicate SVG sanitization functions
- ✅ One place to update student housing IDs
- ✅ Consistent hover event system across components
- ✅ Single floor navigation implementation
- ✅ Cleaner component code (shorter, more readable)
- ✅ Fixed Find.js bugs
- ✅ Improved team maintainability
- ✅ Better code reusability

---

**You've got this! 🚀 Start with Phase 1 - you'll see immediate improvements.**

