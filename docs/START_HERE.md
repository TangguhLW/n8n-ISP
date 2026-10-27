# Menjalankan ATH

Docker Desktop menyediakan Engine; ATH dan n8n dijalankan oleh skrip proyek. Tidak perlu mencari tombol Run di Docker Desktop.

**Status sesi 9 Oktober 2026:** owner sudah dibuat pengguna, API key sudah terhubung, monitor health aktif, dan execution sukses sudah terlihat di ATH. Untuk penggunaan biasa, ikuti langkah 1–3; langkah pembuatan akun/key di bawah hanya untuk instalasi baru atau konfigurasi ulang. API key saat ini berakhir 8 November 2026. Riset harian masih memerlukan feed resmi dan konfigurasi bridge.

1. Buka Docker Desktop dan tunggu Engine siap.
2. Buka PowerShell, lalu jalankan:

```powershell
Set-Location 'C:\Users\user\Documents\ChatGPT\n8n-ISP'
.\scripts\start.ps1
```

Pada startup pertama, image n8n diunduh dahulu. Biarkan jendela ini berjalan sampai unduhan dan startup selesai. Pada startup berikutnya, Docker memakai image yang sudah tersimpan.

3. Buka dashboard [ATH](http://127.0.0.1:3000). Password awal tersimpan di `data/bootstrap-password.txt` pada folder proyek.
4. Setelah n8n siap, buka [editor n8n](http://localhost:5678). Buat akun owner sendiri. Akun ini berbeda dari password dashboard ATH.
5. Di n8n, buka Settings → n8n API dan buat API key. Simpan pada `N8N_API_KEY` di `.env`, kemudian restart dashboard:

```powershell
.\scripts\stop.ps1 -DashboardOnly
.\scripts\start.ps1 -DashboardOnly
.\scripts\health-check.ps1
```

Jangan mengirim password atau API key melalui chat. Jangan menghapus volume saat memperbaiki masalah startup. Docker Desktop akan menampilkan container `ath-n8n` setelah startup selesai; tidak perlu membuat container lain secara manual.

Selama unduhan n8n berlangsung, dashboard dapat dijalankan terpisah:

```powershell
.\scripts\start.ps1 -DashboardOnly
```

Untuk menghentikan ATH dan n8n tanpa menghapus data:

```powershell
.\scripts\stop.ps1
```

Status aktual dapat diperiksa dengan `scripts/status.ps1` dan `scripts/health-check.ps1`. Startup container tidak otomatis mengaktifkan riset terjadwal atau publikasi sosial; keduanya memerlukan konfigurasi lanjutan.
