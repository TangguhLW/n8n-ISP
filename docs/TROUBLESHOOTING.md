# Diagnosis

| Gejala | Tindakan |
| --- | --- |
| Docker tidak ditemukan | Selesaikan installer, restart jika diminta, buka Docker Desktop; mulai terminal baru agar PATH diperbarui. |
| Engine belum siap | Tunggu Docker Desktop menyatakan Engine running; periksa virtualisasi/WSL melalui dokumentasi resmi. |
| n8n DOWN | Jalankan status.ps1, logs.ps1, health-check.ps1. Jangan hapus volume. |
| API NEEDS_API_KEY | Buat API key sendiri di n8n, isi .env, restart dashboard. Jangan kirim key lewat chat. |
| Port sudah digunakan | Identifikasi pemilik port, pilih port lain di .env; tidak mematikan proses lain. |
| Riset NEEDS_CONFIGURATION | Tambahkan URL RSS/Atom resmi, bukan halaman HTML biasa; konfirmasi ketentuan akses. |
| Sumber HTTP 403/CAPTCHA | Hentikan akses otomatis dan gunakan jalur resmi/manual; jangan bypass. |
| Approval gagal | Periksa sumber REVIEWED, semua file slide, akun, serta revision; refresh jika stale. |
| Video NEEDS_PERMISSION | Lengkapi hak dan bukti; jangan posting konten yang haknya tidak diketahui. |
| Video NEEDS_FFMPEG | FFprobe belum tersedia pada PATH. Pilih instalasi resmi FFmpeg sebelum validasi. |
| Job UNKNOWN setelah restart | Periksa hasil lama. Retry manual hanya riset/draft dan tidak membuat publikasi. |
| Backup checksum gagal | Jangan restore. Periksa file yang berubah/hilang dan buat backup baru dari sumber sehat. |
| Login gagal | Periksa password lokal, bukan password n8n. Setelah sepuluh percobaan tunggu 15 menit. |

Keadaan tidak pulih dengan menghapus database, credentials, volume, atau .env. Kunci lama tidak diganti otomatis. PowerShell script memakai exit code 0 pada keberhasilan dan 1 saat gagal.
