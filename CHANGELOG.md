# 📋 Changelog

Todas las versiones notables de PoxiOptimizer. / All notable versions of PoxiOptimizer.

---

## [3.5.0] — 2026-06-12

### 🇪🇸 Español

#### ✨ Novedades
- **⚙️ ~25 tweaks nuevos** — de 28 a 53 tweaks totales. Más del doble que WinUtil. Nuevas categorías: desactivar Copilot/Recall, FSO (pantalla completa), aceleración del ratón, Teredo, IPv6, Sticky Keys, Num Lock, Storage Sense, entrega P2P de actualizaciones, OneDrive, debloat de Edge, efectos visuales, rutas largas, UTC…
- **🎮 Perfiles actualizados** — El perfil Gaming añade FSO desactivado, sin aceleración del ratón y servicios al mínimo. El perfil Privacidad incluye Copilot, Cortana y todas las nuevas claves de telemetría.
- **🔧 Panel de herramientas del sistema** — Acceso rápido a 18 herramientas de administración de Windows (Administrador de tareas, Registro, Firewall, Gestión de discos, DirectX, Monitor de recursos…) organizadas por categoría.
- **⚙️ Características opcionales de Windows** — Activa/desactiva .NET 2/3, Hyper-V, WSL, Windows Sandbox, OpenSSH, NFS y Telnet desde la app. Con detección automática del estado actual.
- **🚀 Banner Ruxi en el Dashboard** — Integración con [Ruxi](https://github.com/PoxiiTV/Ruxi-Custom-Rufus), el creador de USB de Windows más fácil. Recomendación directa desde la pantalla de inicio.

#### ⚡ Mejoras
- Perfiles Recomendado, Gaming y Privacidad rediseñados con los nuevos tweaks incluidos.
- Sidebar reorganizado con nuevo grupo "Avanzado" para Herramientas y Características.

#### 🐛 Correcciones
- Tamaño de ventana por defecto ahora 1647×922 (antes 1120×740 era demasiado pequeño).
- Las esquinas redondeadas de `#root` desaparecen al maximizar la ventana y vuelven al restaurarla.
- El círculo del toggle en la sección Hosts ya no se sale de los límites cuando está activo.
- El scroll vuelve al inicio al cambiar de vista.
- El cursor de mano aparece ahora en todos los elementos interactivos.
- Las tarjetas de Herramientas del sistema ya no tenían un `Card` anidado dentro de un `button`.

### 🇬🇧 English

#### ✨ What's new
- **⚙️ ~25 new tweaks** — from 28 to 53 tweaks total. More than double WinUtil. New: disable Copilot/Recall, FSO (fullscreen), mouse acceleration, Teredo, IPv6, Sticky Keys, Num Lock, Storage Sense, delivery optimization, OneDrive removal, Edge debloat, visual effects, long paths, UTC clock…
- **🎮 Updated profiles** — Gaming profile adds FSO off, no mouse acceleration and services set to manual. Privacy profile covers Copilot, Cortana and all new telemetry keys.
- **🔧 System tools panel** — Quick access to 18 Windows admin tools (Task Manager, Registry Editor, Firewall, Disk Management, DirectX, Resource Monitor…) grouped by category.
- **⚙️ Optional Windows features** — Enable/disable .NET 2/3, Hyper-V, WSL, Windows Sandbox, OpenSSH, NFS and Telnet from inside the app. Auto-detects current state.
- **🚀 Ruxi banner on Dashboard** — Integration with [Ruxi](https://github.com/PoxiiTV/Ruxi-Custom-Rufus), the easiest Windows USB creator. Direct recommendation from the home screen.

#### ⚡ Improvements
- Recommended, Gaming and Privacy profiles redesigned to include new tweaks.
- Sidebar reorganised with new "Advanced" group for Tools and Features.

#### 🐛 Bug fixes
- Default window size set to 1647×922 (previous 1120×740 was too small).
- Rounded corners on `#root` no longer show when the window is maximized; they return on restore.
- Hosts toggle circle no longer goes out of bounds when active.
- Scroll position now resets to the top when switching views.
- Cursor pointer now shows on all interactive elements.
- System Tools cards no longer have a nested `Card` component inside a `button`.

---

## [3.0.2] — 2026-06-12

### 🇪🇸 Español

#### ⚡ Mejoras de seguridad
- **Doble seguridad obligatoria antes de optimizar**: ahora, antes de aplicar cualquier tweak o limpieza, la app crea **automáticamente** tanto el punto de restauración como el backup del registro. Las dos medidas se ejecutan en secuencia con un overlay visual que muestra el paso activo. No se puede saltarse ninguna.

### 🇬🇧 English

#### ⚡ Security improvements
- **Mandatory dual safety before optimizing**: before applying any tweak or cleanup, the app now **automatically** creates both the restore point and the registry backup. Both run sequentially with a visual overlay showing the active step. Neither can be skipped.

---

## [3.0.1] — 2026-06-12

### 🇪🇸 Español

#### ✨ Novedades
- **🌡️ Temperatura CPU/GPU en el Dashboard**: se consultan los sensores del sistema (WMI + nvidia-smi) y se muestran junto a CPU y GPU con código de color (verde/naranja/rojo). Se actualiza cada 30 segundos automáticamente.
- **🕐 Historial de acciones**: registro persistente de todo lo que hace la app (ajustes, limpieza, DNS, activación…). Disponible en Ajustes con botón **Deshacer** por entrada (tweaks) y opción de limpiar el historial completo.
- **📝 Backup del registro**: exporta las ~23 claves de registro que tocan los tweaks a un `.reg` en `Documentos\PoxiOptimizer\backups\`. Disponible en Ajustes.
- **🌐 Gestor del archivo Hosts**: nueva sección en el menú lateral. Lista estructurada con toggle activo/inactivo, añadir/borrar entradas, preset **Bloquear telemetría de Microsoft** (13 dominios) y restaurar al valor por defecto. Siempre crea `.bak` antes de escribir y flushea el DNS.

### 🇬🇧 English

#### ✨ What's new
- **🌡️ CPU/GPU temperature in Dashboard**: reads system sensors (WMI + nvidia-smi) and shows them next to CPU and GPU with color coding (green/orange/red). Updates every 30 seconds automatically.
- **🕐 Action history**: persistent log of everything the app does (tweaks, cleanup, DNS, activation…). Available in Settings with per-entry **Undo** button (tweaks) and a clear-all option.
- **📝 Registry backup**: exports the ~23 registry keys touched by tweaks to a `.reg` file in `Documents\PoxiOptimizer\backups\`. Available in Settings.
- **🌐 Hosts file manager**: new sidebar section. Structured list with enable/disable toggle, add/delete entries, **Block Microsoft telemetry** preset (13 domains) and restore to Windows default. Always creates a `.bak` before writing and flushes DNS.

---

## [3.0.0] — 2026-06-11

### 🇪🇸 Español

#### ✨ Novedades
- **🪄 Modo Post-Formateo**: deja tu PC perfecto justo después de formatear con un solo asistente. Optimización gaming al máximo, configurado al gusto de Poxi. En orden hace:
  1. Crea un punto de restauración `PostFormateo`.
  2. Quita **todo** el bloatware (manteniendo Microsoft Store y la app Xbox; sin tocar Edge, Bloc de notas ni componentes esenciales).
  3. Aplica el perfil de optimización **Gaming**.
  4. Instala las apps esenciales (Chrome, Discord, WhatsApp, Telegram, Spotify, VLC, Everything, WinRAR, PowerToys, Python 3.12, Java, Node.js, Steam, Epic Games, Malwarebytes).
  5. Pone **Chrome como predeterminado**.
  6. Configura **DNS de Google**.
  7. **Activa Windows**.
  8. Pone **Windows Update en solo seguridad**.
  9. **Desactiva todos los programas de inicio**.
- Pantalla explicativa previa + ejecución con **progreso animado paso a paso** (timeline) y pantalla de éxito.

### 🇬🇧 English

#### ✨ What's new
- **🪄 Post-Format mode**: get your PC perfect right after a clean install with a single wizard (max gaming optimization, set up the way Poxi likes it):
  1. Creates a `PostFormateo` restore point.
  2. Removes **all** bloatware (keeping Microsoft Store and the Xbox app; leaving Edge, Notepad and essential components untouched).
  3. Applies the **Gaming** optimization profile.
  4. Installs essential apps (Chrome, Discord, WhatsApp, Telegram, Spotify, VLC, Everything, WinRAR, PowerToys, Python 3.12, Java, Node.js, Steam, Epic Games, Malwarebytes).
  5. Sets **Chrome as default**.
  6. Sets **Google DNS**.
  7. **Activates Windows**.
  8. Sets **Windows Update to security-only**.
  9. **Disables all startup programs**.
- Pre-run explainer + **animated step-by-step progress** (timeline) and a success screen.

---

## [2.0.0] — 2026-06-11

### 🇪🇸 Español

#### ✨ Novedades
- **Perfiles de optimización 1 clic**: Recomendado, Gaming y Privacidad máxima.
- **Buscador de winget en vivo**: instala cualquier programa, no solo el catálogo.
- **Exportar / importar configuración** en un archivo `.json`.
- **Reparar Windows**: SFC, DISM (RestoreHealth) y restablecer Windows Update.
- **Gestor de inicio**: activa/desactiva los programas que arrancan con Windows.
- **Red y DNS**: cambia a Google DNS o Cloudflare con un clic.
- **Más limpieza**: caché de navegadores, miniaturas, logs, cola de impresión y WinSxS (DISM).
- **Comprobación de actualizaciones** desde las releases de GitHub.
- **Pantalla de bienvenida** (onboarding) la primera vez.
- **Activación en español**: MAS se ejecuta por detrás y el resultado se muestra en castellano.

#### ⚡ Mejoras
- Comandos asíncronos: la interfaz ya no se congela.
- Caché de la información del sistema para una navegación instantánea.

### 🇬🇧 English

#### ✨ What's new
- **1-click optimization profiles**: Recommended, Gaming and Maximum privacy.
- **Live winget search**: install any program, not just the catalog.
- **Export / import configuration** to a `.json` file.
- **Repair Windows**: SFC, DISM (RestoreHealth) and reset Windows Update.
- **Startup manager**: enable/disable programs that launch with Windows.
- **Network & DNS**: switch to Google DNS or Cloudflare in one click.
- **More cleanup**: browser cache, thumbnails, logs, print queue and WinSxS (DISM).
- **Update check** from GitHub releases.
- **Welcome screen** (onboarding) on first launch.
- **Activation in Spanish**: MAS runs in the background and the result is shown in Spanish.

#### ⚡ Improvements
- Async commands: the UI no longer freezes.
- System info caching for instant navigation.

---

## [1.0.0] — 2026-06-10

### 🇪🇸 Español

#### ✨ Novedades
- **Primera versión pública** de PoxiOptimizer.
- **Panel de inicio** con información en tiempo real del sistema (CPU, GPU, RAM, disco), estado de activación y acciones rápidas.
- **Optimización** con +25 *tweaks* seguros y reversibles (privacidad, telemetría, rendimiento, red e interfaz).
- **Limpieza** de temporales, caché de Windows Update, papelera y caché DNS con cálculo del espacio liberado.
- **Quitar bloatware**: desinstalación de apps de la Store con protección de componentes críticos.
- **Instalar apps**: catálogo de programas populares vía winget.
- **Desinstalador universal** de todos los programas del equipo.
- **Activación** de Windows y Office mediante Microsoft Activation Scripts (MAS).
- **Interfaz glassmorphism** con tema oscuro, animaciones suaves e idioma **Español / Inglés**.

#### 🛡️ Seguridad
- Punto de restauración con un clic antes de optimizar.
- Todos los cambios son reversibles.
- Componentes críticos del sistema protegidos.

### 🇬🇧 English

#### ✨ What's new
- **First public release** of PoxiOptimizer.
- **Home dashboard** with real-time system info (CPU, GPU, RAM, disk), activation status and quick actions.
- **Optimization** with 25+ safe, reversible tweaks (privacy, telemetry, performance, network and UI).
- **Cleanup** of temp files, Windows Update cache, recycle bin and DNS cache with freed-space report.
- **Remove bloatware**: uninstall Store apps with protection for critical components.
- **Install apps**: catalog of popular programs via winget.
- **Universal uninstaller** for every program on the PC.
- **Activation** of Windows and Office via Microsoft Activation Scripts (MAS).
- **Glassmorphism UI** with dark theme, smooth animations and **Spanish / English** language.

#### 🛡️ Safety
- One-click restore point before optimizing.
- All changes are reversible.
- Critical system components are protected.
