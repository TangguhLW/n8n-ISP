param([switch]$ConfirmChanges)
$ErrorActionPreference='Stop'
try {
    if(-not $ConfirmChanges){throw 'Gunakan -ConfirmChanges setelah menyetujui pembuatan Task Scheduler saat login.'}
    $root=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
    $name='ATH-AI-Command-Center'
    if(Get-ScheduledTask -TaskName $name -ErrorAction SilentlyContinue){throw 'Task ATH sudah ada. Tidak menimpanya.'}
    $shell=(Get-Command pwsh).Source
    $action=New-ScheduledTaskAction -Execute $shell -Argument "-NoProfile -WindowStyle Hidden -File `"$(Join-Path $PSScriptRoot 'start.ps1')`"" -WorkingDirectory $root
    $trigger=New-ScheduledTaskTrigger -AtLogOn -User ([Security.Principal.WindowsIdentity]::GetCurrent().Name)
    $settings=New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Minutes 10) -StartWhenAvailable
    Register-ScheduledTask -TaskName $name -Action $action -Trigger $trigger -Settings $settings -Description 'Startup ATH saat login, menunggu Docker dengan retry terbatas.' | Out-Null
    Write-Host 'Task saat login dibuat. Aktifkan startup Docker Desktop sendiri. Pengaturan daya Windows tidak diubah.'
    exit 0
} catch {Write-Error $_.Exception.Message;exit 1}
