# Backup dan restore

## Snapshot aplikasi

Dashboard Backups membuat SQLite online backup melalui API node:sqlite, menormalkan snapshot journal menjadi DELETE, menyalin aset lokal, membuat manifest SHA-256, lalu memeriksa checksum dan PRAGMA integrity_check. Backup disimpan di `backups/app-UUID`; direktori alternatif server ATH_BACKUP_DIR didukung.

Snapshot aplikasi tidak mencakup n8n, .env, atau password awal. Aset bersifat immutable per import; file referensi snapshot tetap dipertahankan. Backup gagal jika file tidak dapat dibaca. Verifikasi ulang mendeteksi file berubah, hilang, atau tambahan. Backup tidak otomatis di-upload ke cloud.

## Backup lengkap yang konsisten

```powershell
.\scripts\stop.ps1
.\scripts\backup.ps1
.\scripts\verify-backup.ps1 -BackupPath 'C:\Users\user\Documents\ChatGPT\n8n-ISP\backups\full-...'
.\scripts\start.ps1
```

Skrip menolak full backup saat dashboard port masih aktif. Container n8n diperiksa dan dihentikan sementara jika masih berjalan; direktori .n8n disalin dengan docker cp. Aplikasi ./data, .env, compose.yaml, dan template workflows disalin. Container yang sebelumnya berjalan dimulai kembali pada finally; volume tidak dihapus. Custom data directory belum didukung skrip full backup.

Full backup berisi encryption key, kemungkinan credential database, dan password awal. `.env` encryption key n8n harus sama saat restore agar credential lama dapat dibaca. Folder backups pada disk C hanya salinan lokal, bukan perlindungan kehilangan disk; pindahkan salinan ke media terpisah secara manual dan lindungi aksesnya.

## Restore test terpisah

```powershell
.\scripts\restore.ps1 -BackupPath 'PATH_BACKUP' -TargetDirectory 'PATH_DIREKTORI_BARU' -ConfirmRestore RESTORE-ISOLATED
```

Target harus direktori baru; workspace aktif dan induknya ditolak. Skrip tidak menimpa file atau mengubah volume. Manifest diverifikasi sebelum dan setelah salinan. Untuk snapshot aplikasi, database yang disalin dapat dibuka secara read-only dan dibandingkan dengan jumlah records; proses test ini harus menggunakan direktori terpisah.

Restore ke volume n8n aktif belum diaktifkan. Implementasi berikutnya memerlukan konfirmasi eksplisit, backup instalasi aktif, target container/volume dan version yang diverifikasi, serta pengujian credential dan workflow. Jangan menyalin database aktif atau menurunkan versi n8n setelah migrasi tanpa prosedur restore.

Runtime full backup/restore n8n masih menunggu Docker. Penciptaan skrip tidak sama dengan pengujian container.
