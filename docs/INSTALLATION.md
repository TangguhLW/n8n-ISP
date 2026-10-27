# Instalasi Windows

Hasil audit laptop ada pada ENVIRONMENT_AUDIT.md. Node.js 24, Git, dan PowerShell tersedia. Docker Desktop dan WSL belum tersedia pada pemeriksaan awal. Port 3000/5678 kosong pada saat audit; skrip harus tetap memeriksanya kembali saat startup.

## WSL dan Docker

Pengguna telah menyetujui instalasi WSL2 dan Docker Desktop pada sesi 9 Oktober 2026. `scripts/launch-installer.ps1` membuka PowerShell administrator melalui UAC. Installer tidak restart otomatis. Log ada pada `logs/prerequisites-install.log`.

Instalasi selesai: WSL 3.0.1, Docker Desktop 4.94.0, Docker CLI 29.8.2, Compose v5.5.1. Setelah pengguna membuka Docker Desktop pada sesi lanjutan, Engine merespons dan n8n berhasil dijalankan; readiness HTTP 200 serta container healthy telah diperiksa. Jangan menjalankan installer ulang. Lihat START_HERE untuk menjalankan aplikasi sehari-hari.

```powershell
.\scripts\launch-installer.ps1
```

Alternatif dari PowerShell Administrator:

```powershell
.\scripts\install-system-prerequisites.ps1 -ConsentSystemChanges
```

Skrip menggunakan `wsl --install --no-distribution`, kemudian winget resmi Docker.DockerDesktop. Jika winget tidak tersedia, fallback mengunduh installer resmi dan memeriksa tanda tangan Authenticode sebelum membuka installer interaktif. Baca dan setujui lisensi Docker sesuai organisasi Anda. Ukuran download bergantung pada release; installer, WSL disk, image n8n, dan data memakai beberapa GB dan akan bertambah. Jangan mengunduh model AI besar sebelum memilih model, lisensi, dan batas hardware.

WSL membutuhkan virtualisasi dan fitur Windows yang sesuai. Restart mungkin diperlukan. Jika installer meminta restart, simpan pekerjaan Anda dan restart sendiri. Buka Docker Desktop, selesaikan onboarding, tunggu Engine siap, dan pastikan Linux containers / WSL2 backend dipakai. Skrip tidak mengubah firmware virtualisasi, Defender, firewall, atau pengaturan daya.

Referensi: [Docker Desktop Windows](https://docs.docker.com/desktop/setup/install/windows-install/), [instalasi WSL Microsoft](https://learn.microsoft.com/windows/wsl/install).

## Aplikasi dan n8n

```powershell
npm ci
npm run setup
npm run build
docker compose config --quiet
.\scripts\start.ps1
.\scripts\health-check.ps1
```

Compose mematok n8n 2.42.5. Image pull dan startup awal berhasil; health/readiness HTTP 200. Persistence setelah restart, workflow import dan execution masih perlu diuji. Image tidak memakai latest. Next.js, React, dan dependensi lain dipatok pada package.json/package-lock.json.

Jika port bentrok, jangan hentikan proses lain. Ubah N8N_PORT dan N8N_BASE_URL bersama pada .env; ATH_PORT mengatur port dashboard pada start.ps1. Untuk npm start di port khusus gunakan `npm run start -- --port PORT`. Link editor pada dashboard saat ini mengarah default 5678; gunakan URL konfigurasi Anda jika mengubah port.

## Startup saat login

Restart policy `unless-stopped` memulihkan container setelah Engine restart, jika container tidak sengaja dihentikan. Healthcheck hanya melaporkan kondisi; Docker tidak otomatis restart container unhealthy. Aktifkan startup Docker Desktop melalui Settings dengan persetujuan Anda.

Task Scheduler opsional, belum didaftarkan:

```powershell
.\scripts\register-autostart.ps1 -ConfirmChanges
```

Task menjalankan start.ps1 saat login dengan retry kesiapan Docker yang terbatas. Task tidak menyalakan laptop, membangunkannya dari sleep, atau menjamin workflow sukses. Saat task bernama sama ada, skrip menolak menimpanya.
