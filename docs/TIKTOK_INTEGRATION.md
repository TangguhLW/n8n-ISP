# TikTok

Status saat ini NEEDS_PLATFORM_APPROVAL. Tidak ada token TikTok, OAuth flow, atau endpoint posting aktif. URL YouTube hanya disimpan; sistem tidak mengunduh konten publik tanpa mekanisme penggunaan yang sah.

Intake mencatat hak UNKNOWN/OWNED/LICENSED, bukti penggunaan, dan caption dari pengguna. UNKNOWN berarti NEEDS_PERMISSION. OWNED/LICENSED membutuhkan bukti teks; ini deklarasi pengguna, bukan verifikasi lisensi otomatis. Upload MP4 maksimal 64 MB disimpan di data/videos dan diperiksa FFprobe bila tersedia. Video tidak dapat disetujui tanpa file, hak, bukti, dan metadata VALIDATED. Tidak ada konversi, pemotongan, subtitle, watermark removal, atau transkripsi saat ini.

Untuk file milik sendiri, URL dapat dikosongkan. Setelah intake tersimpan, unggah file. Form pemeriksaan izin dapat menyelesaikan status UNKNOWN dengan bukti dan konfirmasi reviewer; perubahan hak membatalkan approval sebelumnya. Ini tetap deklarasi manusia yang diaudit, bukan pemeriksaan otomatis terhadap kontrak lisensi.

Paket ekspor berisi video jika tersedia, caption, metadata hak, serta status. Uploader tetap harus memastikan izin penggunaan dan konteks sebelum posting manual.

Untuk fase OAuth/publishing, ikuti [TikTok Content Posting API resmi](https://developers.tiktok.com/doc/content-posting-api-get-started/): aplikasi developer, OAuth dan scope video.publish, creator info, pilihan privasi yang diperbolehkan, persetujuan eksplisit pengguna, validasi upload, dan pemeriksaan status post. Aplikasi belum diaudit mempunyai batas publikasi tertentu; persetujuan platform tidak boleh diasumsikan. Mode upload draft membutuhkan scope/alur tersendiri. Rate limit dan spesifikasi media harus dibaca saat implementasi provider; belum di-hardcode sebagai janji saat ini.

Publikasi baru dianggap berhasil saat API platform memberikan status sukses dan ID yang dapat dicatat. Worker publikasi kelak harus merekonsiliasi posting sebelum retry agar tidak menggandakan post.
