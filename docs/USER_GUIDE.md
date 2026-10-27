# Panduan pengguna

Overview menampilkan health dan statistik database aktual. Job Queue memfilter pekerjaan dan membuka Live AI Operations. Map memakai event job yang tersimpan, dengan timestamp; mode cerita mengganti nama tahap menjadi analogi meja kerja tanpa membuat pekerjaan rekaan.

Agent Manager menampilkan job terbaru per fungsi. IDLE berarti tidak ada pekerjaan aktif. Workflow Manager dan Execution Monitor membutuhkan API key server n8n. Hasil API maksimum sepuluh halaman; jika dibatasi, dashboard menyatakan hasil tidak lengkap.

Legal Intelligence menerima kandidat manual atau feed RSS/Atom resmi. Reviewer membaca sumber dan mengisi pemeriksaan. Content Studio menyusun template caption, brief, prompt, dan paket ekspor. Semua gambar harus diimpor pada ukuran yang sama sebelum approval. Ekspor boleh dilakukan ketika draft belum disetujui, tetapi STATUS.txt tetap menyatakan status lokal dan belum dipublikasikan.

Settings menyimpan profil setiap akun secara terpisah; tidak menyimpan token lewat browser. TikTok Automation menyimpan referensi, bukti hak, caption input, dan file MP4. Video tanpa izin berada pada NEEDS_PERMISSION; tidak dapat disetujui. Logs memperlihatkan audit dan log container yang tersedia. Notifikasi hanya lokal; tidak ada email/Telegram yang dikirim.

Perintah yang tersedia: status semua sistem, cek kesehatan n8n, diagnosis error terakhir, tampilkan workflow gagal, tampilkan job berjalan, tampilkan riset hukum hari ini, tampilkan antrean TikTok, tampilkan log terbaru. Perintah membuka halaman terkait, bukan shell atau instruksi LLM. Filter lebih lanjut dipilih pada halaman. Perintah yang memerlukan topik/akun atau perubahan berisiko dilakukan melalui form berkonfirmasi.

Password owner awal berada di data/bootstrap-password.txt. Jangan mengirim password atau .env ke chat. Password/session secret belum mempunyai form rotasi; penggantian harus dilakukan melalui prosedur server setelah menghentikan dashboard, dengan backup dan hash scrypt yang baru. Rotasi session secret mencabut sesi lama. TTL sesi delapan jam, logout mencabut cookie browser saat ini.
