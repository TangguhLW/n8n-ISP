param(
    [Parameter(Mandatory)][ValidateSet('install','start','stop','restart','status','health-check','logs','diagnose','backup','verify-backup','restore','update','open-dashboard')][string]$Operation,
    [string]$BackupPath,
    [string]$TargetDirectory,
    [string]$TargetVersion,
    [string]$ConfirmRestore,
    [switch]$DashboardOnly
)
$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
Set-Location -LiteralPath $projectRoot
if (-not (Get-Command docker -ErrorAction SilentlyContinue) -and (Test-Path -LiteralPath 'C:/Program Files/Docker/Docker/resources/bin/docker.exe')) {
    Set-Alias -Name docker -Value 'C:/Program Files/Docker/Docker/resources/bin/docker.exe'
}
New-Item -ItemType Directory -Path (Join-Path $projectRoot 'logs') -Force | Out-Null
$operationLog = Join-Path $projectRoot 'logs/operations.log'
function Write-Operation([string]$Message) {
    $line = "$(Get-Date -Format o) [$Operation] $Message"
    Write-Host $line
    Add-Content -LiteralPath $operationLog -Value $line
}
function Invoke-Native([string]$Executable, [string[]]$Arguments) {
    & $Executable @Arguments
    if ($LASTEXITCODE -ne 0) { throw "$Executable gagal dengan exit code $LASTEXITCODE." }
}
function Require-Docker {
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { throw 'Docker CLI belum tersedia. Baca docs/INSTALLATION.md.' }
    if (-not (Test-DockerReady)) { throw 'Docker Engine belum siap atau timeout. Jalankan Docker Desktop dan tunggu sampai Engine siap.' }
    & docker compose version
    if ($LASTEXITCODE -ne 0) { throw 'Docker Compose belum tersedia.' }
}
function Test-DockerReady {
    $command=Get-Command docker -ErrorAction SilentlyContinue
    if(-not $command){return $false}
    $binary=if($command.CommandType -eq 'Alias'){$command.Definition}else{$command.Source}
    $probe=[Diagnostics.Process]::new()
    $probe.StartInfo.FileName=$binary
    $probe.StartInfo.UseShellExecute=$false
    $probe.StartInfo.CreateNoWindow=$true
    $probe.StartInfo.RedirectStandardOutput=$true
    $probe.StartInfo.RedirectStandardError=$true
    foreach($arg in @('info','--format','{{.ServerVersion}}')){$probe.StartInfo.ArgumentList.Add($arg)}
    try {
        if(-not $probe.Start()){return $false}
        $stdout=$probe.StandardOutput.ReadToEndAsync()
        $stderr=$probe.StandardError.ReadToEndAsync()
        if(-not $probe.WaitForExit(5000)){$probe.Kill();return $false}
        return $probe.ExitCode -eq 0
    } catch {return $false} finally {$probe.Dispose()}
}
function Read-Config {
    if (-not (Test-Path -LiteralPath '.env')) { throw 'Jalankan npm run setup terlebih dahulu.' }
    $configValues = @{}
    foreach ($line in Get-Content -LiteralPath '.env') {
        if ($line -match '^([A-Z0-9_]+)=(.*)$') { $configValues[$matches[1]] = $matches[2].Trim() }
    }
    return $configValues
}
function Port-Open([int]$Port) {
    $client = [Net.Sockets.TcpClient]::new()
    try { return $client.ConnectAsync('127.0.0.1', $Port).Wait(800) -and $client.Connected } catch { return $false } finally { $client.Dispose() }
}
function Start-Ath {
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Node.js 24 wajib tersedia.' }
    $cfg = Read-Config
    if (-not $DashboardOnly -and (Get-Command docker -ErrorAction SilentlyContinue)) {
        $engineReady = $false
        for ($attempt = 1; $attempt -le 6; $attempt++) {
            if (Test-DockerReady) { $engineReady = $true; break }
            Start-Sleep -Seconds 5
        }
        if ($engineReady) {
            Invoke-Native 'docker' @('compose','config','--quiet')
            $existing = & docker inspect --format '{{.Name}}' ath-n8n 2>$null
            if ((Port-Open ([int]$cfg.N8N_PORT)) -and $LASTEXITCODE -ne 0) { throw "Port $($cfg.N8N_PORT) sedang digunakan. Proses lain tidak dihentikan." }
            Invoke-Native 'docker' @('compose','up','-d','n8n')
            Write-Operation 'Startup n8n diminta. Periksa health-check; container aktif belum tentu siap.'
        } else { Write-Operation 'Docker belum siap setelah enam percobaan; dashboard tetap dimulai.' }
    } else { Write-Operation 'Hanya dashboard yang dimulai; Docker tidak diperiksa pada langkah ini.' }
    $port = [int]$cfg.ATH_PORT
    if (Port-Open $port) { Write-Operation "Port $port sudah digunakan; dashboard baru tidak dimulai. Periksa status."; return }
    if (-not (Test-Path -LiteralPath '.next/BUILD_ID')) { Invoke-Native 'npm.cmd' @('run','build') }
    $nextPath = Join-Path $projectRoot 'node_modules/next/dist/bin/next'
    $process = Start-Process -FilePath (Get-Command node).Source -ArgumentList @("`"$nextPath`"",'start','--hostname','127.0.0.1','--port',"$port") -WorkingDirectory $projectRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $projectRoot 'logs/dashboard.log') -RedirectStandardError (Join-Path $projectRoot 'logs/dashboard-error.log') -PassThru
    @{ pid = $process.Id; startedAt = $process.StartTime.ToUniversalTime().ToString('o'); executable = $nextPath } | ConvertTo-Json | Set-Content -LiteralPath 'data/dashboard-process.json'
    $ready = $false
    for ($attempt=1; $attempt -le 10; $attempt++) { Start-Sleep -Seconds 1; if (Port-Open $port) { $ready=$true; break }; if ($process.HasExited) { break } }
    if (-not $ready) { throw 'Dashboard belum siap. Baca logs/dashboard-error.log.' }
    Write-Operation "Dashboard: http://127.0.0.1:$port; proses $($process.Id)."
}
function Stop-Dashboard {
    if (-not (Test-Path -LiteralPath 'data/dashboard-process.json')) { Write-Operation 'Tidak ada proses dashboard yang tercatat oleh start.ps1.'; return }
    $record = Get-Content -LiteralPath 'data/dashboard-process.json' -Raw | ConvertFrom-Json
    $process = Get-Process -Id $record.pid -ErrorAction SilentlyContinue
    if (-not $process) { return }
    $info = Get-CimInstance Win32_Process -Filter "ProcessId=$($record.pid)"
    if ($process.ProcessName -ne 'node' -or $info.CommandLine -notlike "*$($record.executable)*" -or [math]::Abs(($process.StartTime.ToUniversalTime() - [datetime]$record.startedAt).TotalSeconds) -gt 2) { throw 'Identitas proses tidak cocok. Tidak menghentikan proses lain.' }
    Stop-Process -Id $record.pid
    Write-Operation "Dashboard ATH proses $($record.pid) dihentikan."
}
function Create-FullBackup {
    Require-Docker
    $cfg=Read-Config
    if (Port-Open ([int]$cfg.ATH_PORT)) { throw 'Hentikan dashboard terlebih dahulu agar salinan data aplikasi konsisten. Jalankan stop.ps1 lalu backup.ps1.' }
    if ($env:ATH_DATA_DIR -or $cfg.ATH_DATA_DIR -ne './data') { throw 'Backup lengkap ini hanya mendukung data proyek ./data. Gunakan snapshot aplikasi untuk lokasi khusus.' }
    $folder = Join-Path $projectRoot "backups/full-$((Get-Date).ToString('yyyyMMdd-HHmmss'))-$([guid]::NewGuid().ToString('N').Substring(0,8))"
    New-Item -ItemType Directory -Path $folder | Out-Null
    $running = & docker inspect --format '{{.State.Running}}' ath-n8n
    if ($LASTEXITCODE -ne 0) { throw 'Container ath-n8n belum tersedia; backup lengkap tidak dinyatakan selesai.' }
    try {
        if ($running -eq 'true') { Invoke-Native 'docker' @('compose','stop','n8n') }
        Invoke-Native 'docker' @('cp','ath-n8n:/home/node/.n8n', (Join-Path $folder 'n8n'))
        Copy-Item -LiteralPath (Join-Path $projectRoot 'data') -Destination (Join-Path $folder 'data') -Recurse
        Copy-Item -LiteralPath '.env' -Destination (Join-Path $folder '.env')
        Copy-Item -LiteralPath 'compose.yaml' -Destination (Join-Path $folder 'compose.yaml')
        Copy-Item -LiteralPath 'workflows' -Destination (Join-Path $folder 'workflows') -Recurse
        Invoke-Native 'node' @('scripts/backup-manifest.mjs','create',$folder)
        Invoke-Native 'node' @('scripts/backup-manifest.mjs','verify',$folder)
        Write-Operation "Backup lengkap tersedia: $folder. Berisi rahasia; simpan terlindungi dan di media terpisah."
        return $folder
    } finally { if ($running -eq 'true') { Invoke-Native 'docker' @('compose','start','n8n') } }
}
try {
    switch ($Operation) {
        'install' {
            if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Pasang Node.js 24 LTS sebelum menjalankan skrip ini.' }
            Invoke-Native 'npm.cmd' @('ci')
            Invoke-Native 'npm.cmd' @('run','setup')
            Invoke-Native 'npm.cmd' @('run','build')
            Require-Docker
            Invoke-Native 'docker' @('compose','config','--quiet')
            Write-Operation 'Dependensi aplikasi dan konfigurasi Compose siap. Gunakan start.ps1.'
        }
        'start' { Start-Ath }
        'stop' { Stop-Dashboard; if (-not $DashboardOnly -and (Get-Command docker -ErrorAction SilentlyContinue)) { Require-Docker; Invoke-Native 'docker' @('compose','stop','n8n') }; Write-Operation 'Service yang dipilih dihentikan; volume tetap ada.' }
        'restart' { Stop-Dashboard; if (Get-Command docker -ErrorAction SilentlyContinue) { Require-Docker; Invoke-Native 'docker' @('compose','restart','n8n') }; Start-Ath }
        'status' { $cfg=Read-Config; Write-Operation "Port dashboard $($cfg.ATH_PORT): $(Port-Open ([int]$cfg.ATH_PORT))"; Require-Docker; Invoke-Native 'docker' @('compose','ps') }
        'health-check' { $cfg=Read-Config; foreach ($path in @('healthz','healthz/readiness')) { $response=Invoke-WebRequest -Uri "http://127.0.0.1:$($cfg.N8N_PORT)/$path" -TimeoutSec 8; Write-Operation "$path HTTP $($response.StatusCode)" }; $response=Invoke-WebRequest -Uri "http://127.0.0.1:$($cfg.ATH_PORT)/api/health" -TimeoutSec 8; Write-Operation "Control Center HTTP $($response.StatusCode)" }
        'logs' { Require-Docker; Invoke-Native 'docker' @('compose','logs','--tail','100','n8n'); Write-Operation 'Log dibaca. Jangan mengirim log mentah yang mengandung credentials ke pihak lain.' }
        'diagnose' { Write-Operation "PowerShell $($PSVersionTable.PSVersion); sistem $([Environment]::OSVersion); arsitektur $([Runtime.InteropServices.RuntimeInformation]::OSArchitecture)"; Get-Command node,git,docker,wsl,ffmpeg,ffprobe -ErrorAction SilentlyContinue | Select-Object Name,Source; Get-PSDrive -PSProvider FileSystem | Select-Object Name,Free; if(Get-Command docker -ErrorAction SilentlyContinue){ Require-Docker; Invoke-Native 'docker' @('compose','ps') } else { throw 'Docker belum tersedia; tidak ada recovery destruktif dilakukan.' } }
        'backup' { Create-FullBackup | Out-Null }
        'verify-backup' { if(-not $BackupPath){ throw '-BackupPath wajib.' }; Invoke-Native 'node' @('scripts/backup-manifest.mjs','verify',[IO.Path]::GetFullPath($BackupPath)); Write-Operation 'Manifest dan integritas SQLite lulus.' }
        'restore' {
            if(-not $BackupPath -or -not $TargetDirectory -or $ConfirmRestore -ne 'RESTORE-ISOLATED'){ throw 'Gunakan -BackupPath, -TargetDirectory baru, dan -ConfirmRestore RESTORE-ISOLATED. Restore aktif tidak didukung oleh skrip ini.' }
            $target=[IO.Path]::GetFullPath($TargetDirectory)
            if(Test-Path -LiteralPath $target){ throw 'Target harus direktori baru; file yang sudah ada tidak ditimpa.' }
            if($target -eq $projectRoot -or $projectRoot.StartsWith($target+[IO.Path]::DirectorySeparatorChar)){ throw 'Target tidak boleh workspace aktif atau induknya.' }
            Invoke-Native 'node' @('scripts/backup-manifest.mjs','verify',[IO.Path]::GetFullPath($BackupPath))
            Copy-Item -LiteralPath ([IO.Path]::GetFullPath($BackupPath)) -Destination $target -Recurse
            Invoke-Native 'node' @('scripts/backup-manifest.mjs','verify',$target)
            Write-Operation "Restore salinan ke $target terverifikasi. Service aktif dan volume tidak diubah."
        }
        'update' {
            if($TargetVersion -notmatch '^\d+\.\d+\.\d+$'){ throw 'Tentukan -TargetVersion dengan versi n8n eksplisit.' }
            Require-Docker
            Create-FullBackup | Out-Null
            $cfg=Read-Config
            $image="docker.n8n.io/n8nio/n8n:$TargetVersion"
            Invoke-Native 'docker' @('pull',$image)
            $env:N8N_VERSION=$TargetVersion
            try { Invoke-Native 'docker' @('compose','up','-d','n8n') } finally { Remove-Item Env:N8N_VERSION -ErrorAction SilentlyContinue }
            $ready=$false
            for($attempt=1;$attempt -le 12;$attempt++){try{$r=Invoke-WebRequest -Uri "http://127.0.0.1:$($cfg.N8N_PORT)/healthz/readiness" -TimeoutSec 5;if($r.StatusCode -eq 200){$ready=$true;break}}catch{};Start-Sleep -Seconds 5}
            if(-not $ready){throw 'Update belum siap. Backup dipertahankan; periksa log. Jangan downgrade database bermigrasi tanpa restore.'}
            $lines=Get-Content -LiteralPath '.env'
            $lines -replace '^N8N_VERSION=.*$',"N8N_VERSION=$TargetVersion" | Set-Content -LiteralPath '.env'
            Write-Operation "n8n versi $TargetVersion lulus readiness dan pin disimpan."
        }
        'open-dashboard' { $cfg=Read-Config; Start-Process -FilePath "http://127.0.0.1:$($cfg.ATH_PORT)" -WindowStyle Hidden; Write-Operation 'Browser dashboard dibuka.' }
    }
    exit 0
} catch {
    Write-Operation "ERROR: $($_.Exception.Message)"
    exit 1
}
