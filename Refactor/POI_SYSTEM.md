# POI System Integration Guide

## Overview

The POI (Points of Interest) system provides a complete infrastructure for displaying and managing location markers on campus maps. It includes:

- **POI Extraction** - Automatically extract locations from SVG files
- **POI Data Layer** - JSON-based POI metadata
- **POI Visualization** - Interactive markers with hover effects
- **Layer Controls** - UI panel to toggle POI categories
- **HUD Integration** - Seamless integration with existing OverlayHUD

## Architecture

### 1. POI Extraction Pipeline

#### Script: `scripts/extractPOIs.js`

Scans all SVG files and extracts Points of Interest based on:
- Text content analysis (matches patterns like "Restaurant", "Restroom", etc.)
- SVG structure (groups, text elements)
- Coordinate extraction from transforms

**Run the extraction:**
```bash
npm run extract-pois
```

**Output:** `data/pois.json` with all extracted locations

#### Supported Categories

| Category | Icon | Color | Pattern Matching |
|----------|------|-------|------------------|
| amenity | 🍽️ | #d97706 | Restaurant, Café, Coffee, Food |
| restroom | 🚻 | #06b6d4 | Restroom, Bathroom, WC, Facilities |
| safety | ⚠️ | #dc2626 | Emergency, Exit, Fire, AED, First Aid |
| parking | 🅿️ | #8b5cf6 | Parking, Lot, Garage |
| library | 📚 | #3b82f6 | Library, Book, Media |
| it_services | 💻 | #10b981 | IT, Technology, Computer, Lab |
| accessibility | ♿ | #f59e0b | Handicap, Accessible, ADA, Wheelchair |

### 2. Data Structure

#### POI JSON Format

```json
{
  "id": "b-l1-einstein-bros-bagels",
  "building": "B",
  "floor": "L1",
  "name": "Einstein Bros Bagels",
  "category": "amenity",
  "x": 594.3848,
  "y": 294.5869,
  "sourceFile": "/B/L1.svg"
}
```

#### Complete pois.json Structure

```json
{
  "version": 1,
  "generatedAt": "2025-10-21T00:00:00Z",
  "totalPois": 45,
  "categories": { /* category configurations */ },
  "stats": {
    "filesProcessed": 42,
    "poisFound": 45,
    "byCategory": {
      "amenity": 8,
      "safety": 12,
      "accessibility": 5
    }
  },
  "pois": [ /* array of POI objects */ ]
}
```

### 3. Component Architecture

#### POIMarkers.js
Renders SVG markers on top of the map.

**Props:**
- `pois: Array` - Array of POI objects
- `building: String` - Current building ID
- `floor: String` - Current floor ID
- `enabledCategories: Array` - Which categories to display
- `showLabels: Boolean` - Show/hide tooltip labels
- `onPOIHover: Function` - Hover callback
- `onPOIClick: Function` - Click callback

**Features:**
- Renders SVG circle markers with icons
- Hover tooltips with POI names
- Integration with event system for cross-component highlighting
- Keyboard accessible (Enter/Space to select)

#### POILayerControl.js
Control panel for toggling POI category visibility.

**Props:**
- `initialCategories: Array` - Initially enabled categories
- `onCategoryToggle: Function` - Callback when categories change

**Features:**
- Checkbox controls for each category
- Color swatches matching category colors
- Bilingual support ready (en/es)
- Hover effects with event dispatch

#### lib/poiManager.js
Data access utility functions.

**Functions:**
```javascript
loadPOIs()                          // Load POI metadata
getPOIsForFloor(pois, building, floor)
getPOIsByCategory(pois, category)
getAvailableCategories(pois)
groupPOIsByCategory(pois)
findPOI(pois, searchTerm)
getPOIById(pois, id)
getCategoryConfig(metadata, category)
```

### 4. HUD Integration

#### Updated: OverlayHUD.js

New props:
- `enabledPOICategories: Array` - Initially enabled categories
- `onPOICategoriesChange: Function` - Callback for category changes

New button in bottom-right cluster:
- **POI Layers** button (`bi bi-pin-map` icon)
- Opens right-side panel with POILayerControl
- Mutually exclusive with Legend and Links panels

New panel:
- Right-side overlay panel for POI controls
- Auto-closes other panels to prevent overlap

#### Updated: FloorMapView.js

**Changes:**
1. Loads POI data on mount
2. Renders POIMarkers component inside ZoomPan
3. Tracks `enabledPOICategories` state
4. Passes POI state to OverlayHUD

**New state:**
```javascript
const [pois, setPOIs] = useState([]);
const [enabledPOICategories, setEnabledPOICategories] = useState(
  ['amenity', 'safety', 'accessibility', 'restroom']
);
```

### 5. Event System Integration

POI system uses the existing CustomEvent infrastructure:

**Event: `ggcmap-hover`**
```javascript
{
  detail: {
    source: 'poi:b-l1-einstein-bros-bagels',
    ids: ['b-l1-einstein-bros-bagels']
  }
}
```

**Event: `ggcmap-hover-clear`**
```javascript
{
  detail: {
    source: 'poi:b-l1-einstein-bros-bagels'
  }
}
```

Dispatched on:
- Hover over POI marker
- Click on POI layer category checkbox

Handled by:
- InlineSvg.js (applies `hover-highlight` class)
- Sidebar.js and Legend.js (existing behavior)

## Usage Guide

### Step 1: Extract POIs from SVGs

```bash
npm run extract-pois
```

This generates `data/pois.json` containing all locations found in your SVG files.

### Step 2: Review Extraction Results

Check `data/pois.json` for:
- Total POIs found
- Category distribution
- Any missing or miscategorized locations

**Manual refinement** (if needed):
- Edit `scripts/extractPOIs.js` to add custom patterns
- Re-run extraction
- Manually edit `data/pois.json` for fine-tuning

### Step 3: POI Controls Appear Automatically

When you load a floor view:
1. POI Markers render on the map
2. POI Layers button appears in bottom-right HUD
3. Click to toggle category visibility
4. Hover POI checkboxes to highlight on map

### Step 4: Customize Display (Optional)

In `FloorMapView.js`, modify default enabled categories:

```javascript
const [enabledPOICategories, setEnabledPOICategories] = useState([
  'amenity',
  'safety',
  'accessibility',
  'restroom'
  // Add or remove as needed
]);
```

## Styling

### POI Marker Styles

Add to `app/global.css`:

```css
/* POI Markers */
.poi-overlay {
  z-index: 10;
  pointer-events: auto;
}

.poi-marker {
  cursor: pointer;
  transition: filter 0.2s ease;
}

.poi-marker:hover circle {
  filter: brightness(1.2);
}

.poi-marker-bg {
  stroke: rgba(255, 255, 255, 0.3);
  stroke-width: 1;
}

.poi-marker-icon {
  font-weight: bold;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.poi-marker-label {
  pointer-events: none;
}

.poi-marker-label rect {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* POI Layer Control */
.poi-layer-control {
  font-size: 12px;
}

.poi-layer-item {
  display: flex;
  align-items: center;
  padding: 4px 0;
}

.poi-layer-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.poi-layer-label:hover {
  background-color: #f3f4f6;
}

.poi-layer-swatch {
  width: 14px;
  height: 14px;
  border-radius: 2px;
  flex-shrink: 0;
}

.poi-layer-checkbox {
  cursor: pointer;
  width: 16px;
  height: 16px;
  accent-color: #000;
  margin: 0;
}
```

## Data Flow Diagram

```
SVG Files (public/BuildingMaps)
    ↓
extractPOIs.js
    ↓
data/pois.json
    ↓
FloorMapView
    ├→ loads via loadPOIs()
    ├→ POIMarkers component (renders on map)
    ├→ OverlayHUD
    │   └→ POILayerControl (toggle visibility)
    └→ enabledPOICategories state
         ↓
    Filters POIs → Re-renders markers
```

## Troubleshooting

### POI extraction found 0 results

**Causes:**
1. SVG files have no text elements
2. Text content doesn't match category patterns
3. File paths incorrect

**Solutions:**
- Check SVG source files directly for text content
- Add custom patterns to `CATEGORY_PATTERNS` in `scripts/extractPOIs.js`
- Verify SVG file structure

### POI markers not visible

**Causes:**
1. POI data not loaded
2. Category disabled in POI Layer Control
3. Building/floor ID mismatch

**Solutions:**
- Check browser console for errors
- Verify `data/pois.json` exists and has data
- Enable category in POI Layer Control
- Check building and floor IDs match

### POI markers in wrong location

**Causes:**
1. SVG coordinate system mismatch
2. Transform matrix parsing incorrect

**Solutions:**
- Verify SVG viewBox dimensions
- Check coordinate extraction in `extractPOIs.js`
- Compare with manual measurement in SVG editor

## Future Enhancements

1. **Search Integration**
   - Find POIs by name in Find.js component
   - Navigate to POI location on click

2. **Multilingual Labels**
   - Spanish translations for POI names
   - Extend legend with bilingual support

3. **POI Details Modal**
   - Click POI to show details panel
   - Hours, phone numbers, additional info

4. **Filtering & Sorting**
   - Search by category
   - Distance-based sorting (when location services available)

5. **Responsive Icons**
   - Replace emoji with SVG icons
   - Custom icon sets per category

6. **Analytics**
   - Track POI clicks
   - Popular locations dashboard

## Files Modified/Created

### New Files
- `scripts/extractPOIs.js` - POI extraction script
- `lib/poiManager.js` - POI data utilities
- `components/POIMarkers.js` - POI marker component
- `components/POILayerControl.js` - Layer control component
- `data/pois.json` - POI metadata (auto-generated)

### Modified Files
- `components/OverlayHUD.js` - Added POI layer button and panel
- `components/FloorMapView.js` - Added POI markers rendering and state management
- `package.json` - Added `extract-pois` script

## API Reference

### loadPOIs()
```javascript
const metadata = await loadPOIs();
// Returns: { version, generatedAt, totalPois, categories, stats, pois }
```

### getPOIsForFloor(pois, buildingId, floorId)
```javascript
const floorPOIs = getPOIsForFloor(metadata.pois, 'B', 'L1');
// Returns: Array of POI objects for Building B, Floor L1
```

### groupPOIsByCategory(pois)
```javascript
const grouped = groupPOIsByCategory(metadata.pois);
// Returns: { amenity: [...], safety: [...], ... }
```

### POI Object Shape
```typescript
interface POI {
  id: string;              // Unique identifier
  building: string;        // Building ID
  floor: string;           // Floor ID
  name: string;            // Display name
  category: string;        // Category slug
  x: number | null;        // SVG x coordinate
  y: number | null;        // SVG y coordinate
  sourceFile: string;      // Relative path to source SVG
}
```
