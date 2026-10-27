# WhatsApp export: selected groups only

Updated 9 October 2026, 16:26 Asia/Bangkok. The user's latest instruction supersedes the earlier broad collection scope. Current export scope is `selected-group-participants-v1`: only current participants of Open House Pucung, PSS (Panco Sports Society), grup gabut anak panco, and groups whose names contain the word ISP. Individual chats, all-contact enumeration, message scanning and Gmail scanning are excluded. Previous broad index entries are not carried into the new export.

The completed live collection contains 81 unique numbers from five groups: grup gabut anak panco (19 participants), ISP DEVELOPER (4), Konten ISP (2), Open house Pucung (35), PSS (Panco Sports Society) (40). Memberships overlap. All 100 group memberships reconcile to the 81 deduplicated records. All participant LIDs were resolved through actual WAHA mappings. No unresolved phone numbers or collection warnings remain. 78 records have an available WhatsApp/contact name, and three names remain blank.

The exported workbook preserves all three template sheets, 19 column headers, DataDebiturTable and ReferensiKolomTable. Each number occupies one text cell in column G. Available names occupy B and source group names occupy R. Other personal/legal fields, including email, are blank. IDs identify test records. Body formatting is consistent, phone cells display full digits, and source notes wrap to fitted row heights. Original Downloads template is preserved.

The workflow is now named ATH - Nomor Grup Pilihan ke Excel and remains active hourly. Live dashboard collection and authenticated Excel download were exercised successfully. Export metadata prevents downloading the old broader scope. Validation: 19 unit tests, two browser tests, production build/type checking, rendered phone/source-column inspection, XLSX XML reconciliation, text-cell validation and preservation of instruction/reference values. The delivered copy has the same SHA256 as the verified live export.

The remaining historical setup notes below describe the initial connection, not the current collection scope.

Pairing page: http://127.0.0.1:3000/whatsapp. A normal WhatsApp Web login in Edge is separate from the WAHA session. Scan the QR shown on the ATH page using the phone's Linked devices menu.

WAHA 2026.9.2 runs with WEBJS, a pinned image digest, API authentication and the host binding 127.0.0.1:3002. The session volume is separate from n8n. A linked device has WhatsApp account capabilities including reading and sending. The export flow only uses GET requests for contact/chat/group/message data, and session creation/start for pairing. It has no message-sending, contact-writing, mark-as-read, group-joining or legal notice endpoint.

The n8n workflow `naS7h96s9EwKU2qV` starts a local export hourly. The header credential is encrypted by n8n. The limited ATH sync endpoint can only start the export. It returns `waiting_for_qr` until WAHA is WORKING. Manual execution 101 successfully reached ATH and returned that state on 9 October 2026. This verifies the local connection, not collection of WhatsApp data.

Collection requests group metadata without participants, filters the requested group names, then requests participants only for those groups. Individual participant names and LID mappings are looked up only for selected members. Fresh snapshots are deduplicated by phone number. No unresolved LID or group ID is treated as a phone number.

The template's three sheets, 19 headers and table name are retained. G contains phone text values and R contains group provenance and the testing designation. H remains blank. Template examples are removed, including the example email hyperlink. Addresses, agreements, amounts and legal statuses remain blank when unavailable. The importer may require those fields; they must come from supplied data or clearly identified test fixtures, not inferred from WhatsApp membership.

Local files are under ignored `data/whatsapp/`: e-somasi-whatsapp.xlsx, whatsapp-contacts.csv, whatsapp-groups.csv, a deduplicated index and coverage metadata. Full message bodies and downloaded attachments are not retained. Input template in Downloads is preserved. Text matches are marked as requiring verification because a number in a message is not necessarily a WhatsApp phone number.

Fixtures remain separate from real exports. The live account is now paired and selected-group collection is complete, as recorded above.

Design: ENERGY 2 / RHYTHM 2 / MOTION 1, matching the existing ATH direction. One smoky pairing surface frames the QR; a matte export workspace keeps progress readable. Existing system fonts, teal links, capsule actions and focus/disabled/error states serve pairing and file retrieval. No new theme or animation system.

Sources: [WAHA contacts and LID mapping](https://waha.devlike.pro/docs/how-to/contacts/), [groups](https://waha.devlike.pro/docs/how-to/groups/), [message pagination](https://waha.devlike.pro/docs/how-to/chats/), [sessions and QR](https://waha.devlike.pro/docs/how-to/sessions/), [API security](https://waha.devlike.pro/docs/how-to/security/).
