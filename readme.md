# ZPL GUI Editor V2 ![Status: Development](https://img.shields.io/badge/Status-Development-blue?style=flat&logo=visualstudiocode&logoColor=white)

![Repo Last Commit](https://img.shields.io/github/last-commit/YOUR_USERNAME/zpl-gui-editor-v2?style=flat&logo=git&logoColor=white&color=0007d4)
![GitHub contributors](https://img.shields.io/github/contributors/YOUR_USERNAME/zpl-gui-editor-v2?style=flat&color=blue)
![Repo Language Count](https://img.shields.io/github/languages/count/YOUR_USERNAME/zpl-gui-editor-v2?style=flat&color=0007d4)

---

## 🧩 Built with:
![Bootstrap](https://img.shields.io/badge/Bootstrap-7952B3.svg?style=flat&logo=Bootstrap&logoColor=white)
![jQuery](https://img.shields.io/badge/jQuery-0769AD.svg?style=flat&logo=jquery&logoColor=white)
![Popper.js](https://img.shields.io/badge/Popper.js-f7df1e?style=flat&logo=javascript&logoColor=black)
![HTML5](https://img.shields.io/badge/HTML5-E34F26.svg?style=flat&logo=HTML5&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E.svg?style=flat&logo=JavaScript&logoColor=black)

---

## 🔗 Quick Links

-   [📍 Overview](#-overview)
-   [👾 Features](#-features)
-   [📁 Project Structure](#-project-structure)
    -   [📂 Project Index](#-project-index)
-   [🚀 Getting Started](#-getting-started)
    -   [☑️ Prerequisites](#-prerequisites)
    -   [⚙️ Installation](#-installation)
    -   [🤖 Usage](#🤖-usage)
-   [📌 Project Roadmap](#-project-roadmap)
-   [🔰 Contributing](#-contributing)
-   [🎗 License](#-license)
-   [🙌 Acknowledgments](#-acknowledgments)

---

## 📍 Overview

<code>
ZPL GUI Editor V2 is a **work-in-progress web editor** for Zebra Programming Language (ZPL) labels.  
The goal is to emulate a "photo editor" experience for ZPL, allowing users to **design, preview, and export labels** visually.  
At the moment, this project is still under **active development** and may contain bugs or incomplete features.
</code>

---

## 👾 Features

### 📝 Label Editor
![Status: WIP](https://img.shields.io/badge/Status-WIP-yellow?style=flat&logo=ipfs&logoColor=white)  
- Add and position labels on a canvas  
- Edit label properties: size, position, options  
- Live label preview with update on change  
- Toggle preview modes (on-save / on-change)  

### 📦 Item Management
![Status: Not Started](https://img.shields.io/badge/Status-Not_Started-red?style=flat&logo=ipfs&logoColor=white)  
- Dynamic item creation (multiple labels/items)  
- Add, remove, and confirm deletion of items  
- Item list rendering with selection & focus  

### 🔄 Import & Export
![Status: Planned](https://img.shields.io/badge/Status-Planned-lightgrey?style=flat&logo=ipfs&logoColor=black)  
- Import ZPL files (parse & render)  
- Export labels to ZPL, PDF, PNG, etc.  
- Support multiple file formats  

### 🖼 ZPL Elements
![Status: Planned](https://img.shields.io/badge/Status-Planned-lightgrey?style=flat&logo=ipfs&logoColor=black)  
- **Text**: render & edit text fields  
- **Images**: render uploaded images  
- **Barcodes**: render and handle input  
- **Options**: configure ZPL element attributes  

### 💾 Saving & Loading
![Status: Planned](https://img.shields.io/badge/Status-Planned-lightgrey?style=flat&logo=ipfs&logoColor=black)  
- Local save & load (browser storage)  
- Cloud save/load integration  

---

## 📁 Project Structure

```sh
└── zpl-gui-editor-v2/
    ├── index.html
    ├── css/
    │   └── styles.css
    ├── js/
    │   ├── app.js
    │   └── editor.js
    ├── assets/
    │   └── icons/
    └── docs/
