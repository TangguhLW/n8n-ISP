# Content Studio

Profil terpisah disediakan untuk izasadziliandpartners dan isolegalofficial. Profil awal kosong dan membutuhkan konfigurasi pengguna. Snapshot profil disimpan pada setiap draft sehingga pilihan akun dan arahan desain dapat ditelusuri.

Format: portrait 1080×1350, square 1080×1080, carousel empat slide konsisten 1080×1350. Template draft berisi fakta sumber, relevansi, sumber, disclaimer, caption utama/singkat, hashtag awal, dan prompt per slide. Belum ada generator variasi gaya atau LLM otomatis; jangan menyebut template ini hasil model terhubung.

Image generation Codex dalam chat tidak otomatis menjadi API backend n8n. Aplikasi menyediakan prompt, copy prompt, import image, preview, dan ekspor ZIP. ComfyUI hanya health check; model dan workflow generation belum tersedia. Jangan unduh model besar tanpa pilihan hardware serta lisensi.

Impor maksimal 10 MB; hanya PNG/JPEG/WebP yang dibaca sharp, dengan batas 25 megapixel dan ukuran slide tepat. Hasil dire-encode PNG untuk menghilangkan metadata dan jenis file aktif. Aset mempunyai ID acak, path terkontrol, akses sesi, dan MIME server. SVG tidak diterima.

Approval membutuhkan sumber REVIEWED, file setiap slide benar-benar tersedia, catatan reviewer, konfirmasi checklist, dan nomor revisi yang sesuai. Perubahan caption/gambar menghapus approval lama. Job terkait kembali menunggu review setelah revisi. Request yang stale ditolak.

ZIP berisi metadata, caption/hashtag, prompt, gambar yang tersedia, dan STATUS.txt. Ekspor belum menjadwalkan atau memublikasikan apa pun. Jadwal, publish API, dan image generation otomatis belum tersedia.
