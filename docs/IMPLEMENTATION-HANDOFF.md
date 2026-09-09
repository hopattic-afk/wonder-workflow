# McCann AI Operations — implementation handoff

Prepared 2026-09-05. The [production site](https://ai-operations-assessment.netlify.app) is enabled. Live assessment capture, packet creation, actual GHL reschedule/cancellation delivery, duplicate protection and authenticated inbox access are verified. The initial provider-envelope failure was corrected and deployed. Hosted authenticated audit UI was not tested; use the operator steps below.

## Destinations

| Destination | Exact identity |
| --- | --- |
| Public assessment (enabled) | [Assessment](https://ai-operations-assessment.netlify.app/assessment/) |
| Audit workspace | [Audit console](https://ai-operations-assessment.netlify.app/) |
| Netlify project dashboard | [ai-operations-assessment](https://app.netlify.com/projects/ai-operations-assessment/overview) |
| Netlify site ID | `b5ad4440-c287-4446-9b46-fb7226035d54` |
| Approved private project Slack channel | `C0C0PF51W00` — Atlas-only sanitized reporting |
| GHL location | `LcP7OqCtZlq6wPjejmzC` — McCann Contracting |
| GHL calendar | `8BGlICdRRqD8ujhu0BfU` — Automation Discovery Call, 30 minutes |
| Verified booking destination | [Book the call](https://api.leadconnectorhq.com/widget/bookings/mccann-automation-discovery) |
| Contracting entity | McCann Contracting LLC |

The public offer is a **free 30-minute AI Operations Audit of one recurring workflow**. The questionnaire supplies context for the consultant; it does not independently identify a guaranteed best opportunity or savings. The construction website is separate.

## Setup order

The implementation ZIP includes source, tests, and internal documentation. Do not upload the entire ZIP as a public static site. For source uploads, run `node scripts/stage-deployment.mjs` from the extracted project, then upload only its reported 43-file staging directory using the approved hosting tool. This excludes internal handoff documents, campaign assets, and configuration templates from the deployment upload.

1. Latest production deploy `6a9ca684ee8155e734a96249` ready at `2026-09-05T23:33:04.694Z`: 43 files, 521,675 bytes; SHA-256 `cc47ff8d23b9864fe5360aea6bec95c0bbe3b7c192cf6f4d53a685cadfc8b363`. The appointment-envelope correction is deployed. Earlier deploy `6a9ca32c22ead77fb81b339d` exposed the now-corrected HTTP 400 failure.
2. **Configuration approved and verified.** Exactly three GHL scopes: `contacts.readonly`, `contacts.write`, `calendars/events.readonly`; exact-contact search returned 200. All ten Netlify settings matched readback, including four keys; bridge/research flags true. Free-plan standard production all-scopes variables are explicitly approved; administrators/builds can read them, but Sentinel found no public bundle/header exposure path. Timezone America/Boise.
3. **Separate approvals resolved.** The user approved premium Custom Webhook execution up to US$0.01 each, no higher, and bounded public website research. The earlier storage/fee/research gates are resolved. No secret values are included here.
4. **Published workflow delivery verified.** [McCann AI Operations — Booking to Audit](https://app.gohighlevel.com/v2/location/LcP7OqCtZlq6wPjejmzC/automation/workflow/85336ddd-7e7a-43f1-bcd5-20b4630c7821) automatically delivered the actual UI reschedule and subsequent cancellation after the appointment-envelope fix. The historical HTTP 400 failure is resolved.
5. **Controlled test complete at the API/inbox level.** A bounded replay returned 200 created/assessment_matched true. Rescheduling September 7 from 09:00 to 09:30 MDT retained confirmed status and produced actual workflow Executed at 17:35 MDT. Inbox contained one packet with the same IDs, original answers and updated time. Cancellation then arrived automatically; duplicate replay returned 200 duplicate. The test appointment is cancelled, releasing the slot; TEST-marked contact/data are retained.
6. **Open your prepared meetings.** Open the [Netlify project](https://app.netlify.com/projects/ai-operations-assessment/overview) → **Project configuration → Environment variables → MCCANN_INBOX_ACCESS_KEY** → reveal/copy the production value privately. Open [Prepared meetings](https://ai-operations-assessment.netlify.app/meetings), paste it into Meeting inbox access key, choose **Connect meetings**, then **Open audit**. Never paste the key into Slack. Export/import existing local audits when changing origins.

## What “automatic audit preparation” means

Once configured, the server captures the assessment and verified booking into a prepared packet. When you **open the internal workspace with a valid inbox session**, the app checks the protected inbox and imports new/updated booked calls into that browser. Signing in also triggers a check. **Check for meetings** refreshes manually; there is no background polling or app work while the browser is closed.

Open **Prepared meetings → the audit → Before the call** for original answers, business context, and useful follow-up questions. Imported values fill allowed fields while protecting manual edits; conflicts remain visible. Cancellation retains the audit, and deliberately deleted meetings remain dismissed. Missing financial baselines, exact headcount, pricing, and unreported facts stay blank. Optional public website context is source-linked and is not independently verified business performance.

Call notes, financial assumptions, recommendation/proposal edits, and local decisions remain in that browser. They are not uploaded to GHL or backed up by the inbox. Use **Settings & backup → Export all data** regularly. Different domains/browser profiles have separate local stores. Only the hosted inbox is authenticated; this is not cloud collaboration or a full app-login system.

## Completed locally and remaining scope

- Audit worksheet, calculator, editable recommendation/proposal, backups, assessment capture contract, booking bridge, prepared-meeting import, and safeguards are implemented locally.
- Prior local validation reported 231 automated tests plus 7 browser tests. The current focused checks reported 17 assessment tests plus 5 stage tests; fresh TypeScript/build checks passed. These are separate reported runs, not additive unique-test counts or live proof. Sentinel reviewed the implementation; see [TESTING.md](../TESTING.md) for recorded evidence.
- Business context and latest campaign assets are consolidated in [BUSINESS-CONTEXT.md](context/BUSINESS-CONTEXT.md) and `context/assets/social-v2/`, with SHA-256 provenance in [SOURCE-MANIFEST.json](context/SOURCE-MANIFEST.json). The original ChatGPT project remains intact: this is context/file consolidation, not a project-container merge.
- Full GHL sales-pipeline stages, opportunity transitions, tags, and per-answer CRM custom-field writes remain outside the current bridge. Full answers are preserved in assessment storage and the audit; do not describe this as completion of every historical CRM-repair request.
- The [reviewed implementation ZIP](https://agents-wby7363.slack.com/files/U0BSQM2UM6Z/F0C0PGX87BJ/mccann-ai-operations-implementation-2026-09-05-reviewed.zip), file `F0C0PGX87BJ`, was shared after explicit payload approval. It predates the latest blank-CRM fix.
- Verification limits: hosted unauthenticated meetings UI was checked; hosted authenticated prefill/manual-note preservation was not. Local E2E passed 7/7 in 43.4 seconds using fake CRM and the real handler. Research is enabled but actual fetching was not tested because the website was blank. No automatic failed-action retry is configured; manual bounded replay passed. Login 200/cookie Secure+HttpOnly+SameSite=Strict and logout revocation/401 passed. See [activation record](ACTIVATION-RECORD-2026-09-05.md).

## Historical initial deployment evidence

- Netlify verified deploy `6a9c9667c0e6da0e9a6b597e` is ready, published, production, and was the initial deployment; Node 24 bridge function packaged successfully.
- Published 2026-09-05 at 22:23:59 UTC; remote build completed without a reported error.
- Reviewed upload: 43 explicit source files, 521,518 bytes; source manifest digest `77e3cff6ef353369737843d9921112936bc91df8e58f94ca9f42d6b40a423b43`.
- At that initial deployment, live browser verified seven questions, free 30-minute audit offer, and preview disclosure. The later enabled deployment and live failure are recorded above.
- Uses the existing Netlify Free plan. Production deployments consume 15 credits; no paid upgrade enabled. Remaining team credits were not exposed by the connector.

## Remember this device

At sign-in, optionally select **Remember this device for 30 days** on your own computer. Leave it unchecked for the existing eight-hour connection. The access key is not stored in browser storage; the server and secure cookie enforce the selected fixed expiry. Sign out revokes that session immediately. Existing sessions keep their original expiry: to opt in, sign out and reconnect once with the checkbox selected.

Subsequent hosted-browser verification after the operator connected confirmed the imported audit, all seven original answers, 21/21 score, business context and suggested questions. Manual-note preservation remains covered by the local browser tests.

## Branded assessment address

The public client link is `https://ai-operations-assessment.netlify.app/assessment/`. `MCCANN_APP_ORIGIN` permits this exact HTTPS host. Use the neutral host for submissions, the protected inbox and new audits. The old Netlify project is a two-rule compatibility site: `/api/booking` proxies to the new host for the existing GHL action, while other paths reverse-proxy the app so old-origin local storage can still be read and exported. Use that old host only for local note recovery/export; state-changing browser requests through it fail the strict origin check.

Keep using the existing Netlify audit workspace for saved call notes. The new subdomain is a separate browser origin: sign-in cookies and local audit notes do not transfer automatically. If deliberately moving the internal workspace, export a backup from the old address, import it at the new one, and sign in there. The GHL webhook remains at its existing authenticated URL.
