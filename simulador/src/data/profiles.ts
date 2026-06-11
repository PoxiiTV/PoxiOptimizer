/* Perfiles de optimización 1-clic. Cada perfil es una lista de IDs de tweaks
   que se activan en bloque. Los IDs coinciden con el catálogo del backend. */

export interface Profile {
  id: string;
  name: string;
  nameEn: string;
  desc: string;
  descEn: string;
  icon: "shield-check" | "gamepad" | "eye-off";
  tweaks: string[];
}

// Base segura y recomendada (sin nada arriesgado ni específico de juegos).
const RECOMMENDED = [
  "telemetry",
  "advertising-id",
  "activity-history",
  "tailored-experiences",
  "suggested-content",
  "feedback",
  "gamebar-dvr",
  "game-mode",
  "background-apps",
  "startup-delay",
  "menu-show-delay",
  "network-throttling",
  "show-file-extensions",
  "taskbar-widgets",
  "taskbar-chat",
  "bing-search",
  "lockscreen-tips",
  "widgets-news",
];

export const PROFILES: Profile[] = [
  {
    id: "recommended",
    name: "Recomendado",
    nameEn: "Recommended",
    desc: "Lo mejor para la mayoría: privacidad, rendimiento y limpieza de interfaz, sin tocar nada peligroso.",
    descEn: "Best for most users: privacy, performance and UI cleanup, without touching anything risky.",
    icon: "shield-check",
    tweaks: RECOMMENDED,
  },
  {
    id: "gaming",
    name: "Gaming",
    nameEn: "Gaming",
    desc: "Todo lo recomendado más ajustes de máximo rendimiento y red para juegos. Incluye algún ajuste avanzado.",
    descEn: "Everything recommended plus max performance and network tweaks for gaming. Includes some advanced tweaks.",
    icon: "gamepad",
    tweaks: [
      ...RECOMMENDED,
      "nagle",
      "ultimate-performance",
      "disable-power-throttling",
      "disable-hvci",
    ],
  },
  {
    id: "privacy",
    name: "Privacidad máxima",
    nameEn: "Maximum privacy",
    desc: "Máximo bloqueo de telemetría y rastreo. Incluye desactivar la ubicación.",
    descEn: "Maximum telemetry and tracking blocking. Includes disabling location.",
    icon: "eye-off",
    tweaks: [
      "telemetry",
      "advertising-id",
      "activity-history",
      "location-tracking",
      "tailored-experiences",
      "suggested-content",
      "feedback",
      "bing-search",
      "lockscreen-tips",
      "widgets-news",
      "background-apps",
    ],
  },
];
