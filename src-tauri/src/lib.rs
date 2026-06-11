//! PoxiOptimizer - backend Tauri.
//! Reune todos los modulos y expone los comandos a la interfaz.

mod activation;
mod apps;
mod cleanup;
mod config;
mod debloat;
mod net;
mod ps;
mod repair;
mod startup;
mod system;
mod tweaks;
mod uninstall;
mod update;
mod wupdate;

/// En release, si la app no esta elevada, se relanza solicitando permisos de
/// administrador (UAC) y el proceso actual termina. En desarrollo se omite para
/// no interrumpir el hot-reload.
#[cfg(windows)]
fn ensure_admin() {
    if cfg!(debug_assertions) || system::is_elevated() {
        return;
    }
    if let Ok(exe) = std::env::current_exe() {
        use std::os::windows::process::CommandExt;
        let path = exe.to_string_lossy().replace('\'', "''");
        let _ = std::process::Command::new("powershell.exe")
            .args([
                "-NoProfile",
                "-WindowStyle",
                "Hidden",
                "-Command",
                &format!("Start-Process -FilePath '{path}' -Verb RunAs"),
            ])
            .creation_flags(0x0800_0000)
            .spawn();
    }
    std::process::exit(0);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    #[cfg(windows)]
    ensure_admin();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            // Sistema
            system::get_system_info,
            system::is_admin,
            system::get_activation_status,
            system::create_restore_point,
            // Tweaks
            tweaks::get_tweaks,
            tweaks::apply_tweak,
            tweaks::revert_tweak,
            tweaks::check_all_tweaks,
            // Debloat
            debloat::list_appx,
            debloat::remove_appx,
            debloat::postformat_debloat,
            // Apps (winget)
            apps::winget_available,
            apps::install_app,
            apps::winget_search,
            apps::set_chrome_default,
            // Desinstalador
            uninstall::list_programs,
            uninstall::uninstall_program,
            // Activacion
            activation::activate_windows,
            activation::activate_office,
            activation::open_mas_menu,
            // Limpieza
            cleanup::run_cleanup,
            // Windows Update
            wupdate::get_windows_update_mode,
            wupdate::set_windows_update_mode,
            // Reparación de Windows
            repair::run_sfc,
            repair::run_dism,
            repair::reset_windows_update,
            // Gestor de inicio
            startup::list_startup,
            startup::set_startup,
            startup::disable_all_startup,
            // Red / DNS
            net::set_dns,
            // Configuración (exportar / importar)
            config::export_config,
            config::import_config,
            // Actualizaciones
            update::check_update,
        ])
        .run(tauri::generate_context!())
        .expect("error al ejecutar PoxiOptimizer");
}
