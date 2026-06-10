/* Internacionalización ES/EN centralizada con fallback al castellano.
   El chrome de la app es bilingüe; los textos dinámicos del sistema
   (nombres de apps, etc.) provienen del backend. */

export type Lang = "es" | "en";

type Dict = Record<string, string>;

const es: Dict = {
  "app.subtitle": "Optimiza, limpia y activa Windows",
  "nav.dashboard": "Inicio",
  "nav.optimize": "Optimización",
  "nav.debloat": "Quitar bloatware",
  "nav.install": "Instalar apps",
  "nav.uninstall": "Desinstalador",
  "nav.cleanup": "Limpieza",
  "nav.activate": "Activación",
  "nav.settings": "Ajustes",
  "nav.group.system": "Sistema",
  "nav.group.apps": "Aplicaciones",
  "nav.group.other": "Más",

  "common.apply": "Aplicar",
  "common.applied": "Aplicado",
  "common.revert": "Revertir",
  "common.loading": "Cargando…",
  "common.search": "Buscar…",
  "common.selectAll": "Seleccionar todo",
  "common.deselectAll": "Quitar selección",
  "common.recommended": "Recomendado",
  "common.protected": "Protegido",
  "common.selected": "seleccionados",
  "common.refresh": "Actualizar",
  "common.cancel": "Cancelar",
  "common.confirm": "Confirmar",
  "common.working": "Trabajando…",
  "common.done": "Listo",
  "common.empty": "No hay nada que mostrar",

  "admin.warning.title": "Sin permisos de administrador",
  "admin.warning.body":
    "Algunas acciones podrían fallar. Reinicia la app como administrador.",

  "dash.welcome": "Bienvenido",
  "dash.activation": "Activación",
  "dash.activated": "Windows activado",
  "dash.notActivated": "Windows no activado",
  "dash.ram": "Memoria RAM",
  "dash.disk": "Disco del sistema",
  "dash.uptime": "Encendido",
  "dash.hours": "h",
  "dash.quick": "Acciones rápidas",
  "dash.quick.restore": "Crear punto de restauración",
  "dash.quick.restoreDesc": "Crea una copia de seguridad antes de optimizar",
  "dash.quick.optimize": "Optimización recomendada",
  "dash.quick.optimizeDesc": "Aplica todos los tweaks recomendados de golpe",
  "dash.quick.clean": "Limpieza rápida",
  "dash.quick.cleanDesc": "Borra temporales y caché del sistema",
  "dash.system": "Información del sistema",

  "opt.title": "Optimización del sistema",
  "opt.subtitle":
    "Tweaks seguros y reversibles. Puedes activarlos y desactivarlos cuando quieras.",
  "opt.applyRecommended": "Aplicar recomendados",
  "opt.cat.Privacidad": "Privacidad y telemetría",
  "opt.cat.Rendimiento": "Rendimiento",
  "opt.cat.Red": "Red",
  "opt.cat.Interfaz": "Interfaz",
  "opt.cat.Sistema": "Sistema",

  "debloat.title": "Quitar bloatware",
  "debloat.subtitle":
    "Desinstala apps preinstaladas de la Store. Los componentes críticos están protegidos.",
  "debloat.removeSelected": "Eliminar seleccionadas",
  "debloat.confirm": "¿Eliminar las apps seleccionadas?",

  "install.title": "Instalar aplicaciones",
  "install.subtitle":
    "Instala tus programas favoritos con un clic mediante winget.",
  "install.installSelected": "Instalar seleccionadas",
  "install.noWinget":
    "winget no está disponible en este sistema. Actualiza el 'Instalador de aplicaciones' desde la Microsoft Store.",
  "install.installing": "Instalando",

  "uninstall.title": "Desinstalador universal",
  "uninstall.subtitle":
    "Todos los programas instalados en tu equipo. Desinstala los que no uses.",
  "uninstall.uninstall": "Desinstalar",
  "uninstall.confirm": "¿Desinstalar el programa seleccionado?",

  "cleanup.title": "Limpieza del sistema",
  "cleanup.subtitle": "Libera espacio borrando archivos temporales y cachés.",
  "cleanup.temp": "Archivos temporales",
  "cleanup.tempDesc": "Carpetas Temp del usuario y de Windows",
  "cleanup.update": "Caché de Windows Update",
  "cleanup.updateDesc": "Descargas antiguas de actualizaciones",
  "cleanup.recycle": "Papelera de reciclaje",
  "cleanup.recycleDesc": "Vacía la papelera",
  "cleanup.dns": "Caché DNS",
  "cleanup.dnsDesc": "Limpia la resolución de nombres de red",
  "cleanup.run": "Iniciar limpieza",
  "cleanup.freed": "Espacio liberado",

  "activate.title": "Activación de Windows y Office",
  "activate.subtitle":
    "Activación mediante Microsoft Activation Scripts (MAS), proyecto open-source de massgravel.",
  "activate.windows": "Activar Windows",
  "activate.windowsDesc": "Licencia digital permanente (HWID)",
  "activate.office": "Activar Office",
  "activate.officeDesc": "Activación permanente de Office (Ohook)",
  "activate.menu": "Abrir menú completo de MAS",
  "activate.menuDesc": "Todas las opciones de activación y diagnóstico",
  "activate.disclaimer":
    "MAS es una herramienta de terceros (massgravel). Se descarga y ejecuta su script oficial. Úsalo bajo tu responsabilidad.",

  "settings.title": "Ajustes",
  "settings.language": "Idioma",
  "settings.about": "Acerca de",
  "settings.aboutBody":
    "PoxiOptimizer · la herramienta definitiva para optimizar, limpiar y activar Windows.",
  "settings.repo": "Repositorio en GitHub",
  "settings.credits":
    "Inspirado en winutil (Chris Titus), Optimizer (hellzerg) y MAS (massgravel).",
};

const en: Dict = {
  "app.subtitle": "Optimize, clean and activate Windows",
  "nav.dashboard": "Home",
  "nav.optimize": "Optimization",
  "nav.debloat": "Remove bloatware",
  "nav.install": "Install apps",
  "nav.uninstall": "Uninstaller",
  "nav.cleanup": "Cleanup",
  "nav.activate": "Activation",
  "nav.settings": "Settings",
  "nav.group.system": "System",
  "nav.group.apps": "Applications",
  "nav.group.other": "More",

  "common.apply": "Apply",
  "common.applied": "Applied",
  "common.revert": "Revert",
  "common.loading": "Loading…",
  "common.search": "Search…",
  "common.selectAll": "Select all",
  "common.deselectAll": "Deselect all",
  "common.recommended": "Recommended",
  "common.protected": "Protected",
  "common.selected": "selected",
  "common.refresh": "Refresh",
  "common.cancel": "Cancel",
  "common.confirm": "Confirm",
  "common.working": "Working…",
  "common.done": "Done",
  "common.empty": "Nothing to show",

  "admin.warning.title": "No administrator rights",
  "admin.warning.body": "Some actions may fail. Restart the app as administrator.",

  "dash.welcome": "Welcome",
  "dash.activation": "Activation",
  "dash.activated": "Windows activated",
  "dash.notActivated": "Windows not activated",
  "dash.ram": "RAM memory",
  "dash.disk": "System disk",
  "dash.uptime": "Uptime",
  "dash.hours": "h",
  "dash.quick": "Quick actions",
  "dash.quick.restore": "Create restore point",
  "dash.quick.restoreDesc": "Make a backup before optimizing",
  "dash.quick.optimize": "Recommended optimization",
  "dash.quick.optimizeDesc": "Apply all recommended tweaks at once",
  "dash.quick.clean": "Quick cleanup",
  "dash.quick.cleanDesc": "Delete temp files and system cache",
  "dash.system": "System information",

  "opt.title": "System optimization",
  "opt.subtitle": "Safe, reversible tweaks. Toggle them on and off anytime.",
  "opt.applyRecommended": "Apply recommended",
  "opt.cat.Privacidad": "Privacy & telemetry",
  "opt.cat.Rendimiento": "Performance",
  "opt.cat.Red": "Network",
  "opt.cat.Interfaz": "Interface",
  "opt.cat.Sistema": "System",

  "debloat.title": "Remove bloatware",
  "debloat.subtitle":
    "Uninstall preinstalled Store apps. Critical components are protected.",
  "debloat.removeSelected": "Remove selected",
  "debloat.confirm": "Remove the selected apps?",

  "install.title": "Install applications",
  "install.subtitle": "Install your favorite programs in one click via winget.",
  "install.installSelected": "Install selected",
  "install.noWinget":
    "winget is not available on this system. Update 'App Installer' from the Microsoft Store.",
  "install.installing": "Installing",

  "uninstall.title": "Universal uninstaller",
  "uninstall.subtitle":
    "Every program installed on your PC. Uninstall what you don't use.",
  "uninstall.uninstall": "Uninstall",
  "uninstall.confirm": "Uninstall the selected program?",

  "cleanup.title": "System cleanup",
  "cleanup.subtitle": "Free up space by clearing temp files and caches.",
  "cleanup.temp": "Temporary files",
  "cleanup.tempDesc": "User and Windows Temp folders",
  "cleanup.update": "Windows Update cache",
  "cleanup.updateDesc": "Old update downloads",
  "cleanup.recycle": "Recycle bin",
  "cleanup.recycleDesc": "Empty the recycle bin",
  "cleanup.dns": "DNS cache",
  "cleanup.dnsDesc": "Flush network name resolution",
  "cleanup.run": "Start cleanup",
  "cleanup.freed": "Space freed",

  "activate.title": "Windows & Office activation",
  "activate.subtitle":
    "Activation via Microsoft Activation Scripts (MAS), the open-source project by massgravel.",
  "activate.windows": "Activate Windows",
  "activate.windowsDesc": "Permanent digital license (HWID)",
  "activate.office": "Activate Office",
  "activate.officeDesc": "Permanent Office activation (Ohook)",
  "activate.menu": "Open full MAS menu",
  "activate.menuDesc": "All activation and troubleshooting options",
  "activate.disclaimer":
    "MAS is a third-party tool (massgravel). Its official script is downloaded and run. Use at your own risk.",

  "settings.title": "Settings",
  "settings.language": "Language",
  "settings.about": "About",
  "settings.aboutBody":
    "PoxiOptimizer · the ultimate tool to optimize, clean and activate Windows.",
  "settings.repo": "GitHub repository",
  "settings.credits":
    "Inspired by winutil (Chris Titus), Optimizer (hellzerg) and MAS (massgravel).",
};

const dicts: Record<Lang, Dict> = { es, en };

export function translate(lang: Lang, key: string): string {
  return dicts[lang][key] ?? es[key] ?? key;
}
