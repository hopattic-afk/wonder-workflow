# Verification record

Application checks verified locally on **2026-09-05**. Later live production checks proved assessment capture, packet creation, actual GHL reschedule/cancellation delivery, duplicate replay and inbox session controls. Hosted authenticated audit prefill/manual-note preservation were not browser-tested; local E2E passed 7/7 in 43.4 seconds using fake CRM and the real handler. See [activation record](docs/ACTIVATION-RECORD-2026-09-05.md).

## Final results

| Check                       | Result                                                                                                                |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `npm.cmd test`              | **231 tests passed** across 12 files                                                                                   |
| `npm.cmd run test:e2e`      | **7 end-to-end tests passed**                                                                                         |
| `npm.cmd run build`         | Passed TypeScript compilation and Vite production bundling                                                            |
| `npm.cmd run check`         | Passed; no TypeScript errors                                                                                          |
| Independent Sentinel review | Assessment, protected inbox, bridge, concurrency, and website helper reviewed independently; no remaining actionable code findings |
| Production browser console  | No errors during the complete client workflow                                                                         |
| Unexpected network requests | None; local assets and expected same-origin API reads. Full booking test injects fake CRM/storage and local browser transport; no real CRM writes |
| Responsive overflow         | No horizontal document overflow across all six views at 1440 × 900, 1280 × 800, 834 × 1112, and 390 × 844             |
| Automated accessibility     | No axe violations for WCAG 2 A/AA and WCAG 2.1 A/AA tags on six primary views and all five worksheet sections         |
| Recommendation PDF          | One U.S. Letter page, 612 × 792 points; white background, readable text, required footer, no app controls             |
| Proposal PDF                | Four U.S. Letter pages, matching 1/4–4/4 footers and repeated document headers; deliberate page groups                |
| Pricing defaults            | Implementation price, discount, deposit, support price, and payment selection unpopulated                             |
| Currency                    | USD default verified; CAD selection persists and survives export/import                                               |

The initial Windows sandbox blocked Vite/native tool process spawning (`spawn EPERM`). The same local test/build commands succeeded through the approved execution path. Package installation used a workspace-local npm cache after the default cache directory was not writable.

## Automated coverage

### Domain — 59 tests

- All requested financial formulas and the required worked example: labor 7,500; subscription 2,400; rework 2,400; recurring costs 1,200; gross 12,300; recurring net 11,100; investment 3,000; first-year benefit 8,100; ROI 270%; payback about 3.24 months; annual value 3.7×.
- Missing inputs, explicit zero, negative/zero savings, division by zero, discount limits, percentages, working weeks, multiple roles, software cost increases, optional avoided hiring, and the 3× warning.
- USD/CAD formatting, null/nonfinite handling, and no default project price.
- Pilot-Fit normalization to 0–100, reversed risk contribution, threshold labels, and hard-stop warnings independent of score.
- Marketing referral and each allowed final decision; a negative or referral decision overrides earlier pilot language.
- Recommendation/proposal generation, missing-value labels, private-note exclusion, current-source fingerprints, and inherited stale recommendation warnings.
- Versioned JSON export/import and storage restore; invalid JSON, unsupported version, invalid fields, oversized data, duplicate IDs, unsafe logo URLs, and malformed storage rejection.

- Assessment score boundaries from 0–21, including query prefill and import; fractional scores and values above 21 are rejected.
- Legacy gold upgrades to bronze gold while preserving custom colors and all recorded audit inputs.

### Worksheet UI — 3 tests

- Five main sections, plain-language questions, and optional detailed fields and internal scoring.
- Editing the short form preserves existing client, worksheet, workflow-step, and software details.
- Future AI uses are explained clearly; advanced selections and risk warnings remain intact across sections.

### Document UI — 7 tests

- Cancelled regeneration preserves edits; investment and internal rationale are excluded from default copies; proposal pricing updates the shared calculator state.
- Guardrails remain visible internally and are excluded from print/copy.
- Confirmation protects a privacy edit entered before first generation and preserves a deliverable when removal is cancelled.
- Payment presets remain unselected by default; selecting the 50/50 preset with an entered price sets the deposit and schedule. Negative amounts and fractional sample sizes are rejected inline.

### Persistence lifecycle — 5 tests

- Debounced autosave and restore after reopening.
- Pending-input flush on page hide.
- Corrupt storage stays intact until explicit recovery.
- Cross-tab changes pause writes rather than overwriting saved work.
- Quota failures do not report a successful save.

### Booking intake — 27 domain tests and 2 UI tests

- Strict location/calendar scope, native contact mapping, IANA timezone and assessment score boundaries; invalid, oversized, ambiguous, unsupported, or private-field imports rejected before mutation.
- Repeated, stale, and newer deliveries; multiple appointments; missing assessment; history retention; cancellations; source changes; manual edits and deliberate clearing; pending conflicts survive blank updates and reschedules.
- Long manual values, preserved pricing/notes/documents, old version 1 backups, no network or persistence calls from the pure import engine.
- Preparation UI stays absent for ordinary audits; conflict values follow live worksheet edits and disappear from the pending display when manually accepted.

### Assessment, inbox, and hosted bridge — local verification

- 17 assessment tests: canonical seven-question21 scoring, verbatim legacy six-question18 compatibility, exact source context, tampered payloads, preview behavior, immutable retries, phone validation, and no inferred numeric ranges.
- 7 inbox tests: opening/import/replay, edits during requests, atomic paginated batches, blocked storage, authentication, static preview, and deleted-meeting dismissal.
- 42 server tests: disabled configuration, auth/session/cookie protection, durable-write verification, identity mismatch, failure/retry, delayed and simultaneous submissions/bookings, frozen associations, status updates, and research-failure isolation.
- 62 website tests: injected DNS/network only; blocked private/reserved addresses, DNS pinning and TLS options, redirects, byte/deadline limits, parsing, source attribution, and failure handling.
- Final `npm.cmd run build` passed TypeScript and production bundling. Separate page loading avoids bundling the entire audit application into the initial assessment entry.
- Latest production deploy `6a9ca684ee8155e734a96249` ready at `2026-09-05T23:33:04.694Z`: 43 files, 521,675 bytes; SHA-256 `cc47ff8d23b9864fe5360aea6bec95c0bbe3b7c192cf6f4d53a685cadfc8b363`. The appointment-envelope correction is deployed. Earlier deploy `6a9ca32c22ead77fb81b339d` exposed the now-corrected HTTP 400 failure.

### Later activation checkpoint

The appointment-envelope correction passed 47 focused tests, server TypeScript, the full build and independent Sentinel review, then deployed. Earlier 37 focused checks and the 231 automated/7 browser baseline are non-additive runs. Actual manual replay returned 200 created with assessment_matched true; actual GHL reschedule/cancellation reached one authenticated inbox packet. Local authenticated-prefill/manual-note E2E passed 7/7 in 43.4 seconds; hosted authenticated UI was not tested.

### Browser — 7 tests

- Public assessment:21-point preview, no answer submission or audit-store access, desktop/mobile overflow and axe checks.
- Simulated complete connected flow: assessment saved, verified fake booking event, inbox login, prefilled audit/original answers, reschedule/replay, retained call edits, and logout.

1. **Complete client journey:** create an audit; enter client/context; start timer; add, duplicate, and reorder workflow steps; add multiple labor roles, subscription/rework/recurring assumptions; verify the financial case; generate/edit both documents; enter custom project pricing; select a payment preset; invoke print controls and create PDFs; mark sent locally; refresh and retain data; export and inspect JSON; delete the audit and verify deletion survives refresh. Watches console and network requests throughout.
2. **Responsive views:** dashboard, worksheet, calculator, recommendation, proposal, and settings at all four required viewport sizes; no horizontal overflow. Captures representative screenshots.
3. **Data lifecycle:** validated query prefilling, CAD, audit duplication, archiving, full export, invalid import rejection, confirmed delete-all, validated replacement restore, and restored field values.
4. **Accessibility:** axe checks every primary view and all five worksheet sections for the listed WCAG rule sets. Automated checks are useful evidence, not a substitute for a full assistive-technology audit.
5. **Prepared meeting:** review and import a fictional normalized file, verify original answers and sourced notes, 21-point score, repeat import, preserved manual edit, proposed conflict, refresh persistence, wrong-location rejection, axe checks, and desktop/mobile screenshots. This does not test a live GHL receiver or automatic research.

## Visual and PDF inspection

- Inspected rendered desktop dashboard/calculator, mobile worksheet, and the refreshed bronze-gold AI possibilities section. Fixed a navigation-number contrast issue caught by axe, then reran the complete browser suite successfully.
- Generated PDFs through Chromium's real print rendering at normal scale with CSS Letter sizing.
- Verified PDF page counts in Playwright and independently with pypdf/Poppler.
- Rendered and inspected the recommendation and all four proposal pages. Headers, footer numbering, margins, section transitions, and body text fit without clipping in the tested fixture.
- Rebalanced proposal groups to sections **1–6 / 7–11 / 12–14 / 15–18**, fixing an initial overflow between privacy terms and the previous page.
- Verified that internal rationale and call notes do not appear in the default client document.

Browser tests create reproducible, ignored QA artifacts under `output/playwright/`, including `dashboard-1440.png`, `calculator-1440.png`, `worksheet-390.png`, `recommendation.pdf`, and `proposal.pdf`. Test PDFs are fictional validation samples, not real client proposals.

## Repeat the checks

```powershell
npm.cmd ci --cache .npm-cache
npm.cmd test
npm.cmd run build
npm.cmd run test:e2e
```

The E2E runner uses installed Google Chrome and serves `dist` at `127.0.0.1:4173`. See README for the managed Chromium alternative. Traces and screenshots are retained on failures; the HTML report is generated in `playwright-report/`.

## Limits of this verification

- Browser execution was verified in local Google Chrome on Windows. Firefox, Safari, physical mobile devices, screen-reader workflows, and production Netlify headers were not tested.
- Arbitrarily long user edits, extra optional sections, oversized branding, or different browser print settings can increase document length. The recommendation has a physical overflow warning and blocks its print button until it fits; proposals warn and can continue onto extra pages. Inspect print preview before sharing.
- Hosting was subsequently deployed; no live GHL integration, database migration, email delivery, signature, payment, or legal review was performed.
- GHL assessment capture, a hosted authenticated receiver/inbox, automatic booking imports and business research remain unconfigured. Local packet tests are not end-to-end evidence for the requested live workflow.
- Browser quota and private/incognito persistence behavior vary; lifecycle tests cover the failure paths, not every browser configuration.

## Remember-device option — September 5, 2026

The optional 30-day meeting-inbox session passed 59 focused tests (bridge, inbox hook and sign-in UI), independently rerun by Sentinel. Coverage includes omitted/false eight-hour default, explicit true 30-day expiry at the boundary, matching cookie duration, unchanged existing sessions, malformed boolean rejection, and immediate remembered-session revocation. The matching browser flow passed 1/1 with login accessibility, 30-day cookie, imported audit/manual edits and revoked-cookie 401 checks. Production build passed. Live deployment verification is recorded separately in the activation record.
