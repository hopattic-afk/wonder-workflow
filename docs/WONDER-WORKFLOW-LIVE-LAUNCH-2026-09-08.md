# Wonder & Workflow live launch — September 8, 2026

## Published and verified

- Live website: https://wonderworkflow.com. Netlify Free retained; no billing changes.
- Existing Netlify project preserved: `b5ad4440-c287-4446-9b46-fb7226035d54`.
- Final release: `6aa05b6e35fc928b747d2d05`; deployment reported ready and live browser rendered the branded site.
- Source stage: `.netlify/staging/release-8b819802-a845-4959-8e3a-9f4a9adcfdd1`, 53 allowed source files, 4,978,774 bytes. Pre-upload manifest SHA256: `26de9da423dcaf6bab85c3d89ff4c805baeb367e750b15dac3ac1cc056cccad0`. Deployment tooling may add its own files after upload; always create a fresh stage before another deployment.
- Namecheap: apex ALIAS `apex-loadbalancer.netlify.com`; www CNAME `ai-operations-assessment.netlify.app`. Public DNS resolves correctly. Google verification TXT, Google MX and DNSSEC preserved.
- Netlify primary domain changed to wonderworkflow.com; www redirects to apex. Let's Encrypt certificate includes apex and www; normal browser HTTPS succeeds.
- Optional exact `MCCANN_APP_BRAND_ORIGIN=https://wonderworkflow.com` added, production/all scopes. Existing neutral and legacy origins retained. Functions-only scope was unavailable on Free; connector success response did not persist it, caught by live verification and corrected through dashboard.
- Build and all 62 bridge tests passed. Live brand and neutral readiness return 200/all flags true; signed-out inbox returns 401. This does not independently prove all downstream enrichment and notification delivery.
- Branded privacy page/public email, seven-URL sitemap and robots verified. Email: operations@wonderworkflow.com.
- Homepage directs immediately to assessment question 1; seven-question flow works on live domain. Original short intro and continuous illustration preserved, with reduced-motion preference support.
- Existing GHL calendar retained and rebranded Workflow Fit Review, complimentary 30 minutes, violet #56438a, Book My Workflow Fit Review button. Calendar/location IDs and booking slug unchanged.

## Controlled live test

User explicitly approved a real launch-test assessment and appointment using operations@wonderworkflow.com, including normal calendar confirmation/reminder messages.

- Assessment submitted through live website; score 7/21, Targeted Opportunity.
- UI confirmed saved and rendered actual HighLevel calendar inline below score, without leaving the assessment route.
- GHL verified contact: `3rn6340VeASsVM00NmCF`, operations@wonderworkflow.com. Assessment name/company: Launch QA Test / Wonder & Workflow — Launch Test. Contact identity capture is confirmed; optional full custom-field CRM enrichment remains disabled.
- Booking is not yet submitted. User then steered toward deciding whether to own a new GHL agency before deeper configuration, so further GHL changes/test booking are paused for that decision. Dedicated standalone form `c36IxIMjnDDqgQSrUDQJ` (Wonder & Workflow — Booking) is saved with required first/last/email and real privacy link, without phone/consent; it is NOT attached. Existing live calendar retains its Default form and generic consent setting. No test appointment or account transfer was submitted.
- Real appointment, webhook-to-prepared-audit delivery and email receipt are not yet verified.

## Usage and operating notes

Brand delivery refreshed: `output/wonder-workflow/brand-package/wonder-workflow-brand-identity.zip`, 21,235,021 bytes; SHA256 `96CB6E002FD67BAD0CE7FAEA63120902A6E9D19FFE1A914207A969DDE2A315EE`. All 23 archived files match the package; all eight original assets and embedded logos verified unchanged. Contact email and offer wording updated. Personal names/roles/optional phone remain intentionally editable collateral fields.

Dashboard snapshot before the final deployment charge settled: 80.3/300 credits remaining; after final release, the dashboard shows about 65 credits available. Billing cycle ends September 29. Earlier snapshot: 14 production deploys accounted for 210 credits; total usage 219.7. Usage may lag. Avoid unnecessary production releases; do development and verification locally.

Public privacy contact is operationally specified, but the owner still needs to maintain an actual process for responding to correction/deletion requests. No invented retention commitment was added.

Earlier candidate reports and ZIPs are historical. This report records current live state and must not be read as proof of unfinished checks above.
