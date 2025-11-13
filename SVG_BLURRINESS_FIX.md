# SVG Blurriness Fix Documentation

## Problem Analysis

When zoomed in using the map's zoom/pan functionality, SVGs were becoming blurry, defeating the purpose of using vector graphics. The issue was discoverable when inspecting with Chrome DevTools while zoomed in.

## Root Cause

The underlying issue was caused by **removing SVG `width` and `height` attributes without ensuring a proper `viewBox` was set**.

### What was happening:
1. SVG files loaded from disk have explicit `width` and `height` attributes (e.g., `width="1000" height="800"`)
2. The code was removing these attributes to enable responsive CSS-based sizing
3. **However**, without a `viewBox` attribute, the browser has no reference for the SVG's coordinate system
4. This caused the SVG to be rendered as raster/bitmap instead of as a true vector graphic
5. When zoomed, raster graphics become noticeably blurry

### The Critical SVG Attributes:
- **`viewBox`**: Defines the SVG's coordinate system and aspect ratio. Required for crisp vector rendering.
- **`preserveAspectRatio`**: Controls how the SVG scales. Should be `xMidYMid meet` for proper aspect-ratio-preserving zoom.
- **`width`/`height`**: Can be removed for responsive sizing (CSS width: 100%), but only if `viewBox` is present.

## Solution Implemented

### 1. Created Shared Utility Function

Added `normalizeSvgForResponsiveLayout()` to `lib/svgUtils.js`:

```javascript
export const normalizeSvgForResponsiveLayout = (svg) => {
  if (!svg || !(svg instanceof SVGElement)) return;

  // Extract dimensions if width/height attributes exist
  const width = svg.getAttribute('width');
  const height = svg.getAttribute('height');

  // Create viewBox from dimensions if it doesn't exist
  if (!svg.getAttribute('viewBox') && width && height) {
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  }

  // Remove width/height for responsive layout (controlled by CSS)
  svg.removeAttribute('width');
  svg.removeAttribute('height');

  // Set CSS for responsive sizing
  svg.style.width = '100%';
  svg.style.height = 'auto';
  svg.style.display = 'block';

  // Ensure preserveAspectRatio is set for crisp scaling
  if (!svg.getAttribute('preserveAspectRatio')) {
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  }
};
```

### 2. Updated FloorMapView.js

**Before:**
```javascript
svg.removeAttribute('width');
svg.removeAttribute('height');
svg.style.width = '100%';
svg.style.height = 'auto';
svg.style.display = 'block';
```

**After:**
```javascript
const svg = container.querySelector('svg');
if (svg) {
  normalizeSvgForResponsiveLayout(svg);
}
```

### 3. Updated CampusMapView.js

Applied the same normalization in the `handleSvgReady` callback:

```javascript
const handleSvgReady = useCallback(() => {
  // ... other setup code ...
  
  const svgRoot = wrapper?.querySelector('svg');
  if (!svgRoot) return;

  // Normalize SVG for responsive layout while preserving vector quality
  normalizeSvgForResponsiveLayout(svgRoot);
  
  // ... rest of setup ...
}, [ensureStudentHousingClasses]);
```

## Why This Fix Works

1. **Preserves Vector Rendering**: By ensuring `viewBox` is always present, the SVG maintains its vector coordinate system
2. **Enables Responsive Design**: CSS width: 100% still works for responsive sizing
3. **Maintains Aspect Ratio**: `preserveAspectRatio` ensures consistent scaling during zoom operations
4. **Browser-Native Rendering**: Modern browsers render SVGs with `viewBox` as true vector graphics, which scale infinitely without quality loss

## Testing the Fix

### How to verify the fix works:
1. Open a floor or campus map in the application
2. Use the zoom controls or mouse wheel to zoom in significantly
3. **Before fix**: SVG would appear blurry/pixelated when zoomed
4. **After fix**: SVG remains crisp and clear at any zoom level

### Where to test:
- **Floor Maps**: Navigate to any building and view a floor
- **Campus Map**: View the main campus map and zoom in to building details

## Browser Compatibility

The fix uses standard SVG attributes (`viewBox`, `preserveAspectRatio`) that are:
- ✅ Supported in all modern browsers (Chrome, Firefox, Safari, Edge)
- ✅ Part of SVG 1.1 and 2.0 specifications
- ✅ No polyfills or special handling required

## Performance Impact

- ✅ **No negative impact** - uses native browser rendering
- ✅ **Potential improvement** - vector rendering is typically faster than raster scaling
- ✅ **No additional JavaScript** - runs once during SVG normalization

## Future Maintenance

If you:
- Add new SVG components: Ensure they call `normalizeSvgForResponsiveLayout()` after injection
- Modify SVG loading: Always verify `viewBox` is preserved
- Change zoom/pan behavior: Test with deep zoom levels to ensure crispness

## References

- [MDN: SVG viewBox Attribute](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/viewBox)
- [MDN: SVG preserveAspectRatio](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/preserveAspectRatio)
- [W3C SVG Specification](https://www.w3.org/TR/SVG2/)
