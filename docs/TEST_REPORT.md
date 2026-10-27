# Laporan pengujian

Tanggal: 9 Oktober 2026. Lingkup hasil: fondasi editorial lokal ATH. Seluruh pipeline otomatis pada master prompt belum selesai.

## Hasil yang dijalankan

| Pemeriksaan | Hasil | Bukti / batas |
| --- | --- | --- |
| `npm test` | 13/13 lulus | `tests/core.test.ts`: URL resmi dan batas server lokal, idempotency, recovery UNKNOWN, scoring, password/session, Host/Origin/CSRF, batas request streaming, allowlist tindakan, isolasi brand, approval revisi/aset, kegagalan tanpa feed, redaksi rahasia, snapshot/restore terpisah dan deteksi checksum rusak. |
| `npm run test:e2e` | 5/5 lulus | `tests/browser.e2e.ts` dan `tests/intake.e2e.ts`; Edge headless, database/backup sementara, port 3001. |
| `npm run typecheck` | Lulus | TypeScript strict; build terakhir juga memeriksa TypeScript. |
| `npm run build` | Lulus | Production Next.js 16.4.0. Endpoint dinamis dan halaman dashboard berhasil dibangun. |
| `npm audit --json` | 0 vulnerabilities | Hasil registry pada tanggal pemeriksaan; bukan jaminan bebas kerentanan. |
| PowerShell parser | Lulus | Seluruh file `.ps1` di `scripts`, termasuk installer dan wrapper DashboardOnly, tanpa syntax error. |
| `docker compose config --quiet` | Lulus | Validasi konfigurasi dengan Docker CLI terpasang; tidak menjalankan container. |
| Workflow JSON | Lulus pemeriksaan struktur | Template nonaktif, tanpa credentials. Kompatibilitas node dan execution belum diuji dalam n8n. |
| Dashboard produksi `/api/health` | UP | Server lokal pada 127.0.0.1:3000; startup/stop melalui PID dan identitas proses milik aplikasi. |
| `scripts/health-check.ps1` | HTTP 200 pada sesi lanjutan | Pada pemeriksaan awal n8n DOWN. Setelah Docker Engine siap dan image terunduh: `/healthz`, `/healthz/readiness` dan dashboard `/api/health` masing-masing 200. |

## Cakupan browser

Login benar/salah, pemulihan error koneksi, logout, seluruh 16 area navigasi, mode terang/gelap, refresh, keyboard/skip link, viewport 390px, teks 200% pada viewport 800px, perintah navigasi serta penolakan shell, shortcut agent/akun, rincian health, dan tautan editor diperiksa. Tidak ada pageerror pada alur navigasi utama. Favicon memberikan 204.

Alur editorial menguji profil brand terpisah, kandidat TEST ONLY, review/scoring, brief portrait, penolakan approval tanpa gambar, impor PNG 1080×1350, preview, salin prompt, approval lokal, download ZIP, edit caption yang membatalkan approval, permintaan revisi, filter antrean, timeline Technical/Visual Story, detail input/output, pembukaan draft, backup dan verifikasi.

Tes tambahan memeriksa API anonim 401, Origin tidak sah 403, tindakan publish tidak dikenal 400, riset tanpa sumber gagal, konfigurasi/toggle feed, retry manual, intake video tanpa URL, review hak, penolakan approval tanpa metadata sah, export paket, pembatalan job, log container yang belum tersedia, serta notifikasi dibaca. File MP4 sintetis yang tidak valid tidak mendapat approval; FFprobe belum tersedia di laptop.

Tautan sumber dan dokumentasi diperiksa tujuan HTTPS-nya. Keberhasilan akses layanan eksternal, video playback file sah, workflow Pause/Resume n8n, serta approval video positif belum diklaim. Tombol workflow hanya muncul jika API mengembalikan workflow nyata.

## Artefak pemeriksaan visual

Screenshot tersimpan di `test-results/overview-desktop.png`, `overview-dark.png`, `overview-mobile.png`, `overview-200-percent.png`, `content-studio.png`, dan `workflow-map.png`. Laporan browser ada di `playwright-report/index.html`. Screenshot konten dan ZIP adalah fixture TEST ONLY, bukan konten operasional atau bahan publikasi.

Mode terang/gelap dan pembesaran diperiksa secara visual. Warna teks terhadap permukaan yang digunakan menghasilkan rasio minimum 5,34:1; border kontrol sedikitnya 3:1. CSS menyediakan fokus terlihat, target kontrol sekurangnya 44px, dan reduced-motion. Ini pemeriksaan terarah, bukan sertifikasi aksesibilitas menyeluruh.

## Prasyarat yang benar-benar terpasang

WSL 3.0.1 dan fitur Windows VirtualMachinePlatform berhasil dipasang melalui installer administrator yang disetujui pengguna. Docker Desktop 4.94.0.241994, Docker CLI 29.8.2 dan Compose v5.5.1 terpasang. Windows meminta restart pada pemasangan awal; tidak ada restart otomatis. Log instalasi lokal ada di `logs/prerequisites-install.log`.

Pada sesi lanjutan 9 Oktober 2026 pukul 13.41 Asia/Bangkok, Docker Engine merespons, image n8n 2.42.5 berhasil diunduh dan diekstrak, volume `ath_command_center_n8n_data` serta container `ath-n8n` dibuat. Inspeksi menyatakan `running`, `healthy`, restart policy `unless-stopped`. Health/readiness n8n dan health dashboard memberikan HTTP 200. Akun owner belum dibuat oleh agent dan API key belum dikonfigurasi. Log memuat warning Python runner tidak tersedia serta deprecation runner/config; JS runner terdaftar. Tidak ada workflow Python diuji.

## Koneksi API dan workflow, sesi lanjutan

Pada 9 Oktober 2026 pukul 14.11–14.16 Asia/Bangkok, key `ATH Local Command Center - Connected` terhubung melalui `.env` server. Delapan scope workflow/execution dan kedaluwarsa 8 November 2026 diperiksa pada UI n8n; key sebelumnya dicabut. Tidak ada nilai rahasia dicetak dalam hasil tool atau screenshot.

Kedua template berhasil diimpor melalui API. Monitor health `oq4AiQPpBxhWTJsN` aktif, dan execution 1, 2, 3 berstatus success. ATH Workflow Manager menampilkan CONNECTED dengan satu workflow aktif dan satu nonaktif; Execution Monitor menampilkan execution yang sama dari API. Health n8n, readiness dan health ATH masing-masing 200 setelah restart dashboard. Screenshot bukti tersimpan di `data/ath-n8n-workflows-connected.png` dan `data/ath-n8n-executions-connected.png`.

Pause dan Resume monitor tercatat dalam audit ATH dengan respons API sukses; monitor kemudian dipastikan kembali aktif melalui API dan UI. Browser mengalami hambatan dialog konfirmasi pada uji Resume; skrip verifikasi API memastikan keadaan akhir dan memperoleh execution sukses baru. Hal ini tidak dianggap bukti bahwa automation dialog browser selalu andal.

Template daily research `hSkon3oQ0c2EXDAA` tanpa endpoint RSS sempat teraktivasi selama interaksi browser. Pemeriksaan akhir mendeteksinya, menjeda template tersebut melalui API, dan memverifikasi keadaan akhir nonaktif. Skrip `connect-n8n.mjs` sekarang memeriksa feed sebelum mempertahankan status aktif template ini. Workflow riset belum diuji execution-nya dan belum dihubungkan ke job riset ATH. Berkas metadata verifikasi: `data/n8n-connection-status.json`.

Verifikasi terakhir pukul 14.20 Asia/Bangkok memperoleh execution monitor 8 berstatus success. Pada pukul 14.21, UI ATH kembali menunjukkan CONNECTED, monitor Aktif, dan daily research Nonaktif. Screenshot workflow diperbarui sesuai keadaan akhir tersebut.

## Belum diuji / belum aktif

- n8n persistence setelah restart Engine serta execution/node daily research. Owner/API key, import, API workflow/execution, scheduler monitor dan pemulihan status aktif monitor sudah diverifikasi pada sesi lanjutan.
- Cold backup lengkap serta restore n8n. Snapshot SQLite aplikasi dan restore ke direktori terpisah telah diuji; hasil tersebut tidak membuktikan restore n8n.
- Jadwal riset harian, bridge n8n ke dashboard, RSS aktual dan validasi hukum dokumen nyata.
- Ollama/ComfyUI generation, download model, transkripsi, FFprobe dengan video sah dan transcoding.
- OAuth Meta/TikTok, review aplikasi platform, durable publication worker, rekonsiliasi status dan posting aktual.
- Scheduled Task startup, perubahan daya Windows, active-installation restore, serta update/rollback n8n runtime.

Tidak ada publikasi media sosial atau pesan eksternal dilakukan. Data sintetis hanya berada pada lingkungan tes sementara. `.env`, bootstrap password, runtime data, backup dan hasil tes diabaikan Git. Lihat TODO untuk urutan pekerjaan berikutnya setelah koneksi API tersedia.

## Redesign Liquid Glass, verifikasi terbaru

Build produksi, typecheck, 13 tes inti dan 8 tes browser lulus pada 9 Oktober 2026. Laporan historis di atas menggambarkan versi sebelum redesign; bukti visual dan pemeriksaan material terbaru tersedia di LIQUID_GLASS_REVIEW.md. Log container kini tersedia karena Docker sudah berjalan; tes memeriksa hasil log aktual atau fallback yang terbaca, tanpa mengasumsikan Docker tidak tersedia.

Pemeriksaan tambahan mencakup tombol/panel reusable, mask tepi setelah kompilasi CSS, empat preset, keyboard/modal, loading/disabled, fallback tanpa backdrop, reduced motion, mobile menu, isi kapsul saat teks 200%, dan 600 baris execution tanpa filter per baris. Alur editorial serta job tetap diuji pada database sementara. Tidak ada state produksi atau workflow n8n diubah oleh tes.
