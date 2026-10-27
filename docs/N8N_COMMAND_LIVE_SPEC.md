# n8n commands and TikTok live workspace

Status: design and direct implementation approved by the user on 10 October 2026. Command execution, live link preparation and manual-comment reminders are implemented. Existing browser-profile control remains unconfigured.

The user wants ATH to send typed commands to n8n and open a pasted TikTok live link with either of two accounts. They also want an adjustable interval for comments. The implementation will provide an adjustable reminder for a comment reviewed and sent by the user, rather than periodic autonomous posting from multiple accounts.

## Commands

Add a Command Center sidebar page and retain the overview command input. Both use a shared command component with supported command examples, pending/error states and execution results. Supported operations initially include checking n8n health, listing workflows, viewing failed executions and starting the existing selected-group WhatsApp collection. Existing navigation commands remain compatible.

An authenticated ATH action validates the command, calls a loopback-only authenticated n8n webhook and records the returned execution ID. n8n dispatches only registered operations. Unsupported requests get an explicit explanation; the interface does not claim arbitrary natural-language AI execution without a configured model. No arbitrary shell execution or arbitrary URLs.

Use a dedicated n8n webhook credential, encrypted by n8n, and a narrowly scoped ATH callback token. Secrets stay server-side, requests are bounded, redirects are rejected, and origin checks remain enabled. Avoid duplicate workflows during setup. Successful webhook receipt and successful task completion are distinct states. Interrupted or timed-out tasks must not be silently retried.

## Live workspace

Provide a validated HTTPS TikTok live link field and two named account slots. A user-selected browser profile keeps each account session separate. Users authenticate themselves; ATH does not read passwords or copy browser cookies. Profile names and browser choice must be supplied before connecting existing sessions.

Opening a live must be user-triggered and must not manufacture views, switch accounts repeatedly or perform automated engagement. The minimal version opens a validated live link for the selected account; actual browser control requires a defined local connector and explicit access review.

A configurable interval reminds the user to review a comment. It never sends a comment automatically. Context can be entered by the user to draft a relevant comment once a text model is configured. Without a model, show an editable comment field and honest unconfigured state rather than invented AI capability. The user reviews and sends each comment in TikTok.

## Visual and verification requirements

Retain the existing iPhone-inspired typography, capsule controls, matte work surfaces and Liquid Glass hierarchy. Preserve light/dark, keyboard focus, reduced motion and mobile layout. Test command validation, authentication, errors, execution IDs and both theme/mobile layouts with fixtures. Verify a real n8n execution separately from mocked UI tests. Do not send TikTok comments during testing.

## Outstanding configuration

- Browser and profile name for each of the two accounts.
- Whether a local browser connector is already installed and authorized.
- A model/provider for contextual drafts, if desired.
- Pair WhatsApp again via QR for group collection.
- Configure an approved official RSS/Atom feed for research.

## Connection recovery evidence

On 10 October 2026 the Docker Linux Engine was stopped and all n8n loopback probes returned ECONNREFUSED. Starting the installed Docker Desktop restored the existing ath-n8n container without altering volumes. Container status is healthy, /healthz/readiness returns HTTP 200, and API workflow listing returns HTTP 200 with the existing three workflows. Health monitor execution 978 succeeded at 07:41:17 UTC. API credentials remained unchanged.
