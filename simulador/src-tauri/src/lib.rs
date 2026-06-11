//! PoxiOptimizer - MODO SIMULACIÓN.
//! Esta build NO toca el sistema: todos los comandos devuelven datos falsos
//! para poder ver y probar la interfaz sin riesgo alguno.

mod activation;
mod apps;
mod cleanup;
mod config;
mod debloat;
mod net;
mod repair;
mod startup;
mod system;
mod tweaks;
mod uninstall;
mod update;
mod wupdate;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // En modo simulación NO se solicita elevación de administrador.
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            system::get_system_info,
            system::is_admin,
            system::get_activation_status,
            system::create_restore_point,
            tweaks::get_tweaks,
            tweaks::apply_tweak,
            tweaks::revert_tweak,
            tweaks::check_all_tweaks,
            debloat::list_appx,
            debloat::remove_appx,
            apps::winget_available,
            apps::install_app,
            apps::winget_search,
            uninstall::list_programs,
            uninstall::uninstall_program,
            activation::activate_windows,
            activation::activate_office,
            activation::open_mas_menu,
            cleanup::run_cleanup,
            wupdate::get_windows_update_mode,
            wupdate::set_windows_update_mode,
            repair::run_sfc,
            repair::run_dism,
            repair::reset_windows_update,
            startup::list_startup,
            startup::set_startup,
            net::set_dns,
            config::export_config,
            config::import_config,
            update::check_update,
        ])
        .run(tauri::generate_context!())
        .expect("error al ejecutar PoxiOptimizer (simulador)");
}
