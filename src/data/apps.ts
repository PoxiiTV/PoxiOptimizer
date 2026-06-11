/* Catálogo curado de aplicaciones populares para instalar con winget.
   El `id` es el identificador exacto de winget. */

export interface CatalogApp {
  id: string;
  name: string;
  category: string;
  desc: string;
}

export const APP_CATEGORIES = [
  "Navegadores",
  "Mensajería",
  "Multimedia",
  "Utilidades",
  "Ofimática",
  "Nube",
  "Desarrollo",
  "Juegos",
  "Seguridad",
] as const;

export const APPS: CatalogApp[] = [
  // Navegadores
  { id: "Google.Chrome", name: "Google Chrome", category: "Navegadores", desc: "Navegador web de Google" },
  { id: "Mozilla.Firefox", name: "Mozilla Firefox", category: "Navegadores", desc: "Navegador libre y privado" },
  { id: "Brave.Brave", name: "Brave", category: "Navegadores", desc: "Navegador centrado en la privacidad" },
  { id: "Opera.Opera", name: "Opera", category: "Navegadores", desc: "Navegador con funciones integradas" },
  { id: "Opera.OperaGX", name: "Opera GX", category: "Navegadores", desc: "Navegador para gamers" },
  { id: "Vivaldi.Vivaldi", name: "Vivaldi", category: "Navegadores", desc: "Navegador muy personalizable" },

  // Mensajería
  { id: "Discord.Discord", name: "Discord", category: "Mensajería", desc: "Chat de voz y texto para comunidades" },
  { id: "Telegram.TelegramDesktop", name: "Telegram", category: "Mensajería", desc: "Mensajería rápida y segura" },
  { id: "WhatsApp.WhatsApp", name: "WhatsApp", category: "Mensajería", desc: "Mensajería para escritorio" },
  { id: "Zoom.Zoom", name: "Zoom", category: "Mensajería", desc: "Videollamadas y reuniones" },
  { id: "Microsoft.Teams", name: "Microsoft Teams", category: "Mensajería", desc: "Trabajo en equipo y reuniones" },
  { id: "SlackTechnologies.Slack", name: "Slack", category: "Mensajería", desc: "Comunicación para equipos" },
  { id: "Skype.Skype", name: "Skype", category: "Mensajería", desc: "Llamadas y videollamadas" },

  // Multimedia
  { id: "Spotify.Spotify", name: "Spotify", category: "Multimedia", desc: "Música en streaming" },
  { id: "VideoLAN.VLC", name: "VLC", category: "Multimedia", desc: "Reproductor multimedia universal" },
  { id: "OBSProject.OBSStudio", name: "OBS Studio", category: "Multimedia", desc: "Grabación y streaming" },
  { id: "GIMP.GIMP", name: "GIMP", category: "Multimedia", desc: "Editor de imágenes" },
  { id: "Audacity.Audacity", name: "Audacity", category: "Multimedia", desc: "Editor de audio" },
  { id: "HandBrake.HandBrake", name: "HandBrake", category: "Multimedia", desc: "Conversor de vídeo" },
  { id: "BlenderFoundation.Blender", name: "Blender", category: "Multimedia", desc: "Modelado y animación 3D" },
  { id: "DaVinci.Resolve", name: "DaVinci Resolve", category: "Multimedia", desc: "Edición de vídeo profesional" },

  // Utilidades
  { id: "7zip.7zip", name: "7-Zip", category: "Utilidades", desc: "Compresor de archivos" },
  { id: "Notepad++.Notepad++", name: "Notepad++", category: "Utilidades", desc: "Editor de texto avanzado" },
  { id: "voidtools.Everything", name: "Everything", category: "Utilidades", desc: "Búsqueda instantánea de archivos" },
  { id: "RARLab.WinRAR", name: "WinRAR", category: "Utilidades", desc: "Compresor RAR/ZIP" },
  { id: "Microsoft.PowerToys", name: "PowerToys", category: "Utilidades", desc: "Utilidades avanzadas de Windows" },
  { id: "CPUID.CPU-Z", name: "CPU-Z", category: "Utilidades", desc: "Información del hardware" },
  { id: "TechPowerUp.GPU-Z", name: "GPU-Z", category: "Utilidades", desc: "Información de la tarjeta gráfica" },
  { id: "REalix.HWiNFO", name: "HWiNFO", category: "Utilidades", desc: "Monitorización del sistema" },
  { id: "CrystalDewWorld.CrystalDiskInfo", name: "CrystalDiskInfo", category: "Utilidades", desc: "Salud de discos" },
  { id: "Rufus.Rufus", name: "Rufus", category: "Utilidades", desc: "Crear USB de arranque" },
  { id: "WinDirStat.WinDirStat", name: "WinDirStat", category: "Utilidades", desc: "Analiza el uso del disco" },

  // Ofimática
  { id: "Adobe.Acrobat.Reader.64-bit", name: "Acrobat Reader", category: "Ofimática", desc: "Lector de PDF" },
  { id: "TheDocumentFoundation.LibreOffice", name: "LibreOffice", category: "Ofimática", desc: "Suite ofimática libre" },
  { id: "Notion.Notion", name: "Notion", category: "Ofimática", desc: "Notas y organización" },
  { id: "Obsidian.Obsidian", name: "Obsidian", category: "Ofimática", desc: "Notas con enlaces (Markdown)" },
  { id: "Foxit.FoxitReader", name: "Foxit PDF Reader", category: "Ofimática", desc: "Lector de PDF ligero" },

  // Nube
  { id: "Google.GoogleDrive", name: "Google Drive", category: "Nube", desc: "Almacenamiento en la nube" },
  { id: "Dropbox.Dropbox", name: "Dropbox", category: "Nube", desc: "Sincronización de archivos" },
  { id: "Mega.MEGASync", name: "MEGA", category: "Nube", desc: "Almacenamiento cifrado" },

  // Desarrollo
  { id: "Microsoft.VisualStudioCode", name: "VS Code", category: "Desarrollo", desc: "Editor de código de Microsoft" },
  { id: "Git.Git", name: "Git", category: "Desarrollo", desc: "Control de versiones" },
  { id: "OpenJS.NodeJS", name: "Node.js", category: "Desarrollo", desc: "Entorno de ejecución JavaScript" },
  { id: "Python.Python.3.12", name: "Python 3.12", category: "Desarrollo", desc: "Lenguaje de programación" },
  { id: "Docker.DockerDesktop", name: "Docker Desktop", category: "Desarrollo", desc: "Contenedores de software" },
  { id: "Microsoft.PowerShell", name: "PowerShell 7", category: "Desarrollo", desc: "Shell moderna multiplataforma" },
  { id: "GitHub.GitHubDesktop", name: "GitHub Desktop", category: "Desarrollo", desc: "Cliente gráfico de Git" },
  { id: "Postman.Postman", name: "Postman", category: "Desarrollo", desc: "Cliente de APIs" },
  { id: "Oracle.JavaRuntimeEnvironment", name: "Java (JRE)", category: "Desarrollo", desc: "Entorno de ejecución Java" },

  // Juegos
  { id: "Valve.Steam", name: "Steam", category: "Juegos", desc: "Plataforma de videojuegos" },
  { id: "EpicGames.EpicGamesLauncher", name: "Epic Games", category: "Juegos", desc: "Tienda de videojuegos" },
  { id: "Nvidia.GeForceExperience", name: "GeForce Experience", category: "Juegos", desc: "Drivers y optimización NVIDIA" },
  { id: "EA.Desktop", name: "EA App", category: "Juegos", desc: "Juegos de Electronic Arts" },
  { id: "Ubisoft.Connect", name: "Ubisoft Connect", category: "Juegos", desc: "Juegos de Ubisoft" },
  { id: "GOG.Galaxy", name: "GOG Galaxy", category: "Juegos", desc: "Tienda de juegos sin DRM" },

  // Seguridad
  { id: "Malwarebytes.Malwarebytes", name: "Malwarebytes", category: "Seguridad", desc: "Antimalware" },
  { id: "Bitwarden.Bitwarden", name: "Bitwarden", category: "Seguridad", desc: "Gestor de contraseñas" },
  { id: "Proton.ProtonVPN", name: "Proton VPN", category: "Seguridad", desc: "VPN segura y privada" },
];
