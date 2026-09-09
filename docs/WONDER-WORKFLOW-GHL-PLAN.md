# Wonder & Workflow: assessment, booking and release plan

September 8 strategy update: the approved public entry offer is **Workflow Fit Review — complimentary, 30 minutes**. Apply this name to the retained calendar, confirmations, and follow-up during approved live configuration work. No GHL settings changed in this copy revision. The /start page explains the assessment → scheduling → next-step note path.

Status: read-only architecture audit, September 7, 2026. No production changes, CRM writes, bookings, messages or credential changes performed.

Update: the CRM adapter, disabled-by-default production hook, separate saved/sync acknowledgment, and authenticated operator status notice are implemented locally. No deployment or live integration behavior changed.

## Verified now

- Netlify connector confirms site `b5ad4440-c287-4446-9b46-fb7226035d54`, named `ai-operations-assessment`, current ready deploy `6a9ce1c63e84f6bec8f8186e`. Its configured primary URL still displays `https://ai.mccanncontracting.co`.
- Public booking page renders **Automation Discovery Call**, 30 minutes, with the existing description about reviewing one manual process. Selecting September 8 exposes 09:00–14:30 slots in the viewer's America/Edmonton timezone. This verifies calendar availability UI, not a completed booking.
- Keep GHL location `LcP7OqCtZlq6wPjejmzC` and calendar `8BGlICdRRqD8ujhu0BfU`. Current link: `https://api.leadconnectorhq.com/widget/bookings/mccann-automation-discovery`.
- Current source uses React/Vite, Netlify Functions, Netlify Blobs, and a protected operator inbox. Assessment definitions, validation and score computation share `src/domain/assessment.ts`; seven questions score 0–21. The server validates and recomputes totals.
- `server/ghl.ts` only creates/associates email identity. Assessment names, company, answers, score and campaign tags are saved in Netlify submission snapshots and prepared meeting packets; this code does **not** map them to GHL fields, tags or opportunities.
- The GHL connector returned authenticated data but did not expose the requested configuration: `calendars` returned empty groups, `custom fields` routed to contacts, `pipelines` routed to opportunities, and `workflows` routed to conversations. Browser fallback subsequently verified the configuration below without sign-in or edits.
- Authenticated browser confirms the retained location is **McCann Contracting, West Jordan, Utah**. Workflow `85336ddd-7e7a-43f1-bcd5-20b4630c7821` is **McCann AI Operations — Booking to Audit**, published (switch value 1), with one **Prepare audit from verified booking** action. The secret-bearing action editor was not opened.
- Calendar settings show exactly one calendar: **Automation Discovery Call**, ID `8BGlICdRRqD8ujhu0BfU`, **Active**, **Personal**, **30 min**. There is no need to create another calendar.
- Custom fields show 17 Contact fields. Two relevant existing multiline fields in **Form | Automation Review Intake** are `lZUonSLMHYvF5JLOdHVh` (most repetitive/frustrating process) and `R8nv78rWnxzINeJzxsbJ` (current software/subscriptions). Existing values must not be overwritten silently.
- Public readiness endpoint could not be refreshed: PowerShell HTTPS returned SSL failures and browser navigation returned `ERR_BLOCKED_BY_CLIENT`. No certificate bypass was attempted. This is not evidence of a production outage.

## Preservation requirements

- Reuse the existing Netlify site for the new domain where practical; Blobs are site-associated. A fresh project is not a complete migration of submissions, meeting packets or configuration.
- Keep `/api/booking` reachable through the existing `mccann-ai-operations.netlify.app` compatibility proxy. Repository activation records identify published workflow `85336ddd-7e7a-43f1-bcd5-20b4630c7821` pointing there; current published state is confirmed, but the secret-bearing webhook editor was not re-read.
- Preserve environment names, webhook header `X-McCann-Webhook-Secret`, cookie contract and storage key `mccann-ai-operations-audit:v1`. These are implementation contracts, not customer branding.
- Keep existing `/audit/:id/:view`, `/meetings` and `/settings` routes and provide an explicit internal dashboard route if `/` becomes the marketing home. Update internal dashboard links accordingly.
- Browser notes and cookies are origin-specific. Keep prior-origin export/recovery usable; do not blanket-redirect old internal routes. Domain changes require deliberate export/import and fresh operator sign-in.
- Preserve assessment version/source compatibility when rebranding payload labels. Existing immutable snapshots must still parse. Do not blindly replace `mccann` across the repository.
- Maintain retry idempotency, exact identity checks, ambiguous-contact failures, known-phone/website preservation and manual-note preservation.
- `scripts/stage-deployment.mjs` uploads an explicit allowlist. Add each new page, CSS, logo, font and video; do not upload the repository wholesale or include private docs/output bundles.

## Focused implementation slices

1. **Website and assessment shell:** public pages, approved logo/video, branded `/assessment`, `/book` CTA and internal route preservation. Reduced-motion bypass, skip control and static poster must work if playback fails. Use the existing calendar link until an approved slug change has been saved and verified.
2. **Attribution continuity:** carry the allowlisted UTM values from landing pages through internal assessment navigation. Current assessment reads only its own URL and copies those values into both first/last touch. Do not claim cross-session attribution; do not place contact details in URLs.
3. **CRM enrichment:** inspect exact GHL field schemas and pipeline stages through an authenticated settings UI or suitable API. Implement against verified IDs, with an explicit enable flag and bounded retries. Keep immutable assessment snapshots as the source record. Native GHL custom fields are a convenience view, not the sole audit record.
4. **Domain and live workflow cutover:** after approval, attach `wonderworkflow.com`, choose apex as canonical and redirect www, configure the exact allowed application origin, keep the neutral/internal origin and legacy webhook path, verify TLS and all five API routes. Do not alter mail DNS.

## Proposed GHL mapping for approval

These are proposed labels except for the verified legacy context fields listed above. Reuse matching fields where semantics/types agree; do not rename unrelated fields. Score, version, UTM and submission field IDs still require creation/readback or an exact matching existing schema before implementation is enabled.

| Assessment value | GHL destination | Preservation rule |
| --- | --- | --- |
| Email | Existing contact identity | Exact normalized match; fail on ambiguous association |
| Name, phone, company, website | Submitted context fields or reviewed native contact fields | Never overwrite trusted populated identity fields from anonymous input; blanks never clear known values |
| Submission ID, version, submitted timestamp | W&W Assessment ID / Version / Submitted At | Latest convenience view plus immutable submission history |
| Score, maximum, tier | W&W Assessment Score / Maximum / Tier | Server computed; retain 18-point legacy denominator where applicable |
| Seven answers and context | W&W Assessment Summary, multiline | Self-reported labels and answers; no HTML or credentials |
| Priority, team size, industry, tools | Matching typed W&W context fields | Existing select values only after schema verification |
| Five allowed UTM values | W&W Campaign Source / Medium / Campaign / Content / Term | Keep first/last meaning explicit; never overwrite unrelated attribution silently |
| Saved assessment | Tag `ww-assessment-completed` | Add only after durable save and CRM synchronization; preserve all existing tags and DND |
| Confirmed appointment in the retained calendar | Tag `ww-consultation-booked` | No marketing/SMS enrollment |

Reuse existing **AI Automation Consulting**, pipeline ID `81BVnkr0QMiJikb0qL7q`; proposed display rename **Wonder & Workflow — AI Operations** requires live-change approval. Do not create a duplicate pipeline or touch the five unrelated Week 1–Week 5 pipelines.

| Existing stage | Verified ID | Automatic mapping |
| --- | --- | --- |
| New Lead | `aeae6ef8-4306-4a33-a25a-9aa4f0237545` | Successfully synchronized assessment, if no existing open opportunity |
| Contacted | `681993d9-de5d-45d7-96bb-ace8e8fe8d3a` | Operator-controlled |
| Discovery Booked | `2137509a-c0d2-4367-bad0-3d44a9e18dbe` | Confirmed appointment in exact retained calendar |
| Proposal Sent | `2bdbfbc1-1915-4b0d-ad76-f84c340eaf30` | Operator-controlled |
| Pilot Won - Onboarding | `558476c8-41c8-486b-8b04-25c4b5178506` | Operator-controlled |
| Pilot In Progress | `2847ee4c-bcff-4645-86fb-1eef8e1b91e5` | Operator-controlled |
| Results Review | `cbb6fb85-e097-4bf0-9d8c-72b1842d6ffe` | Operator-controlled |
| Case Study Complete | `f5ee376a-081d-4e36-a5bc-8863aaf9c3d4` | Operator-controlled; no automatic publication |

Won/lost are intentional operator decisions. One open opportunity per contact in this pipeline; repeated submissions update context without duplicating or moving an advanced deal backward. Reschedules retain the opportunity; cancellations require review rather than auto-marking lost. Keep monetary value unset until an agreed proposal exists. Existing stage probabilities are configuration estimates and must not become website performance claims.

Native workflow option: create/update the scoped opportunity after the assessment-completed tag, and move it only on verified appointments in calendar `8BGlICdRRqD8ujhu0BfU`. Before enabling any trigger, inspect current workflows for broad contact/tag enrollment and unintended outbound messages. Do not increase integration scopes without separate approval.

## Verification and final approval boundary

- Local: build/typecheck; existing assessment, server bridge and storage tests; deployment allowlist tests; browser assessment navigation, duplicate retries, mobile/keyboard/reduced motion; internal export/import and prepared meeting preservation. Sentinel reviews meaningful implementation slices.
- After launch approval: readiness returns accepting true on the new origin; signed-out inbox rejects access; form submits with one clearly marked test identity approved by the user; same submission retry yields the same receipt/contact; mapped fields and tags match; one opportunity exists in the intended stage.
- Use the same email for assessment and calendar booking, since association depends on canonical GHL contact identity. Verify actual appointment → webhook execution → one prepared packet, then reschedule/cancellation behavior and operator manual-note preservation.
- A readiness response or visible calendar alone does not prove the full funnel. The launch is incomplete until the new-domain flow is tested through GHL and the operator inbox.
- Final approval must cover production deployment/domain DNS, exact live GHL field/workflow/calendar branding changes, and the bounded test submission/appointment plus any resulting confirmation messages or paid webhook executions. Do not create an appointment or send messages under a read-only check.

## Implemented adapter and production hook

- Files: `server/crmSync.ts`, `server/bridge.ts`, `netlify/functions/bridge.ts`, `src/useMeetingInbox.ts`, `src/pages/Meetings.tsx`, focused tests, and `.env.example`. `AssessmentCrmSync` receives explicit config, the existing durable store and an injectable fetch implementation. Null config or `enabled: false` performs no adapter storage/network operations. No actual environment settings, scopes or credentials were changed.
- `sync({ contactId, submissionId })` accepts identifiers only. It loads the bridge's `submissions/<sha256(id)>` and `receipts/<sha256(id)>`, revalidates the submission, hash, server receipt timestamp and contact association, then verifies the canonical contact again through GHL.
- Initial activation requires **two reviewed, dedicated multiline contact fields** for first and latest assessment JSON, and confirmation of their 16,000-character capacity. IDs are intentionally absent from production config; test IDs are synthetic fixtures. Existing legacy context fields remain untouched. Additional native score/UTM fields in the earlier table are a future convenience mapping, not implemented by this adapter.
- Each field holds a complete assessment snapshot: submitted context, canonical score/denominator, answers, version, consent and attribution together. First means first successfully synchronized assessment; latest means latest synchronized assessment by server receipt time. These do not claim first-ever visitor attribution. Older receipts cannot overwrite newer state; tied timestamps require review. A new assessment without campaign values retains an empty attribution object in its latest snapshot rather than inheriting stale campaign values.
- The adapter writes only dedicated custom fields and optionally adds `ww-assessment-completed` with the separate additive-tag endpoint. It never writes names, phone, website, company, source, native attribution, DND, consent, followers or a replacement tags array. Unexpected existing mapped values stop the operation. Field values and tag presence are verified by contact readback.
- A CAS-protected `crm-sync/<sha256(contactId)>` journal serializes adapter instances. Completed duplicate submissions cause no provider calls. Any interrupted/uncertain operation leaves `pending`; automatic replay and later submissions stop with a fixed review reason. The journal intentionally has no expiry-based takeover because a timed-out provider request might still finish. Never clear a pending journal blindly: an operator must compare the immutable receipt, intended field values and current CRM state after the original request has settled, then explicitly reconcile. No automated reconciliation mutation is included.
- Dedicated first/latest fields must remain integration-owned while enabled. The API does not document conditional custom-field writes, so simultaneous human or other-integration edits cannot be protected atomically; readback can detect divergence but cannot reverse an overwrite safely. This limitation must be accepted or resolved before activation.
- Implemented hook: optional `BridgeDependencies.crmSync(input, signal)` receives durable receipt IDs **after** `immutable(receiptKey)` and `immutable(contact-submissions/...)` and after the verified-contact locks are released. The public acknowledgment remains `status: saved` when enrichment fails, with separate `crm_sync.status`. Provider errors and private payloads are never returned. Missing hook reports disabled and adds no synchronization storage activity.
- Networking has one shared abort budget of at most four seconds; the bridge reduces that budget to leave room beneath the form's 15-second timeout and skips the hook for operator review if capture already consumed the available budget. The adapter checks the same signal before subsequent writes. Work is awaited rather than detached; there is no `Promise.race`, scheduled job or automatic background retry. Durable store operations do not expose abort signals, so this bounds added network time, not a hard guarantee on an impaired storage service's response time.
- A separate `crm-sync-status/<sha256(submissionId)>` record is claimed before invoking the hook. An existing completed record returns duplicate without replaying provider writes; pending/review records do not automatically replay. Failure to store this status prevents enrichment, while the durable assessment remains saved. The authenticated inbox lists at most 500 status keys and reads at most 25 records in batches of six. Sampled counts are explicitly marked truncated, and Prepared meetings states that additional records need review. Larger or unreadable status collections report unavailable/review without blocking meeting imports. Public readiness does not expose these counts.

### Activation settings

All settings are examples only; none were written to a live environment. The existing approved GHL token is reused server-side, with no additional permissions implied.

| Setting | Required value to activate |
| --- | --- |
| `WW_CRM_SYNC_ENABLED` | Exactly `true` |
| `WW_CRM_FIRST_ASSESSMENT_FIELD_ID` | Verified dedicated multiline field ID |
| `WW_CRM_LATEST_ASSESSMENT_FIELD_ID` | A different verified dedicated multiline field ID |
| `WW_CRM_FIELDS_VERIFIED` | Exactly `true`, after schema/capacity verification |
| `WW_CRM_ASSESSMENT_TAG_ENABLED` | Defaults false; exactly `true` opts into adding the tag |
| `WW_CRM_TAG_WORKFLOWS_REVIEWED` | Exactly `true` whenever tag addition is enabled |

Missing/invalid IDs, missing verification, identical field IDs, an unexpected location, or an unreviewed enabled tag keep the runtime hook **off**. A ready assessment bridge does not imply CRM enrichment is enabled. Remaining activation work is verified fields/settings, native opportunity workflow configuration, approval, deployment and actual readback/full-funnel proof.

### Deliberate reconciliation runbook

1. Open Prepared meetings and check the separate CRM enrichment notice. A pending/review count does not mean an assessment was lost; do not ask the visitor to send the form again.
2. Using approved operator access, identify the status record and its immutable receipt, then the matching `crm-sync/<contact hash>` journal. Preserve these records as evidence. No new request should run while the original provider request might still settle.
3. Read the exact GHL contact and compare location/email, both dedicated field values, expected tag, existing consent/DND and unrelated fields against the journal and receipt. Do not print secrets or copy raw assessment payloads into logs/messages.
4. If the exact intended state is already present, approve a bounded compare-and-swap completion update to the adapter journal and status record. If no adapter journal exists because the hook never started, approve one explicit bounded adapter invocation against the existing immutable receipt. A partial write or conflicting operator edit requires a reviewed repair of that exact state; do not clear locks or overwrite values blindly.
5. Re-read both CRM state and the persisted completion record, then refresh Prepared meetings. Mark synchronized only after both agree. Reconciliation writes are intentionally manual and approval-gated; this release does not provide an automatic replay or a destructive reset button.

## Opportunity synchronization boundary

`assessOpportunitySync` is a pure policy function using the verified existing pipeline/stage IDs. Input must be a complete, scoped opportunity set for the verified contact and an explicit assessment-received/consultation-booked target. It preserves closed opportunities and same/advanced stages, and requires review for duplicates, unknown stages, incomplete scope, creation or forward movement.

There are **no opportunity API writes** in this slice. Search-then-create cannot prove uniqueness against parallel native GHL/manual writers. A read followed by a stage PUT cannot prevent a race with an operator advancing or closing a deal. Current official upsert documentation does not establish a suitable idempotency/conditional-update contract, and existing recorded credentials did not include opportunity scopes. Native workflow configuration with duplicate creation disabled and backward movement disabled is the proposed activation route; it still requires inspecting actual workflow semantics and running the bounded full-funnel test. Adding an assessment tag must not be enabled until all affected tag triggers and outbound effects have been reviewed.

Official endpoint references checked September 7, 2026:

- [Update Contact](https://marketplace.gohighlevel.com/docs/ghl/contacts/update-contact/): `PUT /contacts/:contactId`, v3, custom field entries use `id` and `fieldValue`; supplying `tags` replaces current tags, which this adapter deliberately avoids.
- [Get Contact](https://marketplace.gohighlevel.com/docs/ghl/contacts/get-contact/): canonical identity and mutation readback.
- [Add Tags](https://marketplace.gohighlevel.com/docs/ghl/contacts/add-tags/): `POST /contacts/:contactId/tags` with a tags array.
- [Search Opportunity](https://marketplace.gohighlevel.com/docs/ghl/opportunities/search-opportunity/) and [Upsert Opportunity](https://marketplace.gohighlevel.com/docs/ghl/opportunities/upsert-opportunity/index.html): insufficient documented atomicity for safe automatic create/advance in this slice.
- [Native Create Opportunity](https://help.gohighlevel.com/support/solutions/articles/155000004752-workflow-action-create-opportunity) and [Native Update Opportunity](https://help.gohighlevel.com/support/solutions/articles/155000004753): candidate workflow controls for duplicates and backward stage movement.

Validation: `npm.cmd test -- server/crmSync.test.ts server/bridge.test.ts src/useMeetingInbox.test.tsx src/pages/Meetings.test.tsx` passed **90 tests**. `npm.cmd run check` passed after the summary bound. Coverage includes off-by-default runtime settings, post-receipt invocation, no duplicate replay, saved acknowledgment despite enrichment failure, authenticated/sanitized aggregate status, bounded sampling, operator notice, shared abort propagation and awaited termination. The initial sandbox invocation hit Windows `spawn EPERM`; focused checks used the approved elevated execution path. No live CRM API calls were made by the test suite. Independent Sentinel review and live activation proof remain required.
