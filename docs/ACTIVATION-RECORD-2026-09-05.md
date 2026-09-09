# Activation record — 2026-09-05

Status: **enabled and deployed; live assessment-to-inbox delivery, actual GHL reschedule/cancellation and duplicate protection verified.** The earlier HTTP 400 provider-envelope failure is resolved. Hosted authenticated audit UI and actual website fetching are outside the live evidence obtained.

Evidence basis: Atlas's current-session verification and explicit user approvals, reported to the documentation owner. No credential values, contact PII, or private submission payloads are retained here.

## Approvals and verified progress

- The user approved necessary GHL work and sharing the complete implementation ZIP. The user subsequently explicitly approved saving the GHL integration key and three security keys to Netlify production functions, and enabling/testing the connection.
- The GHL integration key was created with exactly `contacts.readonly`, `contacts.write`, and `calendars/events.readonly`. A real exact-contact search returned HTTP 200 with zero matches for the fictional test identity. This verifies that bounded read request, not contact creation or the complete funnel.
- Historical incident: Netlify function-only writes reported success but readback was empty. Free-plan standard production all-scopes storage was then explicitly approved; all ten settings now match readback, including the GHL key and three independent security keys. Bridge/research flags are true. Administrators/builds can read these variables; Sentinel found no public-bundle/header exposure path. No secret values are recorded.
- Verified persisted origin: `https://mccann-ai-operations.netlify.app`. Location: `LcP7OqCtZlq6wPjejmzC`. Calendar: `8BGlICdRRqD8ujhu0BfU`, **Automation Discovery Call**. [Booking destination](https://api.leadconnectorhq.com/widget/bookings/mccann-automation-discovery).
- Timezone: **America/Boise**. The account and user scheduling UI showed Boise; the calendar API identified a personal calendar with no calendar-specific timezone override. An appointment offset alone was not used to infer this setting.

## Published GHL workflow — delivery verified after correction

[Open the published workflow](https://app.gohighlevel.com/v2/location/LcP7OqCtZlq6wPjejmzC/automation/workflow/85336ddd-7e7a-43f1-bcd5-20b4630c7821).

| Setting | Saved value |
| --- | --- |
| Workflow | McCann AI Operations — Booking to Audit |
| Workflow ID | `85336ddd-7e7a-43f1-bcd5-20b4630c7821` |
| Trigger | Appointment Status |
| Event type | Normal |
| Enrollment | Contact only |
| Calendar filter | Exact calendar `8BGlICdRRqD8ujhu0BfU` |
| Status filter | None |
| Re-entry | Enabled |
| Action | Custom Webhook, `CUSTOM` / `POST` |
| Content type | `application/json` |
| Destination | `https://mccann-ai-operations.netlify.app/api/booking` |
| Authentication | Shared secret in `X-McCann-Webhook-Secret` header; value omitted |

Saved four-key JSON body:

```json
{
  "appointment_id": "{{appointment.id}}",
  "contact_id": "{{contact.id}}",
  "location_id": "LcP7OqCtZlq6wPjejmzC",
  "calendar_id": "8BGlICdRRqD8ujhu0BfU"
}
```

Publication switch state 1 persisted after reload. The initial webhook failed HTTP 400 because the adapter expected an event envelope while GHL returned an appointment envelope. After the deployed correction, bounded replay returned 200 created/assessment_matched true. Actual GHL UI reschedule produced workflow Executed at 17:35 MDT; subsequent UI cancellation automatically reached the same inbox packet. Manual duplicate replay returned 200 duplicate.

## Shared artifact and newer local correction

- The reviewed implementation ZIP was successfully shared to the approved private project Slack channel `C0C0PF51W00`: [mccann-ai-operations-implementation-2026-09-05-reviewed.zip](https://agents-wby7363.slack.com/files/U0BSQM2UM6Z/F0C0PGX87BJ/mccann-ai-operations-implementation-2026-09-05-reviewed.zip), file ID `F0C0PGX87BJ`.
- That ZIP is a **historical version from before the latest fix**, not an assertion that it contains every subsequent correction.
- The latest server correction preserves known CRM phone and website values when the corresponding assessment fields are blank. Its 37 focused tests passed, Sentinel reviewed it, and the fresh build passed.
- Latest production deploy `6a9ca684ee8155e734a96249` ready at `2026-09-05T23:33:04.694Z`: 43 files, 521,675 bytes; SHA-256 `cc47ff8d23b9864fe5360aea6bec95c0bbe3b7c192cf6f4d53a685cadfc8b363`. The appointment-envelope correction is deployed. Earlier deploy `6a9ca32c22ead77fb81b339d` exposed the now-corrected HTTP 400 failure.

## Resolved approvals and remaining proof

1. The user explicitly approved Free-plan standard production storage and premium Custom Webhook execution up to **US$0.01 per execution, no higher**.
2. Bounded public website research was explicitly approved and its enable flag is true.
3. Live assessment saved **21/21**. Booking initially confirmed September 7 at 09:00 MDT, then was rescheduled in the GHL UI to **09:30 MDT**, preserving confirmed status. Inbox readback contained one packet, same IDs, America/Boise time, seven scored answers plus context (31 entries), 21/max21 and known CRM phone fallback. The appointment was then cancelled through the UI, releasing the slot; TEST-marked contact/data are retained.
4. Authenticated inbox contained the matched packet and automatically received cancellation. Login returned 200 with Secure/HttpOnly/SameSite=Strict cookie; logout revoked the session and subsequent access returned 401. Hosted unauthenticated meetings UI was checked; hosted authenticated prefill/manual-note preservation was not. Local E2E passed 7/7 in 43.4 seconds using fake CRM and the real handler.
5. Research is enabled, but the test website was blank so no actual website fetch is proven. No automatic failed-action retry is configured; bounded manual replay was verified. Intended updated artifact: `mccann-ai-operations-implementation-2026-09-05-activated.zip`, not yet sent. The earlier reviewed ZIP remains historical.

Operational details remain in [GHL-BOOKING-WORKFLOW.md](GHL-BOOKING-WORKFLOW.md). The [implementation handoff](IMPLEMENTATION-HANDOFF.md) describes operator usage; its earlier credential/approval status is historical where this record explicitly updates it.

## Approved 30-day device option — published September 6 UTC

Production deploy `6a9cb061b9b1126401238e1d` verified ready at `2026-09-06T00:15:08.435Z`. Reviewed 43-file source stage SHA-256 `a34870543a5ddc26f841335eb164a1674428b6b38655d3bb78ae5fbef2460f1f`. Optional strict boolean `remember_device` selects 30 days; omitted/false remains eight hours. Existing sessions are unchanged. Sign-out revokes either duration.

59 focused tests, production build, matching browser flow and independent Sentinel review passed. Separate live test session: POST login 200, expiry 30 days, Max-Age 2592000, Secure/HttpOnly/SameSite=Strict, inbox 200, logout 200, revoked-cookie inbox 401. The user's browser session was not changed. The production HTML-referenced App-DMciakjM.js asset returned JavaScript and contained the checkbox and request flag. Refresh and reconnect once with the option selected to opt in.

[Verified Slack update](https://agents-wby7363.slack.com/archives/C0C0PF51W00/p1788653806172689). Earlier ZIP remains the immutable pre-edit version.
