$ErrorActionPreference='Stop'
try {
    $shell=(Get-Command pwsh).Source
    $script=Join-Path $PSScriptRoot 'install-system-prerequisites.ps1'
    $process=Start-Process -FilePath $shell -Verb RunAs -WindowStyle Hidden -ArgumentList @('-NoProfile','-File',"`"$script`"",'-ConsentSystemChanges') -PassThru
    Write-Host "Installer administrator dibuka (proses $($process.Id)). Setujui UAC; baca logs/prerequisites-install.log untuk hasil. Restart tidak otomatis."
    exit 0
} catch {Write-Host "Tidak dapat membuka installer administrator: $($_.Exception.Message). Jalankan install-system-prerequisites.ps1 -ConsentSystemChanges melalui PowerShell Administrator.";exit 1}
