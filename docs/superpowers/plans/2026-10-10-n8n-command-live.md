# n8n Commands and Live Workspace Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task in the current thread. No subagents required.

**Goal:** Run registered commands through n8n with visible execution results, and prepare two-account TikTok live links with adjustable manual-comment reminders.

**Architecture:** An authenticated ATH action calls a private n8n webhook. A registered operation dispatcher returns bounded results and n8n execution IDs. A separate live workspace validates TikTok URLs and provides manual links and reminder controls, without accessing cookies or automatically posting comments.

**Tech Stack:** Existing Next.js 16, React 19, TypeScript, n8n Docker and Playwright Edge tests. No new dependencies.

**Spec:** docs/N8N_COMMAND_LIVE_SPEC.md (approved by the user).

## Global Constraints

- Preserve loopback access, origin checks and server-side secrets.
- Preserve existing WhatsApp collection scope and all existing command navigation behavior.
- Keep iPhone-inspired typography and Liquid Glass material hierarchy.
- No arbitrary shell execution, cookie copying or autonomous TikTok comments.
- Browser profile access is unconfigured until the user supplies profile details and access is reviewed.

## Review Focus

- Unsupported commands return an error rather than pretending execution.
- n8n offline or slow results remain errors; no implicit retries of side effects.
- Authenticated webhook rejects missing or invalid tokens before dispatch.
- TikTok URLs reject credentials, unrelated hosts, scripts and unsupported paths.
- Reminders clean up on stop/unmount and never send messages.

## Task 1: Recover and verify n8n

- [x] Diagnose Docker startup; preserve all existing volumes.
- [x] Start the existing n8n container once Engine is healthy.
- [x] Verify readiness, API authentication and one actual health-monitor execution.

## Task 2: Registered command execution

Files: lib/n8n-commands.ts, lib/actions.ts, app/api/n8n/dispatch/route.ts, scripts/setup-n8n-commands.mjs, workflows/command-center.json, tests/n8n-commands.test.ts.

Interfaces: parseN8nCommand(command: string) returns a registered operation; runN8nCommand(command: string) returns executionId and result. Dispatcher accepts authenticated registered operations only.

- [x] Write and run failing validation and authentication tests.
- [x] Implement bounded health/workflow/execution/WhatsApp dispatch and authenticated webhook setup.
- [x] Verify tests, webhook rejection and a real n8n execution.

## Task 3: Command and live UI

Files: components/n8n-command.tsx, components/tiktok-live.tsx, components/command-center.tsx, app/globals.css, tests/n8n-command.e2e.ts.

- [x] Add shared command form with pending/error/result and execution ID.
- [x] Add Command Center sidebar entry, retaining overview entry point.
- [x] Add two account labels, validated live URL and explicit open links. Clearly label browser control as unconfigured.
- [x] Add editable comment and configurable reminder interval with start/stop; every send stays manual.
- [x] Test auth, commands, failures, URL validation, reminders, themes and mobile.
- [x] Build, inspect rendered screenshots, restart dashboard only and record scoped design gate.

Execution method: direct implementation approved by the user's request to install immediately. Browser connection remains dependent on the user's browser/profile details.

## Execution ledger

- Connection recovery complete: existing volumes preserved, n8n readiness/API healthy and scheduled monitor execution verified.
- Registered command dispatch complete: authenticated workflow FLpNQEXevvcMI5W0 active, real execution IDs 992–996 and 999 verified. Invalid webhook token rejected with HTTP 403. Unit validation tests were observed failing before implementation and passing afterward.
- Live UI and reminders complete: two account labels, validated manual live links, adjustable 1–120 minute reminders and manual-comment controls. No browser-profile control or contextual model is claimed.
- Ruling: daily research now uses the approved ATH source registry rather than an empty duplicated feed field. Missing feeds return needs_configuration; no arbitrary feed URL is selected. Existing workflow ID is preserved and previous definition backed up.
- Ruling: repair login's existing counter after successful password verification, because thirteen browser tests exposed correct logins being counted as failures. Regression test proves repeated failed attempts are still limited.
- Fresh-context review found case-sensitive legacy command lookup. Both client classification and server lookup now normalize case and whitespace; a regression test was observed failing then passing. No other important review issues found.
- Production build and 24 unit tests pass. Seven affected existing browser tests pass after fixes; final command/live screenshot verification is recorded in the design gate.
