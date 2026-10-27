# Instagram

Kedua akun memiliki status NEEDS_AUTHORIZATION. Tidak ada koneksi Meta yang telah dibuktikan. Dashboard mengelola profil dan paket konten secara terpisah; persetujuan lokal berbeda dari otorisasi akun platform.

Integrasi berikutnya harus memilih satu alur resmi Instagram Platform sesuai akun dan aplikasi: Instagram Login atau Facebook Login. Jangan mencampur scope kedua alur. Periksa akun profesional, app permission, token lifetime, ownership akun tujuan, kebutuhan review aplikasi, dan dukungan feed/carousel pada versi API yang dipilih.

Dokumentasi [Meta Instagram Platform](https://developers.facebook.com/docs/instagram-platform/) menjadi sumber resmi. Halaman rinci content publishing tidak dapat dibaca oleh tool web pada sesi ini, sehingga persyaratan rinci scope/rate limit belum dinyatakan diverifikasi. Akun pengguna tidak diperiksa tanpa login/otorisasi.

Saat provider dikembangkan, media harus memenuhi mekanisme akses platform tanpa membuka dashboard lokal ke internet. Periksa status container media sebelum publish, simpan ID media/publish, catat timestamp, dan tangani timeout dengan pemeriksaan status terlebih dahulu. Tidak ada browser automation untuk melewati autentikasi atau pembatasan.

Alur yang tersedia: buat draft → review semua sumber dan aset → setujui revisi → ekspor ZIP → posting manual melalui akun yang benar. Belum tersedia publish otomatis atau scheduler konten.
