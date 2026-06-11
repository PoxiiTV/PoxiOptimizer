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
  // Privacidad
  "telemetry",
  "advertising-id",
  "activity-history",
  "tailored-experiences",
  "suggested-content",
  "feedback",
  "consumer-features",
  "delivery-optimization",
  "windows-ai",
  "powershell-telemetry",
  "start-recommendations",
  "cortana",
  // Rendimiento
  "gamebar-dvr",
  "game-mode",
  "background-apps",
  "startup-delay",
  "menu-show-delay",
  "fullscreen-optimizations",
  "mouse-acceleration",
  // Red
  "network-throttling",
  "teredo-disable",
  // Interfaz
  "show-file-extensions",
  "taskbar-widgets",
  "taskbar-chat",
  "bing-search",
  "sticky-keys",
  "num-lock-startup",
  // Sistema
  "lockscreen-tips",
  "widgets-news",
  "storage-sense",
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
    desc: "Todo lo recomendado más FSO desactivado, sin aceleración del ratón, servicios al mínimo y máximo rendimiento energético.",
    descEn: "Everything recommended plus FSO disabled, no mouse acceleration, minimal services and max power performance.",
    icon: "gamepad",
    tweaks: [
      ...RECOMMENDED,
      "nagle",
      "services-manual",
      "visual-effects-performance",
      "ultimate-performance",
      "disable-power-throttling",
      "disable-hvci",
    ],
  },
  {
    id: "privacy",
    name: "Privacidad máxima",
    nameEn: "Maximum privacy",
    desc: "Máximo bloqueo de telemetría, rastreo, Copilot, Cortana y ubicación. Ideal para quienes priorizan la privacidad.",
    descEn: "Maximum blocking of telemetry, tracking, Copilot, Cortana and location. Ideal for privacy-first users.",
    icon: "eye-off",
    tweaks: [
      "telemetry",
      "advertising-id",
      "activity-history",
      "location-tracking",
      "tailored-experiences",
      "suggested-content",
      "feedback",
      "consumer-features",
      "delivery-optimization",
      "windows-ai",
      "powershell-telemetry",
      "start-recommendations",
      "cortana",
      "bing-search",
      "lockscreen-tips",
      "widgets-news",
      "background-apps",
      "storage-sense",
    ],
  },
];
