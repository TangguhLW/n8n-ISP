# Arsitektur

Browser lokal → Next.js server → SQLite metadata aplikasi. Server membaca health n8n dan API resmi n8n. Docker Compose menjalankan n8n dengan SQLite internal pada volume `ath_command_center_n8n_data`.

Pilihan SQLite sesuai beban awal dan RAM yang tersedia. Tidak ada PostgreSQL atau queue broker tambahan. Database n8n dan aplikasi terpisah karena aplikasi tidak boleh mengubah schema internal n8n; keduanya menggunakan satu jenis database, SQLite.

## Sumber status

| Data | Sumber utama |
| --- | --- |
| Container | `docker inspect ath-n8n` server-side |
| Keterjangkauan n8n | `/healthz` |
| Kesiapan database n8n | `/healthz/readiness` |
| Workflow dan execution | `/api/v1/workflows`, `/api/v1/executions` |
| Job bisnis dan timeline | Tabel SQLite `jobs`, `events` |
| Topik, profil, draft, video, aset, approval | SQLite `records`, indeks kind |
| Tindakan reviewer | Tabel `audit` |
| Notifikasi lokal | Records notification dengan deduplikasi/cooldown |

JSON disimpan sebagai payload terstruktur di SQLite untuk dokumen yang bentuknya berbeda. Identitas, kind, timestamp, indeks, job, event, dan deduplikasi dikelola oleh SQLite, bukan file JSON sebagai database operasional. File media berada terpisah pada data/images dan data/videos.

Mutasi dokumen berisiko menggunakan nomor revisi. Idempotency key job mempunyai unique constraint. Startup merekonsiliasi RUNNING/VALIDATING/RETRYING menjadi UNKNOWN tanpa mengulang efek eksternal. Job lokal saat ini diproses dalam request server; belum ada durable worker background atau job publisher.

Pemeriksaan sistem di-cache 30 detik; browser polling 45 detik saat terlihat. Ini bukan service monitor 24/7. Health failures tidak menyebabkan restart otomatis.

## Integrasi yang belum aktif

n8n belum menjadi orchestrator pipeline bisnis sampai Docker, akun owner, API key, dan bridge teruji. Template health serta pengumpulan kandidat RSS tersedia untuk import nonaktif. Bridge dari container ke dashboard loopback tidak dibuka otomatis, karena hal itu memerlukan rancangan endpoint internal dengan autentikasi terpisah. Jangan mengganti bind ke 0.0.0.0 untuk sekadar mengatasi koneksi container.

Ollama dan ComfyUI hanya diperiksa keterjangkauannya. Generation model, OAuth sosial, scheduler publikasi, video transcoding, serta transkripsi belum diimplementasikan. Prompt gambar dan paket manual tetap dapat disimpan tanpa provider.

Referensi: [n8n Docker Compose](https://docs.n8n.io/deploy/host-n8n/install-options/install-using-docker-compose.md), [monitoring n8n](https://docs.n8n.io/deploy/host-n8n/keep-n8n-running/monitor-n8n.md), [autentikasi API n8n](https://docs.n8n.io/api/authentication/).
