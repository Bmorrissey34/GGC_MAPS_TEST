# GGCMaps - 11/16/2025

### Description / Abstract
  - We have decided to work on the GGCMaps project. The original GGC campus map application is difficult to maintain and update because it is not built on a relevant framework. The primary objective of the GGCMaps Revamp project is to rebuild the application using modern technology with a modular structure to make it more maintainable in the future. Our plan is to use the existing SVG files as our campus layout and mix it with our created JSON files that will then be loaded by created scripts to make the data dynamic. We are using scripting created from python and JavaScript for dynamic data and using React and Next.js as our frameworks to make the project modular. Our goal is to have a modern campus map that is maintainable for any future developers an easy to navigate for any students.

### Documentation

- [Developer Guide](./DeveloperGuide.md)
- [Installation & Development/Running Guide](./Installation.md)
- [User Tutorial](./UserTutorial.md)
- [User Testing](./UserTesting.md)
- [Licensing](./License.md)

### Links
 - The [legacy GGC Maps project](http://ggcmaps.com/#Campus) is available for reference, but this repository focuses on rebuilding it with modern frameworks and a modular design.

### Technologies

Required technologies and tools to run this application:

- **[Node.js](https://nodejs.org/)** - v18.17 or newer (v20.x LTS recommended)
  - JavaScript runtime required for Next.js and npm
  - **npm comes bundled with Node.js** - no separate installation needed
- **[Next.js](https://nextjs.org/)** - v14.x (installed via npm)
  - React framework with App Router for server-side rendering and routing
- **[React](https://react.dev/)** - v18.x (installed via npm)
  - UI library for building interactive components
- **[Bootstrap](https://getbootstrap.com/)** - v5.x (installed via npm)
  - CSS framework for responsive UI styling
- **[Cheerio](https://cheerio.js.org/)** - (installed via npm)
  - Server-side DOM parsing library for extracting room data from SVG files
- **[DOMPurify](https://github.com/cure53/DOMPurify)** - (installed via npm)
  - Library for sanitizing SVG content before injecting into the DOM
- **[JSON](https://www.json.org/)** - data format for the app’s static data layer
  - Room, building, and entity metadata live under `data/` (e.g., `data/rooms.json`, `data/buildings.json`, `data/entities.json`) and are loaded at build/dev time
- **[Jest](https://jestjs.io/)** - (installed via npm)
  - Testing framework for automated unit and integration tests
- **[React Testing Library](https://testing-library.com/react)** - (installed via npm)
  - Testing utilities for React components
- **[Git](https://git-scm.com/)** - For version control and cloning the repository

**Technologies Added by Team Lost:**
- Node.js + Next.js (App Router) framework — rebuilt the prior non-framework site into a modern, maintainable app
- Jest and React Testing Library for automated testing
- Cheerio-based SVG room extraction pipeline (`scripts/extract-room-data.js`)
- Internationalization system (`lib/i18n.js`) for English/Spanish support
- Custom event system for interactive SVG highlighting (`InlineSvg.js`)

**Technologies Removed:**
- Legacy no‑framework web app replaced by the Node.js/Next.js stack
- Python scripts (legacy data extraction) — replaced with Node.js/Cheerio scripts
- Standalone HTML files — all markup now lives inside React components (JSX) within JS files
- Docker — removed; replaced by the local Next.js dev server and Node-based scripts

### Working Features

**Features rebuilt from the legacy application:**
- Display of campus buildings and indoor floor maps (from SVG files)
- Clickable rooms and spaces with visual highlights
- Search by room number or building
- Basic legend functionality
- Collapsible sidebar for building navigation

**Brand new features added by Team Lost:**
- Search by building and floor (e.g., "B1" navigates to Building B, Level 1)
- "Back to Campus" button for quick navigation to main campus view
- English/Spanish language toggle with full UI translation
- Enhanced legend with color-coded building types and parking information
- Hover highlighting on sidebar and legend elements reflects on map
- Sidebar can be expanded without blocking interaction with other UI elements
- Helpful links menu with quick access to campus resources
- Automated room extraction script runs on `npm run dev` and updates `data/rooms.json` based on SVG changes
- Current page/building name displayed in header
- Security error message when attempting to access student housing layouts
- Overlay HUD for floor navigation with up/down arrows
- Complete UI/UX redesign with modern styling and responsive layout
- Rebuilt entire application using Next.js framework with modular architecture

### Other Project Explanations
- **Client:** Dr. Cengiz Gunay, Georgia Gwinnett College
- **Goal:** Rebuild the existing GGC Maps app in a modern, modular, and maintainable way
- **Future Enhancements (optional):** GPS positioning, campus navigation between buildings, accessibility overlays, real-time occupancy data

### Fall 2025

### Team Name: *Lost*

### Team Members  

| Photo | Name              | Roles & Responsibilities                                                                 | Contribution % |
|-------|-------------------|-------------------------------------------------------------------------------------------|----------------|
| ![Brendan](/public/images/BrendanM.jpg) | **Brendan Morrissey** | Code Architecture / Lead Programmer (60%) · Programmer (20% ×2)   | 100% |
| ![William](/public/images/will.jpg)     | **William Stein**     | Data Modeling (60%) · Documentation Lead (20%) · Programmer (20%) | 100% |
| ![Karen](/public/images/karen.jpg)      | **Karen Armendariz**  | Testing Lead (60%) · Client Liaison (20%) · Programmer (20%)      | 100% |
| ![Justin](/public/images/justin.jpg)    | **Justin McCabe**     | UI/UX Designer (60%) · Project Manager (20%) · Programmer (20%)   | 100% |

### Project Flyer and video (at the end of the semester)