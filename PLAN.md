# Implementation plan and delivery boundaries

## Requirements and architecture

- Empty repository inspected before scaffolding. Build a static React/TypeScript/Vite application with Tailwind CSS, React Router, React Hook Form, Zod, Vitest/Testing Library, and Playwright.
- Keep one session across Audit → Calculator → Recommendation → Proposal. Use versioned, validated browser-local data; no backend, credentials, external APIs, tracking, or deployment.
- Use dark warm surfaces, restrained gold, keyboard-accessible fields and actions, compact laptop layouts, and separate white print documents.

## Ownership

- Atlas: application shell, dashboard, worksheet, calculator editor, settings, persistence lifecycle, styling, integration, E2E/print verification, and final documentation.
- Forge: typed domain contracts, strict schemas, defaults, financial formulas, risk/Pilot-Fit logic, storage serialization, local document generation, and domain tests.
- Bolt: editable recommendation/proposal screens, print layouts, copy tools, payment controls, and document UI tests.
- Sentinel: independent implementation review, findings, and fix verification. No production actions or external messages delegated.

## Implementation slices

1. Establish typed session/store contract and locally installed dependencies.
2. Build dashboard lifecycle, autosave, audit fields, process/software rows, timer, and call notes.
3. Implement conservative financial calculations and live estimate summary, missing-value behavior, USD/CAD, and manual pricing.
4. Generate editable decision-aware documents with opt-in internal content and client print layouts.
5. Build validated backup restore, settings/logo defaults, confirmation gates, failure handling, and cross-tab conflict protection.
6. Run independent Sentinel review, fix verified findings, and add regressions.
7. Verify tests, production build, browser journey, responsive widths, no unexpected network requests, and PDF pagination; document actual results in TESTING.md.

## Explicit decisions

- A missing amount is `null`; zero must be entered intentionally in configured cost/benefit rows. Empty categories contribute zero to a configured calculator but are not evidence for a client-facing claim.
- Avoided-hire savings are excluded until explicitly enabled. Implementation price, discounts, support, deposit, and payment selection are unset by default.
- A proposal duplicate is an independent full-session copy, preserving its audit and financial assumptions.
- Import is a reviewable operation with merge/replace choices and confirmation; parsing never mutates stored data.
- No automatic implementation duration, acceptance accuracy, public case-study permission, or project price.
- Negative decisions, marketing referral, missing data rights, missing reviewer, and other guardrails cannot be overridden by a high numerical fit score.
- Settings apply to new sessions where appropriate; document/company branding is shared. The app does not perform currency conversion.

## Approval boundaries

The deliverable is local code and a local production preview. No deployment, migration, external messaging, payment, authentication change, or publication is included. Netlify setup is documented only.
