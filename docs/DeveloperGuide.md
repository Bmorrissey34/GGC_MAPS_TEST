# Developer Guide

## This developer guide describes the repository structure, key components, how SVGs are handled, and where to add new features.

### Repository overview
- `app/` - Next.js App Router: pages and layouts. `Header.js`, `Footer.js`, `Links.js`, `Sidebar.js` & `Legend.jsx` are implemented in `layout.js`. `global.css` is located here as well.
- `components/` - Reusable React components (`CampusMapView.js`, `InlineSvg.js`, `ZoomPan.js`, `Sidebar.js`, `Legend.jsx`, etc.).
- `data/` - Static JSON data: `buildings.json`, `rooms.json`, `entities.json`. Used as the data layer. See `data/legend` for english and spanish text of legend menu. `maps-structure.txt` contains file routes of svgs and `validInput.txt` contains valid input for the find bar.
- `lib/` - Helper functions for generating static params and building lookups (`lib/campus.js`).
- `public/BuildingMaps/` - Stores SVG maps. Naming varies; use the existing structure when adding new files. Buildings are broken up into floors. Not using existing student housing SVGs for security reasons. No SVGs exist for buildings CC and G.
- `scripts/` - Helper scripts for data extraction (e.g., `extract-room-data.js`).
- `__tests__` - Unit and integrations tests which use Jest with React Testing Library. Tests deal with `Header.js`, `Sidebar.js`, `Legend.js`, `Footer.js`, `CampusMapView.js` and `FloorMapView.js`. Tests also cover user interaction such as navigating the various menus, clicking on buttons and searching for rooms.

### Key components

#### `components/InlineSvg.js`
- Dynamically fetches, sanitized, and injects raw SVGs into the DOM.
- Primary purpose is to add interactivity to the map.
- Finds elements and makes them accessible.
- Listens for events (`ggcmap-hover`, `ggcmap-hover-clear`, `ggcmap-student-housing-click`) to toggle `hover-highlight` class SVGs (This allows highlighting from Sidebar and Legend as well).

#### `components/CampusMapView.js`
- Renders the campus SVG inside `InlineSvg` and `ZoomPan`.
- `interactiveSelector` defaults to `.building-group, .building, .student-housing`.
- Special handling for student housing IDs (see `HOUSING_IDS` in the file). This is so an error pops up when trying to access student housing floor layouts (Can't view for security purposes).
- When navigating to a building, push to `/building/${code}` where `code` is uppercase.

#### `components/ZoomPan.js`
- Handles panning/zooming and via click and drag and scrolling to zoom.
- Utilizes `fitToElement` to position map properly.

#### `components/Sidebar.js`
- Renders navigation items dynamically via links from building data
- Interacts with map by dispatching the `ggcmap-hover` event. This utilizes `InlineSvg` to highlight elements of the map.

### Related documentation
- [Project README](./README.md)
- [Installation & Development Setup](./Installation.md)
- [User Tutorial](./UserTutorial.md)
- [User Testing](./UserTesting.md)
- [Licensing](./License.md)