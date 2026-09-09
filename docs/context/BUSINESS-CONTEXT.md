# McCann AI Operations — consolidated business context

Consolidated 2026-09-05 for the current McCann Contracting Operations AI workspace, at the user's request, before activation. This is a sourced knowledge handoff, not evidence that ChatGPT project containers were merged or that any integration was activated. Original project files remain in place and unchanged. No credentials, contact records, or raw private transcripts are copied here.

## Source precedence

1. Current explicit user decisions and current verified code/configuration.
2. Explicit user corrections in the source project conversations.
3. Latest source artifacts, especially `social-v2`, over earlier drafts.
4. Historical assistant proposals and reported system state: context only, not approval, current market evidence, or live verification.

Source project: **AI Automation Business**, `g-p-6a997e8031788191ae06a86a7ac62070`. Local mirror: `C:\Users\12505\.codex\.chatgpt-projects\g-p-6a997e8031788191ae06a86a7ac62070`. References beginning `source/output/` below are relative to that mirror. Its `AGENTS.md` marks synced `sources/` read-only; that directory was empty at inspection. The useful local artifacts are in `output/`. Earlier chat attachment references do not establish that the attachment files are available locally.

## Business and offer

- Build an **AI-first operational efficiency and implementation business** for small businesses. The user wants practical plans and SOPs, small-business economics, reduced repetitive labor and subscription costs, and useful AI adoption. Generic enterprise transformation positioning was rejected. [Handoff Acknowledged, user turns `297b5ce6-1bef-4188-aca5-de89ff2aa10c`, `89688a6e-edd2-40e8-b769-ef2b7911c5ea`.]
- Focus on internal operations: administrative work, documents, internal knowledge, reporting, data entry, software overlap, handoffs, approvals, and service delivery. Marketing, advertising, lead capture, and sales nurture requests go to Justin under a separate referral/commission arrangement; its commercial terms are not established here. The consultancy's own assessment funnel does not make marketing automation a client service. [Same user scope correction.]
- Entry offer: **free 30-minute AI Operations Audit**, focused on **one recurring workflow**. The consultant reviews the process, baseline, practical AI fit, risk, and next step. Produce a concise one-page recommendation; offer a custom scoped implementation when justified. Broader implementation and optional ongoing support follow demonstrated needs. [Source `social-v2/README.md`, `captions.md`; current console requirements.]
- The assessment supplies context to the consultant. It does **not** find the respondent's best AI opportunity or prove savings automatically. The user expressly corrected that claim. A selected priority is self-report, not an independently recommended solution. [Handoff Acknowledged, user correction beginning “The assesment doesn't help them find their best AI oppourunity”.]
- Warm-market launch comes first; locality-focused acquisition can follow initial clients. The user said the business is U.S.-based and rejected default Canadian pricing/context. Canadian contacts may exist in the warm market; a possible Canadian entity/payment route was exploratory and requires separate decisions. Use **USD** by default, with explicit per-session currency where needed. [Handoff user turns `297b5ce6-1bef-4188-aca5-de89ff2aa10c`, `fa349b1a-8eb0-4de9-bac5-b81891a86473`.]
- Owner-led small businesses, initially familiar trades/field service and adjacent service businesses, are a working focus. Historical staff/revenue bands were targeting suggestions, not mandatory eligibility rules. Do not promise saved hours, avoided hires, accuracy, payback, or revenue without a client baseline and evidence.

## Pricing, scope, and delivery decisions

The user explicitly requested removing the old fixed founding price from the audit. Earlier assistant-proposed package price ranges, retainers, first-three-client scarcity, case-study conditions, implementation-hour ranges, and stabilization durations are **not current defaults or commitments**. Current console prices, deposit, maintenance, durations, and performance targets remain blank until entered. No price is inferred from an assessment score, company size, or industry. [Handoff user turn `dfae86e3-ccd1-4a58-a079-bcd7207f129f`; current `CALCULATION_RULES.md`, `src/domain/defaults.ts`.]

Build the package from the client's actual problem, integration needs, risk, and expected value. One-workflow pilots, human review, measurement, testing, documentation, handoff/training, and separately disclosed third-party costs remain useful delivery patterns; select exact scope and commercial terms deliberately. Case-study use requires its own explicit permission. Current calculation rules distinguish recovered capacity from cash savings and avoid double-counting; these supersede loose historical savings examples.

The working delivery sequence is assessment → booked audit → measured discovery → one-page recommendation → scoped proposal → approved implementation → measured results → optional expansion/support. The free audit does not include full-company architecture, credentials/database review, migration design, or an implementation specification handed away as a free deliverable. An uncertain or high-risk opportunity may need further discovery or no AI implementation.

## Brand, copy, and assets

- Contracting entity: **McCann Contracting LLC**. The user selected the McCann Contracting sub-account and this entity name. Service styling in the latest source artwork: **McCann Contracting LLC | AI Operations**. Keep the construction website/project separate; the context consolidation does not authorize changing it.
- User preference is black and gold, with ivory text; the old blue presentation was rejected. Historical artwork uses gold `#D4AF37`; current app bronze `#C29A60` is a later app design choice. Do not silently recolor approved source images or claim the current palette matches every historical asset.
- Latest local social campaign headline: **Build capacity. Reduce overhead.** Latest CTA: **DM/Message AUDIT**. The older **ASSESSMENT** CTA and hashtag-heavy captions are superseded by `social-v2`. A personal reply is intended; no automatic DM is implied.
- Source carousel assets: `source/output/social-v2/01-build-capacity.png`, `02-workflow-diagnostic.png`, `03-audit-cta.png`; accompanying `captions.md`, `README.md`, `prompts.md`, and `index.html`. Archive: `source/output/mccann-social-v2.zip`. Original single-image drafts remain in `source/output/mccann-ai-operations-social-post.png` and `social-post-original.png`.
- The source artwork uses a text wordmark. A verified official logo was not supplied in these reviewed files. Do not fabricate one or present a generated image as an official existing logo. No social post publication is established by file existence.

## Assessment contract and version history

The user asked for the **style** of scorecard marketing and explicitly said they did not want to use ScoreApp itself. Historical suggestions to build a native GHL quiz were proposals. The user subsequently identified `http://127.0.0.1:8765/assessment` as the actual current assessment source. That is a local URL, not a deployed public assessment address.

The preserved source `source/output/assessment/core.mjs` has six scored questions, each 0–3, maximum **18**, version `reconstructed-draft-1`: repetitive admin time, duplicate entry, document processing, routine drafting, information access, process repeatability. Its original wording/options remain source evidence.

Current `src/domain/assessment.ts` defines `mccann-ai-operations-v2-21`: those six plus a distinct seventh question, **How much do your software subscriptions overlap or go unused?** Options, in score order 0–3:

1. No overlap or unnecessary subscriptions
2. Some possible overlap
3. Several tools with overlapping features
4. Significant overlap or unused subscriptions

This addition followed the current thread's stated assumption to satisfy the earlier explicit 21-point requirement after an optional clarification received no answer. It is a new version, not an original recovered question. Current tier boundaries are 0–7, 8–14, and 15–21. Legacy 18-point submissions retain their original score/max/tier as context; they are never rescaled into a 21-point audit result.

Preserve original question IDs, labels, values, submission/version/timestamps, and all context answers. Team-size and admin-time **ranges remain text**, not invented exact headcount/hours. Current tools are current tools, not assumed AI opportunities. Known native business/contact fields and explicit allowlisted mappings can prefill the audit; unknowns stay blank. Import protects manual edits (including deliberate clearing), retains conflicts and stale history, and treats duplicate deliveries idempotently. Private audit notes, pricing, and document edits do not become public assessment fields.

## GHL identity, intended workflow, and verified limits

| Item | Known identity / decision |
| --- | --- |
| Intended location | `LcP7OqCtZlq6wPjejmzC` — McCann Contracting |
| Calendar | `8BGlICdRRqD8ujhu0BfU` — Automation Discovery Call, 30 minutes |
| Booking destination | https://api.leadconnectorhq.com/widget/bookings/mccann-automation-discovery |
| Older native form | `krdh4y2Zue4jm8NvQoZr` — Automation Review Intake |
| Proposed sales pipeline | AI Automation Sales |
| Proposed stage progression | New Assessment → Call Booked → Discovery Complete → Recommendation Sent → Proposal Sent |

The user supplied the calendar ID and reported that a test booking appeared in the calendar. That establishes a historical successful booking, not full assessment capture or current automation health. The source repair audit found empty tags/custom fields on a recent booking contact and no matched test opportunity in its bounded read; this is not an exhaustive current account inventory. The older form's two written labels differ from old custom-field keys, so their mapping must not be guessed.

The source repair plan requires durable assessment save before `ai-assessment`, a preserved full snapshot, contact-bound opportunity reuse, and the exact calendar trigger before `discovery-call-booked`. Never regress a later stage or reopen Won/Lost on resubmission; rescheduling reuses the same opportunity; cancellation/no-show changes metadata/follow-up rather than deleting records or automatically marking Lost. Native Won/Lost statuses replace redundant pipeline stages. These are **desired CRM behaviors**, not evidence they have been installed. [Source `output/ghl-repair.md`.]

Current bridge runbook: [GHL-BOOKING-WORKFLOW.md](../GHL-BOOKING-WORKFLOW.md). It documents local implementation and tests, explicitly **not deployed, connected, or activated** at initial consolidation. Hosting was subsequently published with the integration disabled; see [current implementation handoff](../IMPLEMENTATION-HANDOFF.md) for the later verified status. Public readiness flags are not a credential or end-to-end test. The implemented bridge stores immutable assessment snapshots, associates verified contact identity, receives authenticated booking events, and supplies a protected inbox for preservation-aware audit import. Existing browser audit edits remain local.

**Material remaining CRM scope gap:** the current adapter does not implement the source project's entire pipeline, opportunity transitions, tags, or readable per-answer custom-field writes. Its new-contact upsert is intentionally limited to identity; the full questionnaire is retained in durable assessment storage and normalized audit data. This must not be described as completion of every original GHL repair request.

Source UTM convention: `facebook`/`instagram`, medium `organic_social`, campaign `ai_operations_launch`, content `feed_post_01`/`profile_link`/`assessment_dm`. The source wants complete first/latest touch snapshots without mixing campaigns or allowing an empty touch to erase known attribution. The original browser helper's session-first source is not CRM lifetime-first source. The current fixed booking acknowledgment URL contains no contact data; source attribution travels in assessment metadata. Confirm desired CRM lifetime attribution separately; the reviewed current frontend does not establish the legacy session-persistence behavior. Never put contact details, answers, credentials, or private notes in a booking URL.

## Before declaring the business funnel operational

- Verify current exact-location calendar availability/timezone, forms, field definitions, pipeline, and workflow state. Historical Monday–Friday Mountain-time hours, confirmation/reminder emails, onboarding/case-study workflows, and a disconnected Make account were explicitly historical reports; none are established current by this handoff.
- Resolve the CRM scope gap above and exact custom-field ID/type mapping. The source field map is a proposal, with actual IDs blank. Do not create competing fields blindly.
- Establish the approved public HTTPS assessment origin and working privacy-policy destination. The source configuration had no public URL, privacy URL, or connected submit endpoint. Local port 8765 is not a shareable launch address.
- Complete approved hosting/configuration and a controlled live assessment → saved snapshot/contact → booking → protected inbox → preserved audit readback. Test retry, reschedule, and cancellation without duplicate records. Local automated tests alone do not establish this.
- Decide which existing confirmation/reminder/internal-notification workflows remain in scope. The source once suggested score emails/internal alerts; current bridge sends no automated email/SMS. Do not silently activate those older proposals.
- Confirm invoice/payment process, per-client contract currency/entity, deposit/support terms, retention/deletion policy, and case-study permission. No cross-border tax treatment or commercial legal conclusion is established here.
- Use the latest reviewed social copy only after public destinations work and publication is authorized. Draft warm-market targets (25 messages, 5 calls, 3 pilots/results) were planning goals, not achieved metrics or permission to send outreach.
- Optional public website title/description enrichment is sourced context, not verified business performance or permission to fetch private sources. Keep failures visible and retain useful prep questions without invented facts.

## Provenance and remaining context gaps

| Source | Material used |
| --- | --- |
| ChatGPT **Handoff Acknowledged**, `6a99d217-1ccc-83e8-a4d1-7d6f27058fb3` | Entire available conversation inspected; durable original handoff (`1f254d95-9162-4364-b440-4af85bc43062`), user scope/AI/U.S./pricing/assessment corrections, entity/calendar choice, historic booking report. Assistant proposals distinguished from user decisions. |
| ChatGPT **Launch Post Checklist**, `6a9c148d-ac88-83e8-9070-c762b8d46d2f` | Repeated request for actual social graphics, GHL pipeline/field repair, assessment capture, and UTM handling. Historical launch-readiness statements are not current verification. |
| Codex **Fix GHL marketing setup**, `01a07244-c6ad-7122-9d51-29a2531ff4a6` | Matching source project and resulting local output artifacts; source delivery was draft/partial, not published. |
| `source/AGENTS.md`, `source/output/START-HERE.md` | Mirror boundaries, available deliverables, old blockers, no verified logo/publication. |
| `source/output/ghl-repair.md`, `assessment/field-map.csv` | Desired CRM workflow, attribution rules, mapping gaps, bounded historical readback. |
| `source/output/assessment/{README.md,core.mjs,index.html,app.mjs,config.mjs}` | Original six-question contract, required/optional inputs, local preview and save boundary. |
| `source/output/social-v2/{README.md,captions.md}`; older `social-captions.md` | Latest offer/CTA/brand versus superseded drafts; asset locations. |
| Current `README.md`, `DATA_MODEL.md`, `CALCULATION_RULES.md`, `PLAN.md`, domain constants/assessment, bridge runbook | Current local architecture, financial safeguards, version evolution, and integration limitations. |

Older source handoffs reference **Build Launch System** and **AI Automation Career Marketing**, plus generated offer/SOP/proposal/prospect attachments. Those original artifacts were not present in the inspected mirror; this consolidation does not claim a complete recovery of them. Prior market-size/adoption numbers and competitor prices were not reverified and are deliberately excluded as current facts. No private prospect list, secret configuration, or raw transcript is included. The source project's isolation rule is superseded only to the extent of this explicitly requested AI-business context consolidation; unrelated construction, marketing-company, client, and personal projects remain outside scope.
