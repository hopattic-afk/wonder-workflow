# Embedded booking — historical launch candidate, September 8

Superseded by [live launch verification](WONDER-WORKFLOW-LIVE-LAUNCH-2026-09-08.md). The domain, deployment, public email and calendar branding below have since been completed; retain this document as the pre-cutover test record.

Implemented in src/pages/Assessment.tsx and assessment.css: score/result only after validated durable save acknowledgment; inline HighLevel calendar; no outbound booking CTA; no preview-only mode or labels; reload-calendar control; retained answers and a retry message on unavailable save service. No answers or email placed in iframe URL. Visitor is prompted to reuse assessment email. Existing idempotency and acknowledgment checks remain intact.

netlify.toml now allows frame-src https://api.leadconnectorhq.com while retaining the existing other security policies. No general third-party script permission added. HighLevel documents calendar embedding: https://help.gohighlevel.com/support/solutions/articles/48000982201-embedding-highlevel-calendars-using-html-code

Verified: production build;3 browser tests covering unavailable-service recovery, keyboard/backtracking/mobile assessment, and simulated durable save -> embedded calendar -> booking webhook -> protected inbox -> audit. Embedded fixture verifies layout/reload/route continuity, not third-party internals. Separately loaded the actual public calendar inside an iframe and observed available times without booking. Screenshot: output/wonder-workflow/qa/live-calendar-embed.png.

Local4174 is Vite static preview and serves HTML at /api/integration-status; it has no Netlify Function runtime. It therefore cannot accept real submissions. The old hosted backend at https://ai-operations-assessment.netlify.app/api/integration-status returned200 with acceptingSubmissions,assessment_ready,booking_ready,inbox_ready=true. Signed-out inbox returned401. Readiness flags are not a full credential/booking-delivery validation.

## Required live cutover

- Keep existing Netlify site b5ad4440-c287-4446-9b46-fb7226035d54 and its durable data/secrets. Publish reviewed stage only; do not upload full workspace.
- Configure wonderworkflow.com domain/TLS and exact allowed app origins. Preserve historical webhook proxy and legacy audit-data recovery. Existing config supports primary plus one alias; reconcile rather than discard existing recovery needs.
- In existing GHL subaccount, rename current calendar display to Workflow Fit Review; description: A complimentary30-minute conversation to discuss your operations assessment, choose one workflow to improve, and agree on a practical next step. Use brand violet #56438a where calendar customization supports it. Keep calendar/location IDs and booking slug stable unless intentionally migrated. Current actual iframe still shows Automation Discovery Call with blue styling.
- Confirm public business email and retention/deletion procedure; finish Privacy contact route. Owner previously said they were obtaining an email; none yet supplied in this task.
- After approved release, test one controlled assessment and real appointment; verify same-contact match, durable receipt, confirmation, webhook/inbox and prepared audit. Audit optional CRM enrichment/opportunity automation separately; basic readiness does not prove those configured.

No deployment, DNS, secret, GHL configuration, contact creation or appointment submission performed this turn. Project instructions require approval for deployment/live configuration changes.

Stage: .netlify/staging/release-019c7498-69d3-4b13-9b18-78b2f1d20f59 (53files)
Manifest digest:7e84c1c2397a65ae6dd7cff66ee2a252e324ea4731d661ab85c19a978ff9dc69
