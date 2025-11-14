# Installation & Development Setup

## This document explains how to set up the project locally and run it for development/testing.

### Prerequisites
- Node.js 18.x or newer (20.x LTS recommended)
- npm (comes with Node)
- Git

### Clone
`git clone <repo-url>`
`cd ggcmaps-fall25`

### Install
Install project dependencies. This will read `package.json` and install the required packages into `node_modules`.
`npm install` or `npm i`

### Run Locally
`npm run dev`

Open http://localhost:3000 in your browser by entering in the url or ctrl + click on the link in the terminal.

### Notes
- SVGs live in `public/BuildingMaps/`. When adding new SVG maps, keep consistent naming and test in both campus and building routes.
- Data files live in `data/`. 
- The script that reads the SVGs and extracts relevant room data into `rooms.json` is automatically ran upon entering in `npm run dev`. If you wish to run it manually, enter in `npm run extract-data`.

### Related documentation
- [Project README](./README.md)
- [Developer Guide](./DeveloperGuide.md)
- [Installation & Development Setup](./Installation.md)
- [User Tutorial](./UserTutorial.md)
- [Licensing](./License.md)