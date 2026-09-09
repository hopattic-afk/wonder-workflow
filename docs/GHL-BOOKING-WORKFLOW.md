# GHL booking bridge: local implementation and activation runbook

Status: enabled production deploy `6a9ca684ee8155e734a96249` ready at `2026-09-05T23:33:04.694Z`. Appointment-envelope fix passed 47 focused tests, server TypeScript, full build and Sentinel review. Actual assessment capture, packet creation, automatic GHL reschedule/cancellation, duplicate replay and protected inbox access are verified. Hosted authenticated audit UI and actual website fetching remain untested. See [activation record](ACTIVATION-RECORD-2026-09-05.md).

## Verified source and version policy

| Record                   | Value                                                                                                    |
| ------------------------ | -------------------------------------------------------------------------------------------------------- |
| Contracting entity       | McCann Contracting LLC                                                                                   |
| GHL location             | `LcP7OqCtZlq6wPjejmzC`                                                                                   |
| Audit calendar           | Automation Discovery Call — 30 minutes                                                                   |
| Calendar ID              | `8BGlICdRRqD8ujhu0BfU`                                                                                   |
| Verified booking link    | [Automation Discovery Call](https://api.leadconnectorhq.com/widget/bookings/mccann-automation-discovery) |
| Older native intake form | Automation Review Intake — `krdh4y2Zue4jm8NvQoZr`                                                        |

The original assessment was subsequently recovered from the user-identified source served on local port 8765. Its six original questions score 0–3 each, for a maximum of 18. The shared parser preserves this source as legacy version `reconstructed-draft-1`; that historical version identifier does not authorize substituting another task's reconstructed questions.

The current version `mccann-ai-operations-v2-21` retains those six questions and adds the distinct software-overlap question to meet the console's 21-point requirement. `src/domain/assessment.ts` is the single source for questions, answer labels, scoring, validation, and conversion. The server recomputes and validates the score, denominator, tier, question set, and labels. It does not trust a client-supplied total. A legacy 18-point submission retains its original score and maximum as source answer rows; it never fills or rescales the console's 21-point score/tier fields.

The earlier read-only GHL inspection found a recent booking contact with empty custom fields and tags. Booking attribution alone did not establish captured assessment answers. The new assessment endpoint addresses that capture gap only after the configured flow passes a live test. No contact PII is reproduced here.

## Executable routes

| Route                         | Request and result                                                                                                                                                                                                               |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/integration-status` | Public readiness booleans including `acceptingSubmissions`; no secrets or configuration values. A read probe detects unavailable storage. Readiness is not proof that untested CRM credentials or a live workflow work           |
| `POST /api/assessment`        | Same-origin JSON assessment payload plus optional empty `website_confirm` honeypot. Success returns `status: saved`, the original `submission_id`, `contact_saved: true`, opaque `receipt_id`, and the fixed `booking_url` above |
| `POST /api/booking`           | Authenticated Custom Webhook with the exact four-key body below. Re-fetches the canonical GHL appointment and contact. Returns outcome, opaque packet ID, and whether an assessment matched                                      |
| `POST /api/session`           | Same-origin JSON `{ "access_key": "<operator access key>", "remember_device": true }`; creates a 30-day session when explicitly selected, otherwise an eight-hour server-side session and an HttpOnly, Secure, SameSite=Strict `__Host-` cookie                                                                |
| `DELETE /api/session`         | Same-origin logout; revokes the presented session and expires its cookie                                                                                                                                                         |
| `GET /api/inbox`              | Requires session cookie. Returns up to 50 validated packets and an optional signed `next_cursor`. Pass it as `?cursor=...`. Total listing is bounded at 500 records; exceeding capacity requires review                          |

No CORS access is granted. Public intake is capped at 64 KB with a honeypot and durable per-IP, per-email, and global limits; login has a separate attempt limit. Optional phone numbers require an explicit international country code; no country is guessed. Limits are 10 assessment attempts/IP/hour, 5/email/hour, 100 total/day, and 5 login attempts/IP/15 minutes. An exact origin check is an additional browser safeguard, not proof of a submitter's identity. Assessment answers remain unverified client self-report.

## Required server configuration

These settings use explicitly approved Free-plan standard production all-scopes variables. Administrators and builds can read them; Sentinel found no public-bundle/header exposure path. All ten settings matched readback. Earlier function-only writes falsely reported success and are superseded by this verified configuration. Never put keys in `VITE_` variables, browser storage, URLs, exported packets or source control.

| Environment variable             | Requirement                                                                                                                        |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `MCCANN_BRIDGE_ENABLED`          | Exactly `true` to enable; absent/other values disable                                                                              |
| `MCCANN_APP_ORIGIN`              | Exact HTTPS console/assessment origin, no path or trailing slash                                                                   |
| `MCCANN_INBOX_ACCESS_KEY`        | Separately generated high-entropy operator key, at least 32 characters                                                             |
| `MCCANN_SESSION_SECRET`          | Separate random secret, at least 32 characters; signing/hashing session and abuse-control identifiers                              |
| `MCCANN_BOOKING_WEBHOOK_SECRET`  | Separate random secret, at least 32 characters; outbound GHL header authentication                                                 |
| `GHL_PRIVATE_INTEGRATION_TOKEN`  | Server-only sub-account credential with only the scopes below                                                                      |
| `GHL_LOCATION_ID`                | `LcP7OqCtZlq6wPjejmzC`                                                                                                             |
| `GHL_CALENDAR_ID`                | `8BGlICdRRqD8ujhu0BfU`                                                                                                             |
| `GHL_CALENDAR_TIMEZONE`          | Verified IANA calendar timezone; do not infer it from a displayed appointment offset                                               |
| `MCCANN_PUBLIC_RESEARCH_ENABLED` | Optional: exactly `true` enables the bounded public website title/description lookup; otherwise only questionnaire/CRM preparation |

Use `contacts.readonly`, `contacts.write`, and `calendars/events.readonly` for the implemented calls; verify the selected sub-account scopes in the actual token setup. No workflow-write, conversation-send, marketing, or form-write scope is required. The adapter uses `Version: v3`, exact-filter `POST /contacts/search`, `POST /contacts/upsert`, `GET /contacts/:id`, and `GET /calendars/events/appointments/:id`. Email/phone filters travel in a request body, not a URL. [HighLevel scopes](https://marketplace.gohighlevel.com/docs/Authorization/Scopes/), [API versioning](https://marketplace.gohighlevel.com/docs/Versioning/index.html), [Contact search](https://marketplace.gohighlevel.com/docs/ghl/contacts/search-contacts-advanced/index.html), [Appointment lookup](https://marketplace.gohighlevel.com/docs/ghl/calendars/get-appointment/).

The default function runtime uses the site-scoped `mccann-operations-bridge-v1` Netlify Blobs store with strong consistency. Site-scoped data persists between deploys: scope secrets to production and do not enable previews against production data. Conditional writes require a nonempty returned ETag plus matching strong readback content and ETag. The `modified` flag alone is not accepted as durability proof, addressing the reported SDK failure behavior. [Netlify Blobs](https://docs.netlify.com/build/data-and-storage/netlify-blobs/), [SDK issue 741](https://github.com/netlify/primitives/issues/741).

## Assessment capture and identity handling

1. The public assessment submits the exact validated, versioned snake-case payload. Preserve `submission_id` and the complete payload for retries.
2. Store an immutable snapshot before accessing GHL. Reusing an ID with different normalized content returns a conflict.
3. Search exact email and, if supplied, exact normalized phone. Reject multiple results, split email/phone identities, wrong locations, and mismatched canonical contacts.
4. Existing matching contacts are read and associated without overwriting CRM fields. For a new identity, upsert **only email and location** with duplicate creation disabled, then read the canonical contact back. Names, company, assessment answers, and other context remain in the immutable snapshot and prefilled audit; this endpoint does not overwrite CRM names, phone, custom fields, tags, DND, or consent.
5. Persist the verified contact receipt and contact-submission association. Only then, and after any pending booking enrichment is durably stored, return `contact_saved: true` and the booking URL. A snapshot alone or successful CRM response alone is not an acknowledgement.

Email matching is association evidence, not email-ownership verification. A self-reported assessment must still be confirmed during the call. GHL upsert follows account duplicate settings, so the adapter deliberately restricts its write payload and verifies the returned identity. [Upsert behavior](https://marketplace.gohighlevel.com/docs/ghl/contacts/upsert-contact/), [Authorization choices](https://marketplace.gohighlevel.com/docs/Authorization/authorization_doc/).

## Published GHL booking workflow — live delivery verified

[McCann AI Operations — Booking to Audit](https://app.gohighlevel.com/v2/location/LcP7OqCtZlq6wPjejmzC/automation/workflow/85336ddd-7e7a-43f1-bcd5-20b4630c7821) is published. Appointment Status / Normal, contact-only, exact calendar, no status filter, re-entry enabled. POST JSON uses `{{appointment.id}}`, `{{contact.id}}`, fixed location/calendar and secret header. Initial HTTP 400 on the live appointment envelope was corrected. Actual UI reschedule and cancellation now automatically reached the authenticated inbox; duplicate manual replay reused the same packet.

1. Select the verified location and **Appointment Status** trigger, filtered to the calendar above. Enroll **Contact only** to avoid guest duplicates. Cover New and Confirmed states plus cancellation, attendance/no-show, and customer/staff reschedules as separate tested trigger paths where the workflow builder requires them.
2. Do not depend solely on **Customer Booked Appointment**: it excludes staff-created and recurring appointments. Appointment Status supports source filters; exercise the actual calendar's reschedule behavior during the bounded test. [Appointment Status](https://help.gohighlevel.com/support/solutions/articles/155000002619), [Customer Booked Appointment](https://help.gohighlevel.com/support/solutions/articles/155000002675-workflow-trigger-customer-booked-appointment).
3. Add Custom Webhook, method `POST`, destination `https://<approved-origin>/api/booking`, JSON content type. Supply header `X-McCann-Webhook-Secret` from the configured secret. Resolve the exact appointment/contact merge variables through the GHL picker and test their rendered values; do not guess merge-token syntax.
4. Send exactly this body, with actual event IDs substituted:

```json
{
  "appointment_id": "<current appointment ID>",
  "contact_id": "<primary booking contact ID>",
  "location_id": "LcP7OqCtZlq6wPjejmzC",
  "calendar_id": "8BGlICdRRqD8ujhu0BfU"
}
```

The endpoint treats the body as an event hint. It fetches the canonical appointment and contact, checks the exact location/calendar/contact association, validates status and timestamps, and never trusts caller-supplied appointment answers or times. This is a **Custom Webhook shared-secret integration**, not a native signed marketplace webhook. [Custom Webhook configuration](https://help.gohighlevel.com/support/solutions/articles/155000003305/).

Concurrent contact work returns a retryable conflict instead of risking missed associations. Do not assume Custom Webhook automatically retries: configure and verify its failure/retry path, preserve the same four IDs, and document manual replay from workflow logs. There is no application scheduler, background polling, or promise of automatic retry after a failed action. A deleted appointment that can no longer be fetched requires operator review; the bridge does not invent its final state.

## Association, replay, and manual edits

- Audit identity is `(locationId, calendarId, appointmentId)`. Contact ID alone must not collapse multiple appointments. Canonical contact reassignment is a conflict, not an automatic merge.
- Initial association prefers the latest durable receipt received at or before canonical appointment `dateAdded`. If no earlier receipt exists, one later assessment received before the call can fill the gap. Multiple plausible late assessments stay unmatched for review. If GHL omits `dateAdded`, the fallback is the latest receipt before the call start; this is a documented limitation, not an invented booking timestamp.
- Once an assessment is linked, retries, reschedules, and later submissions preserve that snapshot. Later submissions remain separate immutable records; deliberate reassociation needs future explicit review tooling. A previously missing assessment can attach before the call.
- Receipt creation/index/enrichment and booking preparation/index share a durable per-contact lock. Equal replays do not change packet timestamps or rerun research; older canonical events cannot replace newer state. Conflicting payloads with the same canonical timestamp fail closed.
- Reschedules update booking data; cancellation marks the packet without deleting an audit. Local import owns manual-edit protection: changed imported values are proposed as conflicts, while call notes, manually entered financial assumptions, prices, documents, and decisions remain untouched.

## Preparation and honest limits

Every booked draft includes current CRM contact context and tailored questions based on explicit questionnaire responses; a missing assessment remains visibly missing. No labor baseline, employee count, revenue, savings, price, or private operational fact is inferred.

Optional public research performs only a bounded HTTPS title/meta-description lookup. The helper validates public destination IPs and every redirect, pins DNS resolution, and limits time and bytes. It supplies source URL/title and access time; website self-description is not independent verification. It does not call an AI API, search arbitrary private records, or bypass certificate errors. The previously observed `mccanncontracting.co` certificate mismatch was not bypassed.

Research is attempted once per appointment when a website is available; later replays/reschedules reuse prior facts. Fetch, parsing, or isolated research-cache failure leaves a useful audit with no invented facts and an unavailable notice. Essential snapshot, receipt, contact association, or booking writes still fail closed. No automatic research retry is implemented after a persisted unavailable outcome.

Stored records and expired session/rate entries currently have no automated retention purge. Review backup, access, retention, capacity, and provider billing before enabling a public endpoint. Core tests use fake CRM and memory storage; safe-fetch tests inject DNS/network dependencies. Passing them proves local behavior, not a live integration.

## Activation acceptance

Storage, fee and research approvals are resolved. After correcting the initial provider-envelope failure, controlled replay created the matched assessment packet; actual GHL reschedule and cancellation reached that same packet automatically. Original seven scored answers plus context (31 entries), 21/max21, IDs and CRM phone fallback were verified. The test appointment was cancelled to release its slot; TEST-marked contact/data were retained.

Keep the evidence boundary explicit: live API/inbox checks and actual workflow updates passed; hosted authenticated audit UI/manual-note preservation was not browser-tested. Local E2E checks cover that behavior separately. Bounded public research is enabled but fetching was not exercised with the blank test website. No automatic retry is configured; bounded manual replay passed. Broader unexercised lifecycle combinations retain local-test coverage rather than claimed live proof.

The public origin is `https://ai-operations-assessment.netlify.app`; use it for submissions and the operator inbox. The old Netlify hostname reverse-proxies the app only so old-origin local storage can be read and exported. State-changing browser requests through that proxy fail the strict request-origin equality check. The existing GHL webhook is server-to-server and reaches the renamed production site through the restricted legacy proxy documented in [BRANDED-URL.md](BRANDED-URL.md).
