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
  "Desarrollo",
  "Juegos",
] as const;

export const APPS: CatalogApp[] = [
  // Navegadores
  { id: "Google.Chrome", name: "Google Chrome", category: "Navegadores", desc: "Navegador web de Google" },
  { id: "Mozilla.Firefox", name: "Mozilla Firefox", category: "Navegadores", desc: "Navegador libre y privado" },
  { id: "Brave.Brave", name: "Brave", category: "Navegadores", desc: "Navegador centrado en la privacidad" },
  { id: "Opera.Opera", name: "Opera", category: "Navegadores", desc: "Navegador con funciones integradas" },

  // Mensajería
  { id: "Discord.Discord", name: "Discord", category: "Mensajería", desc: "Chat de voz y texto para comunidades" },
  { id: "Telegram.TelegramDesktop", name: "Telegram", category: "Mensajería", desc: "Mensajería rápida y segura" },
  { id: "WhatsApp.WhatsApp", name: "WhatsApp", category: "Mensajería", desc: "Mensajería para escritorio" },
  { id: "Zoom.Zoom", name: "Zoom", category: "Mensajería", desc: "Videollamadas y reuniones" },

  // Multimedia
  { id: "Spotify.Spotify", name: "Spotify", category: "Multimedia", desc: "Música en streaming" },
  { id: "VideoLAN.VLC", name: "VLC", category: "Multimedia", desc: "Reproductor multimedia universal" },
  { id: "OBSProject.OBSStudio", name: "OBS Studio", category: "Multimedia", desc: "Grabación y streaming" },
  { id: "GIMP.GIMP", name: "GIMP", category: "Multimedia", desc: "Editor de imágenes" },

  // Utilidades
  { id: "7zip.7zip", name: "7-Zip", category: "Utilidades", desc: "Compresor de archivos" },
  { id: "Notepad++.Notepad++", name: "Notepad++", category: "Utilidades", desc: "Editor de texto avanzado" },
  { id: "voidtools.Everything", name: "Everything", category: "Utilidades", desc: "Búsqueda instantánea de archivos" },
  { id: "Adobe.Acrobat.Reader.64-bit", name: "Acrobat Reader", category: "Utilidades", desc: "Lector de PDF" },
  { id: "RARLab.WinRAR", name: "WinRAR", category: "Utilidades", desc: "Compresor RAR/ZIP" },
  { id: "Microsoft.PowerToys", name: "PowerToys", category: "Utilidades", desc: "Utilidades avanzadas de Windows" },

  // Desarrollo
  { id: "Microsoft.VisualStudioCode", name: "VS Code", category: "Desarrollo", desc: "Editor de código de Microsoft" },
  { id: "Git.Git", name: "Git", category: "Desarrollo", desc: "Control de versiones" },
  { id: "OpenJS.NodeJS", name: "Node.js", category: "Desarrollo", desc: "Entorno de ejecución JavaScript" },
  { id: "Python.Python.3.12", name: "Python 3.12", category: "Desarrollo", desc: "Lenguaje de programación" },
  { id: "Docker.DockerDesktop", name: "Docker Desktop", category: "Desarrollo", desc: "Contenedores de software" },

  // Juegos
  { id: "Valve.Steam", name: "Steam", category: "Juegos", desc: "Plataforma de videojuegos" },
  { id: "EpicGames.EpicGamesLauncher", name: "Epic Games", category: "Juegos", desc: "Tienda de videojuegos" },
  { id: "Nvidia.GeForceExperience", name: "GeForce Experience", category: "Juegos", desc: "Drivers y optimización NVIDIA" },
];
