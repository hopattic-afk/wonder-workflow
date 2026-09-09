# Email-contact launch — September 8, 2026

Supersedes earlier public assessment/booking status. Production deploy: 6aa0a94d7037af8468c3cd02, https://wonderworkflow.com. Verified all nine public routes return HTTPS 200 with rendered content and route-specific canonical URLs.

Public assessment retains seven questions and scoring, calculates only in browser memory, collects no contact details, and directs visitors to /contact and operations@wonderworkflow.com. Live browser test completed seven questions, produced 12/21 Strong Opportunity, and followed Discuss your result. Old GHL backend and legacy implementation preserved; no account migration or appointment submitted.

Contact, Privacy, and Terms are published at /contact, /privacy, /terms. Legal identity: Wonder&Workflow LLC. Complimentary Workflow Fit Review remains 30 minutes; assessment remains about two minutes. Chat widget disabled by user decision. New agency widget must be corrected and independently verified before activation; public config currently specifies MARKETING with LeadConnector policy URLs. Intended SMS purpose is appointment reminders and requested follow-up only. A2P approval and new agency opt-in remain pending.

Validation: 25 assessment/domain tests, build/typecheck, five browser tests including desktop/mobile accessibility across public pages and automatic intro/reduced-motion/failure/skip behavior passed. Initial page HTML now contains public content and route metadata for crawlers.

Remaining domain issue: www CNAME points to whitelabel.ludicrous.cloud with DNSSEC validation failure. Authorized intended value is ai-operations-assessment.netlify.app. Namecheap access blocked at security verification in current browser; user asked to sign in/complete challenge or change only this record. Preserve apex, mail, and all unrelated DNS records; do not disable DNSSEC. Future agency portal can use app.wonderworkflow.com, not configured here.

Deployment upload was restricted to 55 allowlisted source/assets files. Stage digest: a11d64693b704fb93448fe9ec5da4450d2c925e92ce3f9dbeb4191ff686bc92d. Remains on Netlify Free; no upgrade or billing changes.
