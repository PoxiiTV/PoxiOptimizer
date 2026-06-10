<div align="center">

# ⚡ PoxiOptimizer

**La herramienta definitiva para optimizar, limpiar y activar Windows.**
**The ultimate tool to optimize, clean and activate Windows.**

[![Tauri](https://img.shields.io/badge/Tauri-2.0-24C8DB?logo=tauri&logoColor=white)](https://tauri.app)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Rust](https://img.shields.io/badge/Rust-1.91-000000?logo=rust&logoColor=white)](https://www.rust-lang.org)
[![Windows](https://img.shields.io/badge/Windows-10%20%7C%2011-0078D6?logo=windows&logoColor=white)](#)
[![License](https://img.shields.io/badge/license-MIT-9b5cf6)](LICENSE)

*Interfaz glassmorphism · ejecutable ligero · 100 % seguro y reversible*

</div>

---

## 🇪🇸 Español

**PoxiOptimizer** es un optimizador todo-en-uno para Windows 10 y 11 con una interfaz moderna y cuidada. Reúne en un solo lugar lo mejor de herramientas como *winutil* (Chris Titus) y *Optimizer* (hellzerg), añade un **multi-desinstalador**, un **instalador de aplicaciones** y un **activador de Windows/Office** basado en *Microsoft Activation Scripts* (massgravel).

### ✨ Características

| Módulo | Qué hace |
|--------|----------|
| 🏠 **Inicio** | Panel con info del sistema (CPU, GPU, RAM, disco), estado de activación y acciones rápidas. |
| ⚙️ **Optimización** | +25 *tweaks* **seguros y reversibles** de privacidad, telemetría, rendimiento, red e interfaz. Cada uno se activa/desactiva con un interruptor. |
| ✨ **Limpieza** | Borra temporales, caché de Windows Update, papelera y caché DNS. Muestra el espacio liberado. |
| 🗑️ **Quitar bloatware** | Desinstala apps preinstaladas de la Store. Los componentes críticos están **protegidos**. |
| ⬇️ **Instalar apps** | Catálogo de programas populares instalables con un clic vía **winget**. |
| 📦 **Desinstalador** | Lista **todos** los programas del equipo (escritorio y Store) y los desinstala. |
| 🔑 **Activación** | Activa Windows (licencia digital HWID) y Office (Ohook) mediante el script oficial de **MAS**. |

### 🛡️ Seguridad ante todo

- ✅ **Todos los tweaks son reversibles**: lo que activas, lo puedes desactivar.
- ✅ **Punto de restauración** con un clic antes de optimizar.
- ✅ **Componentes críticos protegidos**: no se puede romper el menú Inicio, la tienda ni la seguridad.
- ✅ **Nada experimental**: solo ajustes conocidos y probados.
- ✅ Se ejecuta como **administrador** (UAC) para aplicar los cambios correctamente.

### 🚀 Instalación

1. Descarga el instalador `PoxiOptimizer_1.0.0_x64-setup.exe` desde la pestaña [Releases](https://github.com/PoxiiTV/PoxiOptimizer/releases).
2. Ejecútalo y sigue el asistente.
3. Abre **PoxiOptimizer** y acepta el aviso de administrador.

> El ejecutable es **muy ligero** (~5–10 MB) porque reutiliza el motor WebView2 ya incluido en Windows 11.

### 🧑‍💻 Compilar desde el código

Requisitos: [Node.js](https://nodejs.org), [Rust](https://rustup.rs) y las *Build Tools* de Visual Studio (C++).

```bash
npm install            # instala dependencias
npm run tauri dev      # desarrollo (o ejecuta start.bat)
npm run tauri build    # genera el instalador en src-tauri/target/release/bundle
```

---

## 🇬🇧 English

**PoxiOptimizer** is an all-in-one optimizer for Windows 10 and 11 with a modern, polished interface. It brings together the best of tools like *winutil* (Chris Titus) and *Optimizer* (hellzerg), adding a **multi-uninstaller**, an **app installer** and a **Windows/Office activator** based on *Microsoft Activation Scripts* (massgravel).

### ✨ Features

| Module | What it does |
|--------|--------------|
| 🏠 **Home** | Dashboard with system info (CPU, GPU, RAM, disk), activation status and quick actions. |
| ⚙️ **Optimization** | 25+ **safe, reversible tweaks** for privacy, telemetry, performance, network and UI. Toggle each on/off. |
| ✨ **Cleanup** | Clears temp files, Windows Update cache, recycle bin and DNS cache. Shows freed space. |
| 🗑️ **Remove bloatware** | Uninstalls preinstalled Store apps. Critical components are **protected**. |
| ⬇️ **Install apps** | Catalog of popular programs installable in one click via **winget**. |
| 📦 **Uninstaller** | Lists **every** program on your PC (desktop & Store) and removes them. |
| 🔑 **Activation** | Activates Windows (HWID digital license) and Office (Ohook) via the official **MAS** script. |

### 🛡️ Safety first

- ✅ **Every tweak is reversible** — what you enable, you can disable.
- ✅ **One-click restore point** before optimizing.
- ✅ **Critical components protected** — the Start menu, Store and security can't be broken.
- ✅ **Nothing experimental** — only well-known, tested settings.
- ✅ Runs as **administrator** (UAC) to apply changes correctly.

### 🚀 Installation

1. Download `PoxiOptimizer_1.0.0_x64-setup.exe` from the [Releases](https://github.com/PoxiiTV/PoxiOptimizer/releases) tab.
2. Run it and follow the wizard.
3. Open **PoxiOptimizer** and accept the administrator prompt.

> The executable is **very lightweight** (~5–10 MB) because it reuses the WebView2 engine already bundled in Windows 11.

### 🧑‍💻 Build from source

Requirements: [Node.js](https://nodejs.org), [Rust](https://rustup.rs) and Visual Studio C++ Build Tools.

```bash
npm install            # install dependencies
npm run tauri dev      # development
npm run tauri build    # build the installer
```

---

## 🧩 Stack

- **Tauri 2** (Rust) — ejecutable nativo y ligero / lightweight native binary
- **React 19 + TypeScript + Vite** — interfaz / UI
- **Tailwind CSS 4 + Framer Motion** — diseño y animaciones / design & motion
- **PowerShell** — operaciones del sistema / system operations

## 🙏 Créditos / Credits

Inspirado en / Inspired by:
[winutil](https://github.com/christitustech/winutil) · [Optimizer](https://github.com/hellzerg/optimizer) · [Microsoft Activation Scripts](https://github.com/massgravel/Microsoft-Activation-Scripts)

## ⚠️ Aviso / Disclaimer

La función de activación descarga y ejecuta el script oficial de **MAS** (proyecto de terceros, open-source). Úsala bajo tu responsabilidad. PoxiOptimizer no aloja ni modifica dicho script.

The activation feature downloads and runs the official **MAS** script (third-party, open-source project). Use at your own risk. PoxiOptimizer does not host or modify that script.

<div align="center">

Hecho con 💜 por **Poxi**

</div>
