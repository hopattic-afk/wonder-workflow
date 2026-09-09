# Wonder & Workflow GHL rebuild handoff — 2026-09-09

## Verified account boundary

- New subaccount: **Wonder & Workflow LLC**
- New location ID: `sNxq4o3kG3iH5yoQ71Oq`
- Reference-only McCann location: `LcP7OqCtZlq6wPjejmzC`
- No contacts, conversations, appointments, consent records, credentials, or historical data were copied.
- `wonderworkflow.com` and `www.wonderworkflow.com` remain the Netlify website. No DNS changes were made.

## Old-to-new mapping

| Area | McCann reference | Wonder & Workflow rebuild | State |
|---|---|---|---|
| Location | `LcP7OqCtZlq6wPjejmzC` | `sNxq4o3kG3iH5yoQ71Oq` | Verified |
| Calendar | `8BGlICdRRqD8ujhu0BfU` | `tFmtpPmm23VC7ygrKxvK` | Active |
| Booking URL | `/widget/bookings/mccann-automation-discovery` | `https://api.leadconnectorhq.com/widget/booking/tFmtpPmm23VC7ygrKxvK` | Verified; website not deployed |
| Consultation | Automation Discovery | Workflow Fit Review | Active calendar |
| Duration | Reference setup | 30 minutes | Active |
| Availability | Reference setup | 7:00 AM–8:00 PM, seven days | Active |
| Lead time | Reference setup | 2 hours | Active |
| Time zone | Reference setup | America/Denver | Active |
| Assigned user | Reference setup | Ian | Active |
| Connected calendar | Historical McCann connection not copied | `operations@wonderworkflow.com` Google Calendar; conflict checking enabled | Active |
| Meeting link | Reference setup | Google Meet | Active |
| Assessment | Seven-question, 0–21 rules retained | Same canonical questions and 0–3 answer values | Code prepared |
| Pipeline | McCann IDs not reused | `WW — Client Acquisition`, ID `lTUUUTxg3y1fTIwHp3lA` | Active configuration |
| Workflows | Historical workflows used only as reference | Three named Wonder & Workflow shells | Draft and empty; not working |
| Website | Browser-only result, no CRM submission | Integrated server submission and new calendar target | Review branch only |
| Chat | Old/new widgets disabled on site | Existing “A2P Compliance Chat Widget Marketing” inspected | Disabled; unsuitable |

## Calendar behavior

Calendar description: “A complimentary 30-minute conversation to review your Operations Assessment, choose one workflow to improve, and agree on a practical next step.”

- Auto-confirm is on.
- Reschedule and cancellation are allowed.
- Google calendar invitation/update email is on.
- HighLevel's built-in booked/cancelled/reminder notifications are disabled.
- Confirmation text points to the email, Google Meet link, and reschedule/cancel options.
- The current default booking form still contains phone. A compliant email-only custom booking form is drafted but cannot be finalized until the phone and two inherited consent components are removed with explicit deletion approval.

Draft form:
- Name: `WW | Workflow Fit Review Booking`
- ID: `1KzTHb99UiRtEV70AljG`

Required ordinary-booking fields: first name, last name, email. Notes should be optional. Phone must either be omitted or be optional with a separate unchecked SMS-consent checkbox limited to appointment reminders and requested follow-up.

## Assessment field mapping

Folder: `W&W | Operations Assessment`

| Meaning | GHL field ID |
|---|---|
| Q1 | `4AWIRhzwzjbMcN2s6NSQ` |
| Q2 | `ik0qUJdBPMlrKsR4hkb3` |
| Q3 | `4HOuwcvRet2uobfCLHL4` |
| Q4 | `7ZILGvstce4DnIzeB2rn` |
| Q5 | `I4i6OabZ8nxPuepI3ezR` |
| Q6 | `xPaYOdWYZ0F6eqbW5aDW` |
| Q7 | `0OjeJbhQfrFGZq3cmvd7` |
| Score | `1oyX4H9wsbcYCnA336SQ` |
| Opportunity tier | `8y8cXXwtog3EI5lbMhoi` |
| Answers JSON | `Q6cjV61BebhzFxqu6QZP` |
| Submission ID | `Vhcc44drjJ2Mw6rf3aKE` |
| Submitted at | `DrMjOPhA7wmHlpwOt8Pv` |
| Source | `FLVIDM1axmyxK6UhTPjW` |
| Assessment version | `cbZPM9tMIOF01iEP5jer` |
| Maximum score | `ExdE7kv7sv6e8ps5VXRr` |
| Attribution JSON | `KOB6bY7C8eRViXCGzXPn` |
| Consent record JSON | `iemxes6ItEj4EfPqBLH5` |

Consent remains factual: assessment submissions set marketing=false and sms=false. No phone value by itself is treated as SMS consent.

## Pipeline

Pipeline ID: `lTUUUTxg3y1fTIwHp3lA`

Key stage IDs:

- Assessment Submitted: `4877cbd0-eea6-4d1b-b506-94a7adbf1f32`
- Consultation Booked: `a2378593-a32e-4919-ba3e-aa1e4eb4a777`
- Consultation Completed: `191c3f67-ea61-4f73-ad3b-6f36caff0eb4`
- Proposal Sent: `da8bebad-0b38-4271-9123-30ea687b3b8b`
- Decision Pending: `9314d3a5-19de-4ba8-b7b1-c99175736485`
- No-Show / Reschedule: `d5412114-e55a-42ad-a6b9-c27b99d5f1aa`

The pipeline has 13 total stages. Existing extra stages were preserved because deleting or reordering active CRM configuration was not authorized.

## Workflows

1. `WW | Assessment Submitted — CRM` — empty draft shell; not working.
2. `WW | Workflow Fit Review — Confirmation & Reminders` — draft trigger limited to the Workflow Fit Review calendar, followed by:
   - branded confirmation email;
   - wait until 24 hours before the appointment, then branded reminder email;
   - wait until 2 hours before the appointment, then branded reminder email;
   - late bookings exit at a missed reminder boundary instead of receiving an out-of-sequence reminder.
3. `WW | Workflow Fit Review — Status Handling` — draft cancelled-status trigger limited to the Workflow Fit Review calendar; removes the contact from the confirmation/reminder workflow.

The workflows are **drafts, not live automations**. Reschedule and no-show opportunity updates remain unfinished. They must not be published until the server-to-CRM sync, booking webhook, sender identity, cancellation/reschedule behavior, and duplicate handling pass a controlled end-to-end test. SMS actions are absent and must remain absent until compliant consent and messaging registration are approved and functioning.

## Website integration prepared on GitHub

Review branch: `codex/wonder-workflow-ghl-rebuild`

Prepared changes:

- public route uses the existing validated server-side assessment flow;
- new location, calendar, booking URL, business source, and assessment version replace McCann targets;
- the seven questions and scoring rules are unchanged;
- server validation recomputes score and rejects mismatches;
- the same submission ID and body are reused for retry;
- durable receipt and contact locks prevent unintended duplicate submissions;
- contact lookup is email-first and conflicts stop for review;
- opportunity code now references the Wonder & Workflow pipeline and stage IDs;
- configuration prefers `WW_*` environment names while retaining legacy-name fallback;
- no secret is placed in browser code or this document.

Required deployment settings are listed in `.env.example`. The private integration token and generated secrets must be stored only in Netlify environment variables.

## Chat widget

Widget reference: `6aa0a1639fbeb2a2186527c7`.

The existing widget is named **A2P Compliance Chat Widget Marketing**. Its preview requires phone and includes promotional consent plus LeadConnector Terms/Privacy links. HighLevel shows the branding/consent behavior as locked by A2P compliance. It does not match the approved appointment-reminder/requested-follow-up use case and remains disabled. It should not be installed on the website.

## A2P/SMS state

HighLevel's current official guidance separates:

1. website preparation: accessible business site, Privacy Policy, Terms, accurate opt-in;
2. Brand registration;
3. Campaign registration after Brand eligibility/approval;
4. carrier review and approval;
5. number association and actual SMS delivery testing.

Appointment reminders sent over a US 10-digit local number still require A2P registration. Registration is completed in Settings → Phone System → Trust Center, while carriers/registration partners decide approval. A submitted or pending registration does not mean SMS works.

Official references:

- https://help.gohighlevel.com/support/solutions/articles/155000007237-how-to-get-your-phone-number-a2p-approved-in-2026
- https://help.gohighlevel.com/support/solutions/articles/155000004539-a2p-campaign-registration-step-by-step-guide-and-faqs
- https://help.gohighlevel.com/support/solutions/articles/155000002380-us-phone-number-registrations
- https://help.gohighlevel.com/support/solutions/articles/48001229784-a2p-10dlc-campaign-approval-best-practices

No registration was submitted, no SMS workflow was enabled, and no delivery was claimed.

## Approvals and inputs still required

- Explicit permission to remove phone and both inherited consent components from the draft booking form.
- Approval to create or update the scoped GHL private-integration token and Netlify environment variables.
- Verification that the configured sender, Wonder & Workflow <operations@wonderworkflow.com>, is authenticated for email delivery.
- Approval to deploy the website branch.
- Approval to publish workflows and submit one controlled test assessment/booking.
- If SMS is wanted: the sending-number choice, Brand/Campaign registration information, separate optional consent wording, approval to incur registration/phone/message charges, and approval to test delivery.

Do not point the apex or `www` DNS records to HighLevel. If an agency portal is later needed, propose `app.wonderworkflow.com` separately.
