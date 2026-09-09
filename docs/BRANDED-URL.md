# Branded assessment URL

Client link: https://ai-operations-assessment.netlify.app/assessment/

Existing audit workspace: https://ai-operations-assessment.netlify.app/meetings

Netlify project b5ad4440-c287-4446-9b46-fb7226035d54 now uses the neutral `ai-operations-assessment.netlify.app` subdomain. The earlier custom domain remains attached for compatibility but is no longer the public link. A separate compatibility project at the old Netlify hostname serves the current app through an HTTP 200 reverse proxy, preserving that browser origin for saved local audits. Existing apex, www and mail records were not changed.

MCCANN_APP_ORIGIN is now https://ai-operations-assessment.netlify.app. The legacy Netlify hostname remains available only to load the app shell and recover or export browser-local audit notes saved under that origin. Use the neutral hostname for the protected meeting inbox and all new work. The earlier custom-domain host should not be shared publicly. The GHL webhook keeps its existing address through the restricted legacy Netlify proxy at compat/legacy-url.

Verified 2026-09-06: production deploy `6a9ce1c63e84f6bec8f8186e` is ready on the neutral site. The neutral assessment and readiness endpoint return 200, and a same-origin invalid assessment reaches application validation (400 rather than an origin rejection). Compatibility deploy `6a9ce234264b65f06193698a` reverse-proxies old browser paths so the app can read old-origin local storage, and `/api/booking` reaches the production webhook authentication boundary. State-changing browser requests through the old proxy fail the strict origin check; use the old host only for local note recovery/export and the neutral host for meetings and submissions. No real assessment or booking was created during these URL checks.

Deployment 6a9cb3d13d83b52aa6b3394d verified ready 2026-09-06T00:29:45.076Z. Stage: 43 files, 523055 bytes; SHA256 a9932a20eab336af733528ba5d9d9eba0d889b0d38ffac354ab9f1c4852988dc. Build and 63 independently run focused tests passed.

Live checks using the current public DNS answer (1.1.1.1) and normal TLS certificate verification: branded assessment 200; integration readiness 200 with all flags true; unauthenticated inbox 401. Authoritative DNS and public resolver both returned the new records. The computer's default resolver still returned cached NXDOMAIN at verification time, so browser opening remained subject to DNS propagation. No certificate validation bypass or DNS-server change was used.

A fresh production test submission was not run: automatic approval review rejected the combined credential/login/new-test-submission check. Read-only live checks and local alias-origin tests were completed instead. A broad environment read was also rejected; verification used only the nonsecret alias setting in the UI.

Browser notes and sign-in do not automatically move to a different domain. Keep the existing internal address, or deliberately export/import a backup and sign in at the new domain if moving the internal workspace. Earlier implementation ZIPs predate this domain support change.
