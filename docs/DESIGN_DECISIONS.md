# Arah desain — Liquid Glass

Reading this as: pusat operasi ATH dengan permukaan matte obsidian dan kaca optik yang tenang, mengikuti brief Apple-inspired Liquid Glass pengguna. ENERGY 2 / RHYTHM 2 / MOTION 2 (updated 10 October 2026 at the user's explicit request for spring-like section entrances).

- ENERGY 2: kedalaman material berasal dari pencahayaan lingkungan dan tepi melengkung; tanpa neon, ungu, atau gradient pada setiap kartu.
- RHYTHM 2: navigasi mengambang, toolbar ringkas, ringkasan lebar, tabel matte, dan editor mempunyai bentuk sesuai fungsinya.
- MOTION 2: section enters once over 520 ms, with a slight scale overshoot and 60–100 ms bounded delays; hover/press remains 220–340 ms. Only the first six list items animate; table rows do not. No loops, no page-wide filters. Reduced motion removes entrance animation and transitions.
- Obsidian #08090B, graphite #141519, silver #C8CBD2. Mode gelap menjadi default; preferensi tema yang tersimpan tetap dihormati.
- Segoe UI/system stack tersedia lokal. Tidak mengunduh atau mengaku memakai font proprietary Apple.
- Kaca milky, smoky, clear, elevated memakai opacity, diffusion, highlight, edge, radius, dan contact shadow berbeda. Hanya sidebar, toolbar, hero, dialog, dan aksi terpilih memakai backdrop filter; data tidak memakai filter per baris.
- User secara eksplisit meminta sistem Liquid Glass di seluruh aplikasi: ini mengesampingkan batas antislop yang melarang penggunaan kaca lebih dari 1–2 elemen. Hirarki tetap selektif dan tidak menumpuk kartu kaca.
- User meminta default label komponen “Get started”; aplikasi memakai label tindakan Indonesia yang konkret. Label referensi hanya hadir dalam studi material.
- Ikon navigasi adalah SVG sederhana dengan fungsi yang dapat dikenali, selalu disertai label. Semua status tetap mempunyai teks dan sumber aktual.
- Mobile memakai menu buka/tutup tersendiri. Dialog pencarian memakai dialog native, keyboard focus, Escape, dan hasil navigasi yang benar-benar bekerja.
- Screenshot A/B tidak tersedia sebagai file di pesan. QA membandingkan render terhadap deskripsi geometris/material pengguna, bukan mengklaim perbandingan pixel identik.
- CSS backdrop-filter memberi diffusion/saturation, bukan refraction fisik. SVG feDisplacementMap memerlukan sampling peta displacement; menambahnya lintas kontrol berisiko memelintir teks dan memberi hasil berbeda antarbrowser. CSS berlapis dipilih tanpa WebGL atau klaim refraction fisik.

Referensi teknis: [MDN backdrop-filter](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/backdrop-filter), [MDN feDisplacementMap](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/feDisplacementMap).
