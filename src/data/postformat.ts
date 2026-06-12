/* Apps que instala el modo Post-Formateo.
   La instalación usa Ninite — no requiere winget ni Microsoft Store. */

export interface PostApp {
  id: string;
  name: string;
}

export const POSTFORMAT_APPS: PostApp[] = [
  { id: "chrome",       name: "Google Chrome" },
  { id: "discord",      name: "Discord" },
  { id: "aimp",         name: "AIMP" },
  { id: "spotify",      name: "Spotify" },
  { id: "vlc",          name: "VLC" },
  { id: "filezilla",    name: "FileZilla" },
  { id: "everything",   name: "Everything" },
  { id: "winrar",       name: "WinRAR" },
  { id: "python3",      name: "Python 3" },
  { id: "adoptjavax21", name: "Java JRE 21 (Adoptium)" },
  { id: "adoptjdkx21",  name: "Java JDK 21 (Adoptium)" },
  { id: "steam",        name: "Steam" },
  { id: "epic",         name: "Epic Games" },
  { id: "malwarebytes", name: "Malwarebytes" },
];

export const NINITE_URL =
  "https://ninite.com/adoptjavax21-adoptjdkx21-aimp-chrome-discord-epic-everything-filezilla-malwarebytes-python3-spotify-steam-vlc-winrar/ninite.exe";
