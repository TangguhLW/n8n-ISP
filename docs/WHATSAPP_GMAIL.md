# Gmail dari grup pilihan

Di Command Center, jalankan `cari gmail grup pilihan` setelah WhatsApp terhubung lewat QR. Alias: `cari gmail whatsapp`.

Pencarian hanya membuka riwayat grup pilihan yang sama dengan ekspor nomor: Open House Pucung, PSS Panco Sports Society, Grup gabut anak panco dan grup dengan kata ISP. Chat pribadi dan grup lainnya tidak dibaca. Media tidak diunduh. Alamat Gmail pada teks pesan/vCard dideduplikasi, dengan sumber grup dan ID pesan. Nomor/nama tidak dihubungkan dengan email berdasarkan pengirim pesan karena pengirim belum tentu pemilik email.

Hasil menambah baris email ke template yang sama, kolom H untuk email dan R untuk sumber. Nomor dan nama tetap kosong jika tidak terhubung secara pasti. Hasil email disimpan terpisah di cache lokal sehingga ekspor nomor terjadwal tidak menghilangkannya. File unduhan utama tetap `data/whatsapp/e-somasi-whatsapp.xlsx` dan dapat diunduh dari WhatsApp QR. File template asli tidak diubah.

Pemeriksaan dibatasi 10.000 pesan tersedia per grup per pemindaian. Batas, halaman berulang atau error menghasilkan peringatan cakupan, bukan klaim seluruh riwayat lengkap. Riwayat yang tidak tersedia pada perangkat tertaut tidak dapat dibaca. Pencarian baru ditolak selama pengambilan lain berjalan; jalankan ulang setelah selesai.

Pada startup 20 Oktober 2026, web merespons HTTP 200 dan sesi WhatsApp menunjukkan SCAN_QR_CODE. Belum ada pesan dibaca atau Excel baru dibuat pada tahap tersebut.

API pagination: https://waha.devlike.pro/docs/how-to/chats/#get-messages
