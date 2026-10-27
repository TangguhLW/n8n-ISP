# Liquid Glass: implementation and visual QA

9 October 2026. User direction: Apple-inspired optical material with readable operational data. See DESIGN_DECISIONS for the Design Read, dials, and explicit user overrides.

## Implementation

- `components/ui/AppleLiquidGlassButton.tsx`: default Get started, 166 × 46 px at normal text size, black 30 px arrow circle. Native button semantics, forwarded React 19 ref/attributes, loading/disabled state, real callbacks, keyboard focus, 220 ms hover/press. At enlarged text the label wraps and height expands rather than clipping.
- `components/ui/AppleLiquidGlassPanel.tsx`: semantic section/div/aside, configurable radius and material. Content sits above non-interactive optical layers.
- `app/liquid-glass.css`: four presets with independent opacity, blur, saturation, perimeter highlight, contact shadow and fallback. Milky 18 px blur, smoky 22 px, clear 12 px, elevated 28 px.
- Matte workspace, tables, forms, editor and workflow nodes. Glass reserved for floating sidebar, compact toolbar, readiness panel, selected actions and search dialog. Ambient teal/blue originates outside the panel.
- Native search dialog with Ctrl/Command K, explicit input focus, Escape, focus return and real navigation results. Notifications/profile navigate to the existing areas. Mobile uses a separate collapsible navigation.
- All existing API/job/editorial/upload/approval/export/backup handlers remain in place. Backend, secrets, workflow definitions and operational data were not changed by this redesign.
- CSS is an optical approximation. Backdrop diffusion/saturation plus layered edges do not constitute physically accurate refraction. No graphics engine or continuously running effects were introduced.

## Reference comparison and tuning

The prompt contains descriptions of references A/B but no accessible screenshot files. Comparison is against those descriptions, not against original pixels.

- A: compact capsule, milky center, narrow curved upper highlight, softer lower edge/contact shadow, black circular arrow, uneven studio lighting. Verified at 166 × 46 px in the rendered browser.
- B: translucent smoky center, outside teal environmental light visible through its upper-left region, subdued cool light toward lower-right, curved perimeter, internal edge and restrained shadow.
- Initial production CSS compilation reordered separate mask/composite declarations and let the perimeter reflection fill the panel. The mask composite is now part of the shorthand; a browser assertion checks that `exclude` survives compilation. Screenshot review confirmed the bright center wash is removed.
- Milky opacity was increased to .56 to maintain readable dark text when the pill sits above a black environment.
- Screenshot inspection at 200% text found an arrow clipping even though page scrollWidth passed. Capsule height now adapts, and an additional browser check ensures label/arrow stay inside their button bounds.

## Verification

- `npm run build`: PASS, production routes generated, including `/design/glass`.
- `npm run typecheck`: PASS.
- `npm test`: 13 PASS.
- `npm run test:e2e`: 8 PASS, final run 31.2 seconds. Tests use port 3001 and a temporary database, not production data.
- All 16 pages, themes, login/error/logout, actual commands, editorial approval/revision/export, backup, intake rights, notifications and log display remain covered.
- New checks cover default capsule dimensions, click/Enter, hover, loading/disabled, independent presets, compiled edge mask, solid no-backdrop fallback, reduced motion, search/dialog focus and Escape, mobile menu and 600 execution rows.
- The 600-row fixture has no per-row backdrop filter and at most four visible material elements. This is a targeted rendering check, not an FPS benchmark or production throughput claim.
- 390 px mobile and 800 px with 200% text: no page overflow. Enlarged capsule contents stay inside their bounds. Screenshots inspected for dark/light overview, mobile, 200% text, content editor, timeline, study and fallback.
- Contrast checker: muted dark text on conservative smoky background 6.03:1; muted light text 5.48:1; dark milky label on conservative background 5.23:1. Sampled rendered milky backgrounds were RGB(151,154,155) and RGB(148,151,152), checked separately. Control border #747982 on #101115 is 4.31:1, above the 3:1 non-text requirement. Visible focus, text status labels and 44 px minimum targets are retained. This is targeted QA, not an accessibility certification.
- React review: hooks precede conditional returns, keyboard listener cleans up, native dialog handles modal focus, decorative layers cannot intercept input, no new package/network/font dependencies, no expensive filter on table rows or the page.

## Local evidence

`test-results/glass-study-desktop.png`, `glass-study-mobile.png`, `glass-fallback.png`, `overview-dark.png`, `overview-desktop.png`, `liquid-overview-mobile.png`, `overview-200-percent.png`, `content-studio.png`, `workflow-map.png`, `executions-stress.png`; browser report `playwright-report/index.html`.

Final local dashboard: `http://127.0.0.1:3000/`. Study: `http://127.0.0.1:3000/design/glass`. Operational screenshots in `data/ath-liquid-glass-overview.png` and `data/ath-liquid-glass-workflows.png` document the connected runtime rather than fixtures. n8n health monitor remains active; daily research template remains inactive pending feed configuration.

At 15:13 Asia/Bangkok, the final production UI confirmed CONNECTED, monitor active and daily research inactive. Execution Monitor read real execution 61 with status success, followed by prior successful monitor runs. The in-app browser was left on Overview. Rendered milky pixel samples give 5.43:1 / 5.23:1 against #22252a; smoky sample #1a1d21 gives 8.52:1 against #b4b8c2.
