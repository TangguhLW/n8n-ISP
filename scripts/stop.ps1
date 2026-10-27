param([switch]$DashboardOnly)
& "$PSScriptRoot/operations.ps1" -Operation stop -DashboardOnly:$DashboardOnly
exit $LASTEXITCODE
