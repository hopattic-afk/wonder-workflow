# Step-by-step public assessment

Flow: introduction → seven individual question screens → contact details → indicative score and booking link. Selecting an answer advances one step. Back lets visitors review answers and retains contact fields. Question headings receive focus, answer choices are keyboard-operable buttons, and progress is visible.

The seven questions, 21-point scoring, attribution, submission schema, GHL mapping, and booking workflow remain the same. Only the final contact form submits; selecting answers does not send them. Failed-save retries retain the original request and lock editing. Customer-facing display remains unbranded.

Validation and publication evidence will be added after checks complete.

Local validation: 19 assessment tests passed, production build passed, independent Sentinel review passed. Three browser checks passed: accessible preview scored 21/21 without POST; mobile keyboard/back/contact preservation; assessment through simulated CRM booking and prepared audit. No real CRM submission was made for these checks.

Published: production deploy 6a9cc7de951ee5c911d94e92, ready 2026-09-06T01:55:17.690Z. Reviewed stage SHA-256 0c3ee7e8fc51158442a683f68938ccc2ccaf569801de4783b7ded120aa22e65a (43 files). Live https://ai-operations-assessment.netlify.app/assessment/ verified: intro-only start, question 1, answer selection advances to question 2 with focus and progress. Visual question layout inspected. No live contact information or assessment submission was sent.
