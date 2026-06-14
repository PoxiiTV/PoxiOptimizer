//! Gestión del menú contextual de Windows (submenú PoxiTools ⚡).
//! Escribe / elimina claves de registro bajo:
//!   HKLM\SOFTWARE\Classes\Directory\Background\shell\PoxiTools

use crate::ps;

const ROOT_KEY: &str = r"HKLM:\SOFTWARE\Classes\Directory\Background\shell\PoxiTools";

/// Script de instalación. Usa __EXE__ como placeholder para la ruta del ejecutable.
/// Cada herramienta se codifica en Base64 (UTF-16 LE) para evitar problemas de comillas.
const INSTALL_SCRIPT: &str = r#"
$ErrorActionPreference = 'SilentlyContinue'
$root = 'HKLM:\SOFTWARE\Classes\Directory\Background\shell\PoxiTools'

function Add-PoxiItem {
    param([string]$Id, [string]$Label, [string]$Cmd)
    $p = "$root\shell\$Id"
    New-Item -Path $p -Force | Out-Null
    Set-ItemProperty -Path $p -Name '(Default)' -Value $Label -Force
    $bytes = [System.Text.Encoding]::Unicode.GetBytes($Cmd)
    $enc = [Convert]::ToBase64String($bytes)
    New-Item -Path "$p\command" -Force | Out-Null
    Set-ItemProperty -Path "$p\command" -Name '(Default)' -Value "powershell.exe -WindowStyle Hidden -NoProfile -EncodedCommand $enc" -Force
}

Remove-Item -Path $root -Recurse -Force -ErrorAction SilentlyContinue
New-Item -Path $root -Force | Out-Null
Set-ItemProperty -Path $root -Name 'MUIVerb' -Value 'PoxiTools ⚡' -Force
Set-ItemProperty -Path $root -Name 'SubCommands' -Value '' -Force
Set-ItemProperty -Path $root -Name 'Position' -Value 'Bottom' -Force
New-Item -Path "$root\shell" -Force | Out-Null

Add-PoxiItem '01_RestartExplorer' '↺  Reiniciar Explorador' 'Stop-Process -Name explorer -Force -ErrorAction SilentlyContinue; Start-Sleep -Seconds 1; Start-Process explorer'

Add-PoxiItem '02_RebuildIcons' '🔄 Reconstruir cache de iconos' 'Stop-Process -Name explorer -Force -ErrorAction SilentlyContinue; Start-Sleep -Seconds 1; Remove-Item -Path "$env:LOCALAPPDATA\IconCache.db" -Force -ErrorAction SilentlyContinue; Remove-Item -Path "$env:LOCALAPPDATA\Microsoft\Windows\Explorer\iconcache_*" -Force -ErrorAction SilentlyContinue; Start-Process explorer'

Add-PoxiItem '03_ClearThumbs' '🖼  Limpiar cache de miniaturas' 'Stop-Process -Name explorer -Force -ErrorAction SilentlyContinue; Start-Sleep -Seconds 1; Remove-Item -Path "$env:LOCALAPPDATA\Microsoft\Windows\Explorer\thumbcache_*" -Force -ErrorAction SilentlyContinue; Start-Process explorer'

Add-PoxiItem '04_FreeMemory' '🚀 Liberar memoria' '[System.GC]::Collect(); [System.GC]::WaitForPendingFinalizers(); foreach ($proc in (Get-Process | Where-Object {-not $_.HasExited})) { try { $proc.MinWorkingSet = $proc.MinWorkingSet } catch {} }'

Add-PoxiItem '05_DeleteTemp' '🗑  Eliminar temporales' 'Remove-Item -Path "$env:TEMP\*" -Recurse -Force -ErrorAction SilentlyContinue; Remove-Item -Path "C:\Windows\Temp\*" -Recurse -Force -ErrorAction SilentlyContinue'

Add-PoxiItem '06_EmptyRecycleBin' '♻  Vaciar papelera' 'Clear-RecycleBin -Force -ErrorAction SilentlyContinue'

Add-PoxiItem '07_ToggleHidden' '👁  Mostrar/ocultar ocultos' '$k = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced"; $c = (Get-ItemProperty $k -Name Hidden -ErrorAction SilentlyContinue).Hidden; Set-ItemProperty $k -Name Hidden -Value (if ($c -eq 1) {2} else {1}); Stop-Process -Name explorer -Force -ErrorAction SilentlyContinue; Start-Process explorer'

Add-PoxiItem '08_FlushDNS' '🌐 Vaciar cache DNS' 'ipconfig /flushdns'

Add-PoxiItem '09_CopyIP' '📋 Copiar IP local' 'Add-Type -Assembly System.Windows.Forms; $ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.PrefixOrigin -ne "WellKnown" -and $_.IPAddress -notlike "169.*" -and $_.IPAddress -ne "127.0.0.1" } | Select-Object -First 1).IPAddress; if ($ip) { [System.Windows.Forms.Clipboard]::SetText($ip) }'

Add-PoxiItem '10_ResetNetwork' '🔌 Resetear adaptadores de red' 'Start-Process powershell -Verb RunAs -ArgumentList "-WindowStyle Hidden -Command ''netsh winsock reset; netsh int ip reset; ipconfig /release; ipconfig /flushdns; ipconfig /renew''"'

Add-PoxiItem '11_TurnOffScreen' '🖥  Apagar pantalla' '(Add-Type -MemberDefinition "[DllImport(""user32.dll"")]public static extern IntPtr SendMessage(IntPtr h,uint m,IntPtr w,IntPtr l);" -Name u -Namespace W -PassThru)::SendMessage(-1, 0x0112, [IntPtr]0xF170, [IntPtr]2)'

Add-PoxiItem '12_NightLight' '🌙 Modo noche (pantalla)' 'Start-Process "ms-settings:display"'

$planPath = "$root\shell\13_PowerPlan"
New-Item -Path $planPath -Force | Out-Null
Set-ItemProperty -Path $planPath -Name 'MUIVerb' -Value '⚡ Plan de energia' -Force
Set-ItemProperty -Path $planPath -Name 'SubCommands' -Value '' -Force
New-Item -Path "$planPath\shell" -Force | Out-Null
New-Item -Path "$planPath\shell\01_High" -Force | Out-Null
Set-ItemProperty -Path "$planPath\shell\01_High" -Name '(Default)' -Value '🔥 Alto rendimiento' -Force
New-Item -Path "$planPath\shell\01_High\command" -Force | Out-Null
Set-ItemProperty -Path "$planPath\shell\01_High\command" -Name '(Default)' -Value 'powercfg /setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c' -Force
New-Item -Path "$planPath\shell\02_Balanced" -Force | Out-Null
Set-ItemProperty -Path "$planPath\shell\02_Balanced" -Name '(Default)' -Value '⚖  Equilibrado' -Force
New-Item -Path "$planPath\shell\02_Balanced\command" -Force | Out-Null
Set-ItemProperty -Path "$planPath\shell\02_Balanced\command" -Name '(Default)' -Value 'powercfg /setactive 381b4222-f694-41f0-9685-ff5bb260df2e' -Force
New-Item -Path "$planPath\shell\03_Saver" -Force | Out-Null
Set-ItemProperty -Path "$planPath\shell\03_Saver" -Name '(Default)' -Value '🔋 Ahorro de energia' -Force
New-Item -Path "$planPath\shell\03_Saver\command" -Force | Out-Null
Set-ItemProperty -Path "$planPath\shell\03_Saver\command" -Name '(Default)' -Value 'powercfg /setactive a1841308-3541-4fab-bc81-f71556f20b4a' -Force

Add-PoxiItem '14_TaskMgr' '📋 Administrador de tareas' 'Start-Process taskmgr'
Add-PoxiItem '15_RegEdit' '🔧 Editor de Registro' 'Start-Process regedit'
Add-PoxiItem '16_PsAdmin' '💻 PowerShell como admin' 'Start-Process powershell -Verb RunAs -ArgumentList "-NoExit -Command Set-Location $env:USERPROFILE"'
Add-PoxiItem '17_CmdAdmin' '🖤 CMD como admin' 'Start-Process cmd -Verb RunAs'

$pp = "$root\shell\18_PoxiOptimizer"
New-Item -Path $pp -Force | Out-Null
Set-ItemProperty -Path $pp -Name '(Default)' -Value '⚡ Abrir PoxiOptimizer' -Force
New-Item -Path "$pp\command" -Force | Out-Null
Set-ItemProperty -Path "$pp\command" -Name '(Default)' -Value '"__EXE__"' -Force
"#;

#[tauri::command(async)]
pub fn context_menu_installed() -> bool {
    let script = format!(
        "if (Test-Path '{}') {{ 'yes' }} else {{ 'no' }}",
        ROOT_KEY
    );
    matches!(ps::run_powershell(&script), Ok(out) if out.stdout.trim() == "yes")
}

#[tauri::command(async)]
pub fn install_context_menu() -> Result<String, String> {
    let exe = std::env::current_exe()
        .map(|p| p.to_string_lossy().to_string())
        .unwrap_or_default();
    let script = INSTALL_SCRIPT.replace("__EXE__", &exe.replace('\'', "''"));
    ps::run_powershell(&script)?;
    Ok("Menú contextual PoxiTools instalado correctamente".to_string())
}

#[tauri::command(async)]
pub fn uninstall_context_menu() -> Result<String, String> {
    let script = format!(
        "Remove-Item -Path '{}' -Recurse -Force -ErrorAction SilentlyContinue",
        ROOT_KEY
    );
    ps::run_powershell(&script)?;
    Ok("Menú contextual eliminado".to_string())
}
