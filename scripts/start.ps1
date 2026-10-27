param([switch]$DashboardOnly)
& "$PSScriptRoot/operations.ps1" -Operation start -DashboardOnly:$DashboardOnly
exit $LASTEXITCODE
