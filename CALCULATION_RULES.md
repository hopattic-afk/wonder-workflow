# Calculation rules

All amounts are estimates in the session's currency (USD default, CAD optional). No currency conversion or sales tax. Working weeks default to 50 and may be set above 0 through 52. Percentage inputs are 0–100 and are divided by 100 internally. Display formatting uses ISO currency codes so USD and CAD remain distinguishable. Computation retains precision; rounding occurs only in display.

| Output                                | Formula                                                            |
| ------------------------------------- | ------------------------------------------------------------------ |
| Current weekly hours                  | Sum of role hours                                                  |
| Current annual labor cost             | Sum(hours × rate × weeks)                                          |
| Weekly hours reclaimed                | Sum(hours × reduction / 100)                                       |
| Annual hours reclaimed                | Weekly hours reclaimed × weeks                                     |
| Annual labor savings                  | Sum(hours × reduction / 100 × rate × weeks)                        |
| Current / future annual software cost | Sum(monthly amount × 12)                                           |
| Annual subscription savings           | Sum(max(current monthly − future monthly, 0) × 12)                 |
| Annual rework savings                 | Sum(incidents/month × cost/incident × 12 × reduction / 100)        |
| Included avoided hire                 | Annual loaded cost × percentage / 100, only if explicitly included |
| New annual recurring costs            | Sum(monthly × 12 + annual)                                         |
| Gross annual savings                  | Labor + subscription + rework + included avoided hire              |
| Net annual recurring savings          | Gross − new recurring costs                                        |
| Final project price                   | Manually entered proposed price − optional discount                |
| First-year net benefit                | Net − final price                                                  |
| Payback months                        | Final price ÷ (net / 12), only for net > 0                         |
| First-year ROI %                      | First-year net benefit ÷ final price × 100, only for price > 0     |
| Annual value multiple                 | Net ÷ final price, only for price > 0                              |

Missing-data policy:

- Empty categories contribute zero to a case with configured rows. An entirely empty financial case has unknown gross/net savings, shown as `Not established`.
- Every configured row requires all its calculation inputs. A blank role rate makes labor savings unknown even if hours are present. One incomplete row makes its aggregate unknown; it is never silently omitted.
- Recurring rows require both monthly and annual amounts: explicitly enter 0 for the unused billing interval. The two values are additive and must describe different costs, not duplicate representations of one charge.
- Avoided hire is excluded by default. When included, both cost and percentage are required. Check for overlap with labor savings.
- Optional blank discount means no discount. Proposed price is always blank initially. A discount above the proposed price makes final price unknown and triggers a warning.
- A software increase contributes zero subscription savings according to the requested formula. An explicit warning asks the user to include the increase in recurring costs.
- Missing project price leaves payback, ROI, value multiple, and first-year benefit unknown while recurring savings can still be known.
- A zero price with positive savings has zero-month payback; ROI and value multiple remain unknown (no division by zero). Nonpositive net savings do not have a financial payback. Negative benefits and ROI remain negative.
- A known annual value multiple below 3 triggers the requested internal value warning. Warnings do not block drafting.

Pilot fit: all ten ratings must be supplied. The first nine contribute `(rating − 1)` and operational risk contributes `(5 − rating)`. Divide the sum by 40 and multiply by 100, rounded to the nearest integer. This maps the full range to 0–100. 75–100 is Strong Pilot Candidate; 50–74 Requires Additional Scoping; below 50 Weak Initial Pilot. It is internal decision support based on audit inputs, not a validated scientific measure. Risk warnings are independent of the score.

The required worked example is exercised in `src/domain/domain.test.ts`: labor 7,500; subscription 2,400; rework 2,400; recurring 1,200; gross 12,300; net 11,100; manual price 3,000; first-year benefit 8,100; ROI 270%; payback about 3.24 months; annual multiple 3.7.
