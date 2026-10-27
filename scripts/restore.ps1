param([Parameter(Mandatory)][string]$BackupPath,[Parameter(Mandatory)][string]$TargetDirectory,[Parameter(Mandatory)][string]$ConfirmRestore)
& "$PSScriptRoot/operations.ps1" -Operation restore -BackupPath $BackupPath -TargetDirectory $TargetDirectory -ConfirmRestore $ConfirmRestore
exit $LASTEXITCODE
