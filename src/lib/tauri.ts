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
export const postformatDebloat = () => invoke<string[]>("postformat_debloat");

/* Apps (winget) */
export const wingetAvailable = () => invoke<boolean>("winget_available");
export const ensureWinget = () => invoke<string>("ensure_winget");
export const installApp = (wingetId: string) =>
  invoke<string>("install_app", { wingetId });
export const wingetSearch = (query: string) =>
  invoke<WingetResult[]>("winget_search", { query });
export const installAppsNinite = (url: string) =>
  invoke<string>("install_apps_ninite", { url });
export const setChromeDefault = () => invoke<string>("set_chrome_default");

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
export const disableAllStartup = () => invoke<number>("disable_all_startup");

/* Red / DNS */
export const setDns = (provider: string) => invoke<string>("set_dns", { provider });

/* Configuración */
export const exportConfig = (json: string) =>
  invoke<string>("export_config", { json });
export const importConfig = () => invoke<string>("import_config");

/* Actualizaciones */
export const checkUpdate = () => invoke<UpdateInfo>("check_update");

/* Historial de acciones */
export interface LogEntry {
  id: string;
  timestamp: string;
  kind: string;
  label: string;
  can_undo: boolean;
  undo_kind?: string;
  undo_id?: string;
}
export const getActionLog = () => invoke<LogEntry[]>("get_action_log");
export const logAction = (entry: LogEntry) => invoke<void>("log_action", { entry });
export const clearActionLog = () => invoke<void>("clear_action_log");

/* Temperaturas */
export interface TempInfo {
  cpu: number | null;
  gpu: number | null;
}
export const getTemperatures = () => invoke<TempInfo>("get_temperatures");

/* Backup de registro */
export const createRegistryBackup = () => invoke<string>("create_registry_backup");
export const listBackups = () => invoke<string[]>("list_backups");
export const openBackupsFolder = () => invoke<void>("open_backups_folder");

/* Hosts */
export const getHosts = () => invoke<string>("get_hosts");
export const setHosts = (content: string) => invoke<void>("set_hosts", { content });
export const resetHosts = () => invoke<void>("reset_hosts");

/* Herramientas del sistema */
export interface WinTool {
  id: string;
  label: string;
  desc: string;
  cmd: string;
  category: string;
}
export const getWindowsTools = () => invoke<WinTool[]>("get_windows_tools");
export const openWindowsTool = (id: string) => invoke<void>("open_windows_tool", { id });

/* Características opcionales de Windows */
export interface WinFeature {
  id: string;
  name: string;
  desc: string;
  restart: boolean;
  enabled: boolean;
}
export const getWindowsFeatures = () => invoke<WinFeature[]>("get_windows_features");
export const enableWindowsFeature = (id: string) => invoke<string>("enable_windows_feature", { id });
export const disableWindowsFeature = (id: string) => invoke<string>("disable_windows_feature", { id });
