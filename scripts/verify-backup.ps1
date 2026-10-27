param([Parameter(Mandatory)][string]$BackupPath)
& "$PSScriptRoot/operations.ps1" -Operation verify-backup -BackupPath $BackupPath
exit $LASTEXITCODE
