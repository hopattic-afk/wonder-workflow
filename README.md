# Wonder & Workflow — Website and Operations Audit Console

The public Wonder & Workflow website is now at `/`, with `/assessment` and `/book`.
Open `/workspace` for the existing internal audit console. Historical saved data,
document behavior and the retained McCann GHL integration contracts are preserved.
See [the review package](output/wonder-workflow/START-HERE.md) for brand assets,
local website preview, validation and remaining production/GHL approval steps.
The repository preserves the approved Wonder & Workflow source, public assets,
assessment flow, internal workspace, and the legacy integration contracts. It
does not contain runtime secrets, local build outputs, or review-package ZIPs.

## Existing console and historical integration record

An internal workspace for McCann Contracting LLC AI Operations, connecting the audit, calculator, recommendation and proposal. The enabled production bridge has verified live assessment capture, booking packet creation, automatic GHL reschedule/cancellation delivery, and duplicate protection. Hosted authenticated audit UI was not exercised; see the precise evidence and limits in [activation record](docs/ACTIVATION-RECORD-2026-09-05.md).

## Run locally

Business decisions and launch context from **AI Automation Business** are consolidated in [BUSINESS-CONTEXT.md](docs/context/BUSINESS-CONTEXT.md). The latest campaign artwork/captions are preserved under `docs/context/assets/social-v2/`, with source hashes in `docs/context/SOURCE-MANIFEST.json`. This is a context/file consolidation; the original ChatGPT project remains intact. Current implementation and verified live status take precedence over historical drafts.

Use Node.js 24 LTS and npm. The dependency lockfile records the verified versions.

```powershell
npm.cmd ci --cache .npm-cache
npm.cmd run dev
```

Open the local address printed by Vite, usually `http://127.0.0.1:5173`. Use the same address and browser each time to access the same local data.

```powershell
npm.cmd test
npm.cmd run build
npm.cmd run preview -- --port 4173 --strictPort
npm.cmd run test:e2e
```

The preview serves the production build at `http://127.0.0.1:4173`. Playwright starts it automatically when absent. The checked-in Playwright configuration uses locally installed Google Chrome; install Chrome or remove `channel: 'chrome'` and run `npx.cmd playwright install chromium` to use Playwright's managed browser. Standard `npm`/`npx` commands also work outside PowerShell execution-policy restrictions.

## Workflow

1. Create an audit from the dashboard. One fictional, deletable **Demo Data** session is included on first use.
2. Capture client information, one workflow, process steps, systems, baseline, use cases, risk controls, and an internal Pilot-Fit Score. The optional timer never changes sections. Call Notes stay accessible throughout the audit.

   The call worksheet has five sections: **Client & goal**, **Walk through the work**, **Time & tools**, **AI possibilities & review**, and **Wrap-up**. Start with the visible questions; expand optional details only when useful. The internal Pilot-Fit Score lives under **After the call: internal assessment**. “Where could AI help?” records potential improvements, not tools the business already uses. Record existing software and AI tools under **Time & tools**. Unknown answers can remain blank and be added to the agreed follow-up.

3. Enter labor roles, software costs, rework, recurring costs, and optional avoided hiring. Missing numeric assumptions are **Not established**. Enter an explicit zero where a cost is known to be zero. Currency defaults to USD; CAD is supported without exchange conversion or tax.
4. Generate and edit the recommendation. Investment and internal rationale are excluded by default. Keep within the length guidance and check the one-page preview.
5. Generate and edit the proposal. Enter pricing manually; choose an optional payment preset, deliverables, milestones, acceptance criteria, and support terms. Marking a proposal sent only updates local status.
6. Print / Save as PDF using U.S. Letter, normal scale, and browser headers/footers disabled. Confirm the preview before sharing. Duplicating a proposal makes an independent full audit copy so its context and prices stay together.

Marketing work is out of scope for AI Operations and is referred to Justin. Risk warnings remain internal unless explicitly captured in the client document. These documents use local templates; no AI API is called.

Optional prefill parameters can be supplied on the dashboard before choosing New audit: `business`, `contact`, `email`, `score` (0–21), `tier`, and `priority`. Values are validated/bounded and the query is removed on entering the audit. Avoid sensitive query strings: addresses can remain in browser history and any future host's access logs.

## Data storage, backup, and restore

- Version 1 uses the localStorage key `mccann-ai-operations-audit:v1`. Data is saved after a 450 ms debounce and flushed on page exit. The client summary distinguishes saved, saving, and failed saves.
- Browser storage is device-, browser-profile-, and origin-specific. The development and production-preview ports have separate data. Export/import to transfer data between them.
- Call notes, pricing, and documents remain browser-local. When configured, the hosted bridge stores public assessment submissions and verified GHL bookings; the protected inbox imports prepared packets on opening the workspace. It does not upload local edits. No AI API or automated email/SMS is used. Public pages load Google Analytics (gtag). The unconfigured preview does not send assessment answers.
- Local storage and downloaded JSON are **not encrypted by this application**. Use a trusted device, protect browser access, and do not enter passwords, API keys, or unnecessary sensitive records.
- Use **Settings & backup → Export all data** for all sessions and settings. The dashboard offers a full backup; each audit also has an individual JSON export. A reminder appears if no full backup exists or the last full export is older than seven days.
- To restore, choose **Import all data**. The app validates JSON, schema version, field bounds, IDs, and local image types before offering **Merge sessions** or **Replace workspace**. Merge replaces matching audit IDs and preserves current settings. Replace removes records absent from the backup and restores imported settings; confirmation is required.
- Backups are limited to 25 MB. Local browser storage quotas are usually smaller and vary. Storage failures preserve the previous saved data and show a warning. Export work promptly; reduce record/logo size if needed.
- Cross-tab changes pause saving to prevent a stale tab overwriting another tab. Export the current tab if needed, then reload.
- Permanent audit deletion requires confirmation. Deleting all app data requires typing `DELETE`; it does not affect other applications' browser data or downloaded backups. The demo is not recreated after deliberate deletion.

## Netlify hosting — enabled, live booking delivery verified

`netlify.toml` configures the build, `dist`, Node 24, SPA routing, same-origin security headers, and `netlify/functions/bridge.ts`. A separate AI Operations host can run this without launching or editing the construction website.

The [AI Operations site](https://ai-operations-assessment.netlify.app/assessment/) is enabled. Live assessment capture, protected inbox delivery, automatic reschedule/cancellation and duplicate replay were verified after correcting the provider response adapter. See [implementation handoff](docs/IMPLEMENTATION-HANDOFF.md).

For subsequent approved deployments:

1. Run all tests and `npm.cmd run build` locally.
2. Run `node scripts/stage-deployment.mjs`, then `node scripts/stage-deployment.mjs --verify <reported-directory>`. Upload only that reported 43-file source directory, including functions, to the `ai-operations-assessment` Netlify site (`b5ad4440-c287-4446-9b46-fb7226035d54`). Do not upload the entire implementation ZIP or workspace: it includes internal documents and may include private local files. Uploading `dist` alone cannot run the booking bridge.
3. Follow `.env.example` and `docs/GHL-BOOKING-WORKFLOW.md`. All ten production settings matched readback, including four keys; bridge and bounded research flags are true. Free-plan standard production variables are explicitly approved and readable by administrators/builds, not public browser variables. No secret values belong in source or handoffs.
4. Verify HTTPS, inbox sessions, real GHL responses, webhook delivery, retry behavior, answer capture, reschedules, and a controlled complete booking at the final host before directing prospects there.
5. Export local sessions and import them at the new domain if needed. A new origin has its own empty browser store.

The assessment and app shell are public assets. Only the hosted inbox is authenticated; local audits remain accessible to users of that browser profile. The new site uses the existing Free plan; production deployments consume 15 credits. No paid upgrade was enabled. The approved three-scope GHL credential passed a real exact-contact search returning HTTP 200. Review remaining team credits before additional deployments.

## Known limitations

- Templates are editable starting points, not AI-written conclusions, verified savings, guarantees, or an electronic-signature system. Legal terms require qualified counsel review before broad commercial use.
- A recommendation must fit the physical one-page preview before the app's print button is enabled. Long custom text, a large logo, or optional internal notes may require shortening. Browser print settings can affect output.
- A proposal uses planned page groups with natural continuation for longer content. Page count can exceed the target after extensive edits; inspect the print preview and shorten or move content as needed.
- No cloud sync of call edits/documents, shared editing, email sending, automatic document delivery, currency conversion, or sales-tax calculation. The hosted inbox is an inbound feed, not an audit backup.
- Payment presets apply to the price at selection time. Recheck the deposit and schedule after changing the price. The app does not charge, invoice, sign, or send anything.
- Local persistence depends on available browser storage and a valid session. Invalid fields and quota failures prevent a new saved copy; fix the field or export your work before leaving.
- Tested browser coverage and generated print artifacts are recorded in `TESTING.md`.

## Assessment and booking connection

The user identified the assessment at `http://127.0.0.1:8765/assessment/`; its original files are preserved. This project includes `/assessment`, with the original six questions plus a seventh about overlapping software subscriptions for the requested 21-point scale. Version `mccann-ai-operations-v2-21` scores 0–21; historical `reconstructed-draft-1` submissions retain their 0–18 result without rescaling. See [the workflow specification](docs/GHL-BOOKING-WORKFLOW.md).

The bridge validates and durably captures the complete assessment, verifies its GHL contact, and confirms success before offering the calendar. A scoped booking webhook retrieves the appointment and prepares one audit packet. **Prepared meetings** authenticates and imports on opening the workspace; a button checks again without polling. **Before the call** shows original answers, business context, and questions. Updates preserve manual edits, cancellations retain the audit, and deleted meetings stay dismissed.

For manual testing/recovery, use **Settings & backup → Meeting file import → Test a prepared meeting file** with the fictional `docs/examples/prepared-meeting.example.json`. Browser integration tests exercise the real bridge handler with fake CRM/storage, without real bookings. Full backups include intake metadata; duplicating an audit removes its booking association.

GHL permissions, Free-plan standard production storage, premium webhook execution up to US$0.01 each (no higher), and bounded website research are approved. The provider appointment-envelope fix is deployed; live packet creation, actual workflow reschedule/cancellation and duplicate replay passed. Public website fetching was not exercised because the test website was blank. Automatic failed-action retry is not configured; bounded manual replay was verified.

## Project files

- `src/domain/`: types, defaults, strict Zod schemas, calculations, guardrails, storage, and document generation.
- `src/pages/`: dashboard, audit worksheet, calculator, recommendation/proposal editor, and settings.
- `src/components/`: shared React Hook Form fields and optional timer.
- `src/useStore.ts`: autosave, restore, storage errors, and cross-tab protection.
- `e2e/`: end-to-end browser and print-layout acceptance checks.
- `DATA_MODEL.md`, `CALCULATION_RULES.md`, `PLAN.md`, `TESTING.md`: implementation and validation notes.

Setup references: [Vite guide](https://vite.dev/guide/) and [Playwright assertions](https://playwright.dev/docs/test-assertions).

At meeting-inbox sign-in, choose **Remember this device for 30 days** on your own computer to reduce repeat key entry. Unchecked sessions last eight hours. Sign out revokes access immediately; existing sessions retain their original expiry until you reconnect. The access key is never saved in local storage.


Client-facing assessment: https://ai-operations-assessment.netlify.app/assessment/ . Use the same neutral Netlify origin for browser-local audit notes; see docs/BRANDED-URL.md.

Phase B deploy unlock
