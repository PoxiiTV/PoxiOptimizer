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

/* Desinstalador */
export const listPrograms = () => invoke<Program[]>("list_programs");
export const uninstallProgram = (id: string, source: string) =>
  invoke<string>("uninstall_program", { id, source });

/* Activación */
export const activateWindows = () => invoke<string>("activate_windows");
export const activateOffice = () => invoke<string>("activate_office");
export const openMasMenu = () => invoke<string>("open_mas_menu");

/* Limpieza */
export const runCleanup = (
  temp: boolean,
  updateCache: boolean,
  recycleBin: boolean,
  dns: boolean,
) =>
  invoke<CleanupResult>("run_cleanup", {
    temp,
    updateCache,
    recycleBin,
    dns,
  });
