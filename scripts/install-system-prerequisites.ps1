param([switch]$ConsentSystemChanges)
$ErrorActionPreference='Stop'
$installLog=Join-Path $PSScriptRoot '../logs/prerequisites-install.log'
$transcriptStarted=$false
try {
    if(-not $ConsentSystemChanges){throw 'Persetujuan eksplisit diperlukan: -ConsentSystemChanges. Instalasi WSL mengubah fitur Windows dan dapat memerlukan restart.'}
    $principal=[Security.Principal.WindowsPrincipal]::new([Security.Principal.WindowsIdentity]::GetCurrent())
    if(-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)){throw 'Jalankan PowerShell sebagai Administrator setelah menyetujui perubahan sistem.'}
    Start-Transcript -Path $installLog -Append | Out-Null
    $transcriptStarted=$true
    Write-Host 'Memasang WSL tanpa distro tambahan. Restart Windows mungkin diperlukan; skrip tidak melakukan restart otomatis.'
    & wsl --install --no-distribution
    if($LASTEXITCODE -notin @(0,3010)){throw "WSL installer gagal: $LASTEXITCODE"}
    Write-Host 'Memasang Docker Desktop dari paket resmi winget. Docker Desktop membutuhkan persetujuan lisensi dan startup melalui UI.'
    if(Get-Command winget -ErrorAction SilentlyContinue){
        & winget install --exact --id Docker.DockerDesktop --source winget
        if($LASTEXITCODE -notin @(0,3010)){throw "Docker installer gagal: $LASTEXITCODE"}
    } else {
        Write-Host 'winget tidak tersedia. Mengunduh installer resmi Docker ke TEMP; ukuran unduhan bergantung pada release.'
        $installer=Join-Path ([IO.Path]::GetTempPath()) "ath-docker-$([guid]::NewGuid()).exe"
        Invoke-WebRequest -Uri 'https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe' -OutFile $installer -TimeoutSec 900
        $signature=Get-AuthenticodeSignature -LiteralPath $installer
        if($signature.Status -ne 'Valid' -or $signature.SignerCertificate.Subject -notmatch 'Docker'){throw 'Tanda tangan installer Docker tidak valid. Installer tidak dijalankan.'}
        Write-Host 'Installer resmi akan tampil agar Anda dapat membaca lisensi dan menyetujui instalasi.'
        $installProcess=Start-Process -FilePath $installer -ArgumentList 'install','--backend=wsl-2' -Wait -PassThru
        if($installProcess.ExitCode -notin @(0,3010)){throw "Docker installer gagal: $($installProcess.ExitCode)"}
    }
    Write-Host 'Prasyarat dipasang. Selesaikan restart/login yang diminta, buka Docker Desktop, lalu jalankan scripts/start.ps1.'
    exit 0
} catch {Write-Host "ERROR: $($_.Exception.Message)";exit 1}
finally {if($transcriptStarted){Stop-Transcript | Out-Null}}
