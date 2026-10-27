# n8n

Service Compose `n8n`, container `ath-n8n`, volume `ath_command_center_n8n_data`, editor localhost:5678, timezone Asia/Jakarta. Port hanya dipublikasikan pada loopback. `N8N_SECURE_COOKIE=false` diperlukan untuk HTTP lokal dan tidak boleh dipakai sebagai konfigurasi publik.

## Koneksi yang sudah diterapkan

Pada 9 Oktober 2026, akun owner dibuat pengguna dan API key `ATH Local Command Center - Connected` disimpan di `.env` server. Key berlaku sampai 8 November 2026, dengan scope workflow:create/list/read/update/activate/deactivate serta execution:list/read. Key lama dicabut. Nilai key tidak ditulis dalam dokumentasi atau dikirim ke frontend.

Workflow monitor `oq4AiQPpBxhWTJsN` aktif. Execution 1, 2 dan 3 berhasil; ATH menampilkannya pada Execution Monitor. Template daily research `hSkon3oQ0c2EXDAA` sudah diimpor tetapi nonaktif dan feed masih kosong. Ini belum menjadi pipeline riset harian terhubung ke job dashboard.

Untuk mengulangi verifikasi monitor yang sama tanpa membuat workflow baru:

```powershell
node --env-file=.env scripts/connect-n8n.mjs
```

Skrip ini memastikan monitor aktif, menunggu execution sukses baru paling lama dua menit, dan menyimpan metadata non-rahasia ke `data/n8n-connection-status.json`. Skrip tidak mengaktifkan daily research; bila template tersebut aktif tetapi feed kosong, skrip menjedakannya. Feed yang sudah diisi tidak otomatis dianggap sumber tervalidasi. Verifikasi memerlukan workflow monitor telah diimpor dan API key yang masih berlaku.

Setelah Engine dan container siap, buat akun owner n8n sendiri. Buat API key dari Settings → n8n API. Simpan key pada N8N_API_KEY di .env dan restart dashboard. Header server adalah X-N8N-API-KEY; key tidak dikirim ke frontend.

Import template nonaktif:

```powershell
node --env-file=.env scripts/import-workflows.mjs
```

Skrip tidak menimpa workflow dengan nama yang sama dan tidak mengaktifkan workflow. Template health memeriksa readiness setiap menit. Template daily research memiliki jadwal 08.00 Asia/Jakarta dan membutuhkan URL feed resmi pada node konfigurasi. Tanpa feed, workflow berhenti dengan NEEDS_CONFIGURATION. Template ini hanya pengumpulan kandidat dalam execution; verifikasi, scoring, deduplikasi dashboard, dan bridge masih perlu disambungkan sebelum dianggap pipeline riset otomatis lengkap.

Aktivasi atau pause/resume melalui dashboard meminta konfirmasi dan memakai API resmi. Tidak ada endpoint shell bebas. Startup awal, health/readiness, import kedua workflow, scheduler dan execution monitor sudah diverifikasi. Node daily research, persistence setelah restart Engine, RSS aktual dan bridge riset masih perlu diuji.

Log startup mencatat Python runner belum tersedia dan peringatan deprecation konfigurasi/runner internal. JS Task Runner terdaftar. Fondasi ini belum memakai workflow Python; jangan menganggap Python Code node siap atau runner production terisolasi sudah dikonfigurasi.

`/healthz` menguji reachable, bukan database. `/healthz/readiness` menguji database siap. `/metrics` diaktifkan dengan N8N_METRICS=true; belum digunakan sebagai sumber statistik aplikasi. Lihat [monitoring resmi](https://docs.n8n.io/deploy/host-n8n/keep-n8n-running/monitor-n8n.md).
