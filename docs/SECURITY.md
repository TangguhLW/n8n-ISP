# Keamanan

- Next.js dan port n8n bind loopback. Tidak ada Docker socket mount, tunnel, port forwarding, perubahan firewall, atau perubahan daya.
- Login single-owner menggunakan scrypt password hash di .env, HMAC session berumur delapan jam, cookie HttpOnly/SameSite=Strict. HTTP lokal tidak memakai Secure cookie. Konfigurasi ini hanya untuk laptop lokal.
- API state, action, upload, asset, dan export memerlukan sesi. API health hanya memberikan status umum, tanpa konfigurasi rahasia.
- Mutasi dan login membutuhkan Host lokal dan Origin yang sama; request cross-site ditolak. Validasi input memakai zod, batas body streaming, field whitelist, dan revision check.
- Login dibatasi sepuluh percobaan per 15 menit. Rate limiter SQLite tidak mempercayai header IP dari browser.
- API key hanya dibaca server. localStorage hanya menyimpan tema. Isi .env dan bootstrap password diabaikan Git; backup lengkap berisi rahasia dan harus dilindungi.
- API command memakai daftar eksplisit. Tidak ada shell bebas, kode AI yang dieksekusi, atau endpoint publish terselubung.
- Docker read-only melalui execFile dengan argumen tetap untuk inspect/log; FFprobe memakai argumen tetap dan path file yang dibuat server. Timeout dan maxBuffer diberlakukan. Error aplikasi diringkas/redacted sebelum dikirim ke frontend.
- URL riset memakai domain resmi terbatas, HTTPS, no userinfo, port default, no redirects, timeout, dan ukuran feed maksimal. Provider lokal hanya endpoint loopback yang dikonfigurasi server.
- File import tidak menerima nama/path dari pengguna sebagai lokasi filesystem. Sharp memvalidasi gambar dan menulis ulang PNG. MP4 tetap memerlukan FFprobe sebelum approval.

Rahasia tidak boleh dimasukkan ke catatan topik, caption, profil, atau prompt. Redaksi log otomatis bukan pengganti disiplin input; jangan memasukkan token ke node n8n yang sengaja menghasilkan log/data output. Script logs.ps1 menampilkan log container mentah kepada pengguna lokal; jangan bagikan log mentah kepada pihak ketiga.

Saat ini belum ada multi-user, revocation daftar sesi server, enkripsi at-rest backup, CSP nonce, atau akses jaringan luar. Logout menghapus cookie browser, rotasi session secret mencabut semua sesi. Jangan membuka bind publik tanpa proyek hardening HTTPS/auth terpisah.
