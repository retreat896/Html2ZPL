# ZPL GUI Editor V2 ![Status: Development](https://img.shields.io/badge/Status-Development-yellow?style=flat&logo=visualstudiocode&logoColor=white)

![Repo Last Commit](https://img.shields.io/github/last-commit/retreat896/Html2ZPL?style=flat&logo=git&logoColor=white&color=0007d4)
![GitHub contributors](https://img.shields.io/github/contributors/retreat896/Html2ZPL?style=flat&color=blue)
![Repo Language Count](https://img.shields.io/github/languages/count/retreat896/Html2ZPL?style=flat&color=0007d4)

---

## 🧩 Built with:
![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)
![Font Awesome](https://img.shields.io/badge/Font%20Awesome-f7df1e?style=flat&logo=fontawesome&logoColor=black)
![HTML5](https://img.shields.io/badge/HTML5-E34F26.svg?style=flat&logo=HTML5&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E.svg?style=flat&logo=JavaScript&logoColor=black)

---

## 🔗 Quick Links

-   [📍 Overview](#-overview)
-   [👾 Features](#-features)
-   [🚀 Getting Started](#-getting-started)
    -   [☑️ Prerequisites](#-prerequisites)
    -   [⚙️ Installation](#-installation)
    -   [🤖 Usage](#-usage)
-   [📌 Project Roadmap](#-project-roadmap)
-   [🔰 Contributing](#-contributing)

---

## 📍 Overview

<code>ZPL GUI Editor V2 is a **work-in-progress web editor** for Zebra Programming Language (ZPL) labels.  
The goal is to emulate a "photo editor" experience for ZPL, allowing users to **design, preview, and export labels** visually.  
At the moment, this project is still under **active development** and **WILL** contain bugs or incomplete features.</code>

---

## 👾 Features

### 📝 Label Editor
![Status: In Development](https://img.shields.io/badge/Status-In_Development-orange?style=flat&logo=tools&logoColor=white)  
- Add and position labels on a canvas  
- Edit label properties: size, position, options  
- Live label preview with update on change  
- Toggle preview modes (on-save / on-change)  

### 📦 Item Management
![Status: WIP](https://img.shields.io/badge/Status-WIP-yellow?style=flat&logo=clock&logoColor=white)  
- Dynamic item creation (multiple items)  
- Add, remove, and confirm deletion of items  
- Item selection & focus  

### 🔄 Import & Export
![Status: WIP](https://img.shields.io/badge/Status-WIP-yellow?style=flat&logo=clock&logoColor=white)  
- Import ZPL files (parse & render)  
- Export labels to ZPL (Preview implemented)  
- Support multiple file formats  

### 🖼 ZPL Elements
![Status: WIP](https://img.shields.io/badge/Status-WIP-yellow?style=flat&logo=clock&logoColor=white)  
- **Text**: render & edit text fields (Implemented)  
- **Graphics**: render & edit shapes (Implemented)
- **Images**: render uploaded images  
- **Barcodes**: render and handle input  
- **Options**: configure ZPL element attributes  

### 💾 Saving & Loading
![Status: Planned](https://img.shields.io/badge/Status-Not_Started-red?style=flat&logo=times&logoColor=white)  
- Local save & load (browser storage)  
- Cloud save/load integration  

---

## 🚀 Getting Started

### ☑️ Prerequisites

Before getting started with Html2ZPL, ensure your runtime environment meets the following requirements:

-   **Server Software:** Node 21+

### ⚙️ Installation

1. **Clone the repository:**

   ```sh
   git clone https://github.com/retreat896/Html2ZPL.git
   cd Html2ZPL
   ```

2. **Install dependencies:**

   Navigate to the project directory and run:

   ```sh
   npm install
   ```

### 🤖 Usage

**Development Server:**

To start the development server with hot-reload:

```sh
npm run dev
```

The terminal will show a local URL (typically `http://localhost:5173`). Open this URL in your browser to start using the editor.

**Building for Production:**

To create an optimized production build:

```sh
npm run build
```

The built files will be in the `dist` directory. You can preview the production build locally using:

```sh
npm run preview
```

---

## 📌 Project Roadmap

-   [ ] **`The Begining`**: <strike>Implement a basic drag and drop label GUI </strike>
-   [ ] **`Basic Item Creation`**: Implement some of the base label components such as text, graphic, and barcode.
-   [ ] **`Basic Saving`**: Implement Label saving and item saving to "Cloud" using API
-   [ ] **`Basic Export`**: Implement Exporting to ZPL code from HTML Dom
-   [ ] **`Basic Import`**: Implement a way to import ZPL code into HTML
-   [ ] **`UI Overhaul`**: Implement a flat modern style GUI for the application
-   [ ] **`Advanced Saving`**: Implement a project manager to allow saving multiple label sets, sharing, and storage options.
-   [ ] **`Advanced Items`**: Implements advanced items such as Images and possibly custom user items.
-   [ ] **`Advanced Import`**: Allow users to import any ZPL code and it converts perfectly to a label

---

## 🔰 Contributing


-   **🐛 [Report Issues](https://github.com/retreat896/Html2ZPL/issues)**: Submit bugs found or log feature requests for the `Html2ZPL` project.
-   **💡 [Submit Pull Requests](https://github.com/retreat896/Html2ZPL/blob/main/CONTRIBUTING.md)**: Review open PRs, and submit your own PRs.

<h2>🛠️ Contributors</summary>
<br>
<p align="left">
   <a href="https://github.com/retreat896/Html2ZPL/graphs/contributors">
      <img src="https://contrib.rocks/image?repo=retreat896/Html2ZPL">
   </a>
</p>


---
