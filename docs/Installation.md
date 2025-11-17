# Installation & Development Setup

## This document explains how to set up the project locally and run it for development/testing.

### Installation
Follow these steps in order to set up the project on your local machine:

#### 1. Install Node.js and npm
- Visit **[https://nodejs.org/](https://nodejs.org/)**
- Download the **LTS version** (20.x recommended for long-term support)
- Run the installer and follow the installation prompts (accept default settings)
- Verify installation by opening **PowerShell** or **Command Prompt** and running:
  `node --version`
  `npm --version`
 
  You should see version numbers printed for both commands

#### 2. Install Git
- Visit **[https://git-scm.com/downloads](https://git-scm.com/downloads)**
- Download **Git for Windows**
- Run the installer with default settings
- Verify installation by opening **PowerShell** and running:
  `git --version`

  You should see a version number

#### 3. Clone the Repository
Open **PowerShell** or **Command Prompt**, navigate to your desired parent directory and run:
`git clone <repo-url>`
`cd ggcmaps-fall25`

Replace `<repo-url>` with the actual repository URL

Example:
`cd C:\Users\YourName\Desktop`
`git clone https://github.com/your-org/ggcmaps-fall25.git`
`cd ggcmaps-fall25`

#### 4. Install Project Dependencies
From the root of the project directory (`ggcmaps-fall25`), run:
`npm install` or `npm i`

This command:
- Reads `package.json` and installs all required packages into the `node_modules` folder
- Installs Next.js, React, Bootstrap, Cheerio, DOMPurify, Jest, React Testing Library, and all other dependencies

**Note:** If you see warnings about deprecated packages, you can safely ignore them unless they cause errors.

### Running Steps

#### 1. Start the Development Server
From the project root directory (`ggcmaps-fall25`), run:
`npm run dev`

This command:
- Automatically runs `npm run extract-rooms` first (extracts room data from SVG files in `public/BuildingMaps/` and writes to `data/rooms.json`)
- Starts the Next.js development server with hot reload enabled (changes to code automatically refresh the browser)

#### 2. Access the Application in Your Browser
Once the server starts, you will see output in the terminal similar to:
```
> ggcmaps-fall25@0.1.0 dev
> next dev

- Local:        http://localhost:3000
- Ready in 2.3s
```

**Option A:** Open your web browser and manually type in the address bar:
```
http://localhost:3000
```

**Option B:** Hold **Ctrl** and click the `http://localhost:3000` link directly in the terminal.

You should now see the GGC Maps web page.

See **[User Tutorial](./UserTutorial.md)** for detailed usage instructions.

#### 4. Stop the Development Server
To stop the server, press **Ctrl + C** in the terminal where the server is running.

### Notes
- SVGs live in `public/BuildingMaps/`. When adding new SVG maps, keep consistent naming and test in both campus and building routes.
- Data files live in `data/`. 
- The script that reads the SVGs and extracts relevant room data into `rooms.json` is automatically ran upon entering in `npm run dev`. If you wish to run it manually, enter in `npm run extract-data`.

### Related documentation
- [Project README](./README.md)
- [Developer Guide](./DeveloperGuide.md)
- [User Tutorial](./UserTutorial.md)
- [User Testing](./UserTesting.md)
- [Licensing](./License.md)