# Riset hukum

Sumber diizinkan melalui HTTPS pada mkri.id, mahkamahagung.go.id, jdihn.go.id, peraturan.bpk.go.id, ojk.go.id, dan jdih.kemenkum.go.id beserta subdomain. URL private IP, port alternatif, userinfo, protokol selain HTTPS, redirect, dan domain menyerupai sumber resmi ditolak. Tambahkan domain baru hanya melalui review konfigurasi server.

RSS/Atom hanya diambil jika endpoint dimasukkan dan pengguna mengonfirmasi akses sesuai ketentuan sumber. Batas 2 MB dan timeout 15 detik per feed, maksimal 40 entry per feed. Tidak ada bypass login, CAPTCHA, atau paywall. Tidak ada sumber feed aktif bawaan yang endpoint-nya belum diuji.

Metadata menyimpan URL, publisher, publicationDate, eventDate, enactmentDate, effectiveDate, discoveredAt, checkedAt, verification, legalValidity, regulationNumber, primarySources, supportingSources, reviewNotes, relevance, confidence, dan risiko. Sebagian field belum punya editor lengkap; tanggal penetapan/berlaku tidak ditebak. Kandidat dideduplikasi menurut canonical URL; normalisasi tracking URL lintas sumber belum tersedia.

Feed baru tidak dianggap peristiwa baru. Tanggal tidak tersedia tetap null. Tanggal feed yang tidak valid/future tidak dipakai sebagai publikasi valid. Topic.create menolak tanggal future. Fakta feed berstatus UNVERIFIED. Reviewer lokal harus membaca dokumen penuh dan mengisi catatan serta konteks. REVIEWED menunjukkan pemeriksaan manusia yang dicatat, bukan sertifikasi hukum oleh AI.

Scoring: jumlah tujuh aspek positif (masing-masing 0..5) dikurangi dua risiko (masing-masing 0..5), dibagi 35 dan dikalikan 100; hasil dibatasi 0..100. Aspek: kebaruan, kredibilitas, kepentingan publik, audiens, edukasi, kejelasan, fokus praktik; risiko: salah tafsir dan reputasi. Alasan berupa setiap nilai ditampilkan. Ini penilaian reviewer, bukan jaminan viralitas.

Belum ada LLM yang mengekstrak hukum atau memberi nasihat final. Ringkasan feed dan input pengguna membutuhkan review advokat. Jangan menambahkan pasal, kutipan, nomor putusan, atau status keberlakuan tanpa sumber.
