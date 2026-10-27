# n8n commands and TikTok Live

Open ATH and choose Command Center in the sidebar. The same command field is also available in Overview.

Supported commands:

- cek kesehatan n8n
- daftar workflow
- tampilkan workflow gagal
- ambil nomor grup pilihan
- jalankan riset hukum
- buka live akun 1 https://www.tiktok.com/@namaakun/live
- buka live akun 2 https://www.tiktok.com/@namaakun/live

These trigger the active ATH - Command Center workflow using an authenticated loopback webhook. The result includes the actual n8n execution ID. Unknown commands are rejected. Existing navigation commands, such as tampilkan antrean TikTok, continue opening the corresponding page.

In TikTok Automation, paste a complete live URL, select one of two account labels, and click Siapkan live lewat n8n. Once the response arrives, click Buka TikTok live. This opens a link in the browser currently showing ATH; it does not select or control an existing browser profile. Use a separate browser profile for each login. The labels are editable and saved locally; they are not proof of connected accounts.

Enter a draft comment and an interval from 1 to 120 minutes. Mulai pengingat starts one reminder; when it appears, review and send the comment in TikTok yourself. Ingatkan lagi schedules the next reminder, and Hentikan clears it. Switching away from the TikTok page stops its timer. The feature does not automatically send comments or infer live context without a configured model and context source.

## Workflow audit on 10 October 2026

Docker and ath-n8n are running. All four registered workflows are active. The API error-execution audit returned no stored error executions. Existing workflow definitions were backed up to ignored data/n8n/previous-ID.json before replacement.

- System Health Monitor: existing scheduled readiness check continues working.
- Selected Group Excel: existing scope is unchanged; Command Center execution 999 returned waiting_for_qr. Pair the account again in WhatsApp QR before collection. No unselected chats or groups were read.
- Daily Legal Research: repaired to call the ATH research pipeline at 08:00 Asia/Bangkok using the configured and approved ATH feeds. The old empty RSS template was replaced. Execution 995 of the same dispatcher returned needs_configuration because no enabled feed exists. Configure RSS/Atom in Legal Intelligence; no feed URL or permission was invented.
- Command Center: real health/workflow/failure/research/live preparation executions 992–996 completed with HTTP 200 and execution IDs. Invalid webhook credentials returned HTTP 403. Live preparation creates a validated link, not a claim that TikTok was opened or watched.

Run node --env-file=.env scripts/setup-n8n-commands.mjs to reconcile the command and daily workflows without duplicates. It uses stable credential IDs and saves credentials encrypted in n8n. Temporary credential files are cleared after import. Do not share .env or files under data.
