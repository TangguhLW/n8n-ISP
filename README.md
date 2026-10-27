# n8n-ISP

ATH AI Command Center dan workflow n8n untuk operasi konten dan riset.

Snapshot sumber terbaru yang tersedia pada 27 Oktober 2026. Versi: **2026-10-27**.

## Dokumentasi proyek

# ATH AI Command Center

Pusat operasi lokal untuk profil brand terpisah, kandidat riset hukum, brief dan caption, impor aset, persetujuan, job timeline, audit, dan backup aplikasi. Fondasi ini menggunakan Next.js, TypeScript, SQLite, dan konfigurasi Docker Compose untuk n8n.

**Status:** dashboard dan n8n 2.42.5 berjalan lokal. Akun owner dibuat pengguna, API key terbatas sudah terhubung ke ATH, dan dua workflow sudah diimpor. Monitor kesehatan aktif dengan execution sukses; template riset harian nonaktif sampai feed dikonfigurasi. Health/readiness n8n dan health dashboard memberikan HTTP 200. API sosial serta provider generation masih memerlukan konfigurasi. Mulai dari [panduan singkat](docs/START_HERE.md). Baca [laporan pengujian](docs/TEST_REPORT.md), [gate desain](docs/ANTISLOP_GATE.md), dan [pekerjaan berikutnya](docs/TODO.md).

Tampilan memakai material Liquid Glass berlapis dengan mode gelap/terang, navigasi mobile, serta pencarian halaman Ctrl/Command K. Lihat [studi material lokal](http://127.0.0.1:3000/design/glass) dan [catatan QA visual](docs/LIQUID_GLASS_REVIEW.md). Efek kaca adalah pendekatan CSS, bukan rendering resmi Apple atau refraksi fisik.

## Mulai

```powershell
Set-Location 'C:\Users\user\Documents\ChatGPT\n8n-ISP'
npm ci
npm run setup
npm run build
.\scripts\start.ps1
```

Dashboard: [http://127.0.0.1:3000](http://127.0.0.1:3000). Password awal ada dalam `data/bootstrap-password.txt`; jangan kirim melalui chat atau commit. Skrip setup tidak mengganti `.env` atau kunci yang sudah ada.

Saat Docker belum tersedia, `start.ps1` memulai dashboard saja. Setelah Docker siap, skrip memulai service `n8n`. Editor n8n: [http://localhost:5678](http://localhost:5678). Buat akun owner sendiri, buat API key melalui Settings n8n, isi `N8N_API_KEY` pada `.env`, lalu restart dashboard. Akun dashboard dan akun n8n berbeda.

Dashboard dapat dikelola terpisah selama Engine belum siap: `scripts/start.ps1 -DashboardOnly` dan `scripts/stop.ps1 -DashboardOnly`. Startup Docker dibatasi enam percobaan; probe setiap percobaan mempunyai timeout lima detik.

## Penggunaan sehari-hari

1. Periksa Diagnostics. DOWN, UNKNOWN, dan NEEDS_CONFIGURATION menandakan kondisi nyata yang perlu diperiksa.
2. Lengkapi audiens, fokus praktik, gaya komunikasi, dan arahan desain kedua akun melalui Settings. Sistem tidak menganggap brand identik.
3. Tambahkan RSS/Atom resmi yang aksesnya diizinkan, atau catat kandidat sumber primer melalui Legal Intelligence.
4. Baca sumber lengkap, periksa tanggal dan konteks, isi penilaian serta catatan reviewer. Temuan feed tidak otomatis menjadi fakta final.
5. Buat brief dan caption melalui Content Studio. Caption awal adalah template dari fakta input, bukan hasil model yang mengarang hukum.
6. Salin prompt gambar. Impor PNG/JPEG/WebP berukuran 1080×1350 atau 1080×1080 sesuai format; gambar dibaca, divalidasi, dan disimpan ulang sebagai PNG tanpa metadata asal.
7. Periksa seluruh slide dan caption sebelum menyetujui. Perubahan caption/gambar membatalkan persetujuan revisi lama.
8. Ekspor ZIP untuk publikasi manual. Ekspor dan persetujuan lokal tidak berarti konten sudah terpublikasi.
9. Buat backup aplikasi melalui dashboard. Backup lengkap n8n dan `.env` menggunakan skrip cold backup; lihat BACKUP_RESTORE.

## Operasi

```powershell
.\scripts\status.ps1
.\scripts\health-check.ps1
.\scripts\logs.ps1
.\scripts\diagnose.ps1
.\scripts\stop.ps1
.\scripts\restart.ps1
```

Untuk pengembangan: `npm run dev`. Untuk produksi lokal: `npm run build`, kemudian `npm run start`. Bind tetap 127.0.0.1. Tidak ada tunnel, port forwarding, perubahan firewall, atau perubahan sleep Windows.

## Pengujian

```powershell
npm test
npm run typecheck
npm run build
npm run test:e2e
```

Tes browser menggunakan Edge dan port 3001, database serta direktori backup sementara. Data sintetis ditandai TEST ONLY dan tidak masuk ke database operasional.

## Panduan

- [Instalasi](docs/INSTALLATION.md), [arsitektur](docs/ARCHITECTURE.md), [n8n](docs/N8N_GUIDE.md).
- [Penggunaan](docs/USER_GUIDE.md), [riset hukum](docs/LEGAL_RESEARCH.md), [konten](docs/CONTENT_STUDIO.md).
- [TikTok](docs/TIKTOK_INTEGRATION.md), [Instagram](docs/INSTAGRAM_INTEGRATION.md).
- [Keamanan](docs/SECURITY.md), [backup dan restore](docs/BACKUP_RESTORE.md), [diagnosis](docs/TROUBLESHOOTING.md).

Sistem lokal tidak aktif ketika laptop mati, sleep, atau kehilangan koneksi. Daily workflow belum aktif sampai instance dan sumber benar-benar dikonfigurasi serta diuji.
