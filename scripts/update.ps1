param([Parameter(Mandatory)][string]$TargetVersion)
& "$PSScriptRoot/operations.ps1" -Operation update -TargetVersion $TargetVersion
exit $LASTEXITCODE
