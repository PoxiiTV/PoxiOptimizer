import { invoke } from "@tauri-apps/api/core";

/* Tipos compartidos con el backend Rust */

export interface SystemInfo {
  os_name: string;
  os_version: string;
  os_build: string;
  arch: string;
  computer_name: string;
  user_name: string;
  cpu: string;
  gpu: string;
  ram_total: number;
  ram_used: number;
  ram_percent: number;
  disk_total: number;
  disk_used: number;
  disk_free: number;
  disk_percent: number;
  uptime_hours: number;
}

export interface ActivationStatus {
  activated: boolean;
  edition: string;
  detail: string;
}

export interface TweakMeta {
  id: string;
  category: string;
  title: string;
  description: string;
  recommended: boolean;
  risky: boolean;
}

export interface AppxItem {
  name: string;
  display: string;
  version: string;
  protected: boolean;
  recommended: boolean;
}

export interface Program {
  id: string;
  name: string;
  version: string;
  publisher: string;
  source: string;
}

export interface CleanupResult {
  freed_mb: number;
  details: string[];
}

export interface WingetResult {
  id: string;
  name: string;
  version: string;
}

export interface StartupItem {
  name: string;
  command: string;
  location: string;
  enabled: boolean;
}

export interface UpdateInfo {
  update_available: boolean;
  current: string;
  latest: string;
  url: string;
  notes: string;
}

/* Sistema */
export const getSystemInfo = () => invoke<SystemInfo>("get_system_info");
export const isAdmin = () => invoke<boolean>("is_admin");
export const getActivationStatus = () =>
  invoke<ActivationStatus>("get_activation_status");
export const createRestorePoint = (description: string) =>
  invoke<string>("create_restore_point", { description });

/* Tweaks */
export const getTweaks = () => invoke<TweakMeta[]>("get_tweaks");
export const applyTweak = (id: string) => invoke<string>("apply_tweak", { id });
export const revertTweak = (id: string) =>
  invoke<string>("revert_tweak", { id });
export const checkAllTweaks = () =>
  invoke<Record<string, boolean>>("check_all_tweaks");

/* Debloat */
export const listAppx = () => invoke<AppxItem[]>("list_appx");
export const removeAppx = (name: string) =>
  invoke<string>("remove_appx", { name });

/* Apps (winget) */
export const wingetAvailable = () => invoke<boolean>("winget_available");
export const installApp = (wingetId: string) =>
  invoke<string>("install_app", { wingetId });
export const wingetSearch = (query: string) =>
  invoke<WingetResult[]>("winget_search", { query });

/* Desinstalador */
export const listPrograms = () => invoke<Program[]>("list_programs");
export const uninstallProgram = (id: string, source: string) =>
  invoke<string>("uninstall_program", { id, source });

/* Activación */
export const activateWindows = () => invoke<string>("activate_windows");
export const activateOffice = () => invoke<string>("activate_office");
export const openMasMenu = () => invoke<string>("open_mas_menu");

/* Windows Update */
export const getWindowsUpdateMode = () =>
  invoke<string>("get_windows_update_mode");
export const setWindowsUpdateMode = (mode: string) =>
  invoke<string>("set_windows_update_mode", { mode });

/* Limpieza */
export const runCleanup = (options: string[]) =>
  invoke<CleanupResult>("run_cleanup", { options });

/* Reparación de Windows */
export const runSfc = () => invoke<string>("run_sfc");
export const runDism = () => invoke<string>("run_dism");
export const resetWindowsUpdate = () => invoke<string>("reset_windows_update");

/* Gestor de inicio */
export const listStartup = () => invoke<StartupItem[]>("list_startup");
export const setStartup = (name: string, location: string, enable: boolean) =>
  invoke<string>("set_startup", { name, location, enable });

/* Red / DNS */
export const setDns = (provider: string) => invoke<string>("set_dns", { provider });

/* Configuración */
export const exportConfig = (json: string) =>
  invoke<string>("export_config", { json });
export const importConfig = () => invoke<string>("import_config");

/* Actualizaciones */
export const checkUpdate = () => invoke<UpdateInfo>("check_update");
