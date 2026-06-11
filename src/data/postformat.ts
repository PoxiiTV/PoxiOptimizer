/* Apps que instala el modo Post-Formateo (configuración personal de Poxi:
   gaming + utilidades esenciales). IDs exactos de winget. */

export interface PostApp {
  id: string;
  name: string;
}

export const POSTFORMAT_APPS: PostApp[] = [
  { id: "Google.Chrome", name: "Google Chrome" },
  { id: "Discord.Discord", name: "Discord" },
  { id: "WhatsApp.WhatsApp", name: "WhatsApp" },
  { id: "Telegram.TelegramDesktop", name: "Telegram" },
  { id: "Spotify.Spotify", name: "Spotify" },
  { id: "VideoLAN.VLC", name: "VLC" },
  { id: "voidtools.Everything", name: "Everything" },
  { id: "RARLab.WinRAR", name: "WinRAR" },
  { id: "Microsoft.PowerToys", name: "PowerToys" },
  { id: "Python.Python.3.12", name: "Python 3.12" },
  { id: "Oracle.JavaRuntimeEnvironment", name: "Java" },
  { id: "OpenJS.NodeJS", name: "Node.js" },
  { id: "Valve.Steam", name: "Steam" },
  { id: "EpicGames.EpicGamesLauncher", name: "Epic Games" },
  { id: "Malwarebytes.Malwarebytes", name: "Malwarebytes" },
];
