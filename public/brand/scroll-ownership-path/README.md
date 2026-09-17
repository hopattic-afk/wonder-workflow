# Scroll art direction - Ownership path (Option A)
**For:** Sage (implement) · Reed (microcopy polish) · Morgan/Ian (glance only)  
**Status:** CORRECTED 2026-09-17 - industry-neutral primary; hospitality vignette-only.  
**Sage:** HOLD until this pack. Build only after Ian execute (already given) once pack corrected. No homepage PR until then.  
**Locked brief:** `/workspace/brand-audit/07-scroll-metaphor-LOCKED.md`

Talk-first. This folder is art + beat sheet for the locked metaphor. Blair does not deploy.

---

## Keep from proto (`/workspace/scroll-proto/mess-to-clear.html`)
- Sticky chapter + scroll scrub (tall track, sticky stage)
- Two-column stage: copy left, viz right (stack on small screens)
- Three beat bars + optional progress rail
- Sticky Assess CTA in the top banner
- Tokens: paper `#FAFAF8`, ink `#20232B`, accent `#7BA1AF`, muted ink `rgba(32,35,43,0.62)`
- Geometric CSS/SVG motion only. No WebGL.
- Scroll-linked lerp / ease between poses

## Replace
- Metaphor: mess-of-files → **ownership path** (Stuck → Named → Moving)
- Piece set: drop chat bubbles, sticky notes, folders, clips, ordered checklist cards
- New pieces: role tiles (Office / Crew / Owner), connectors, next-owner mark, steps-left path
- Copy: use `beat-sheet.md` (Reed polishes before live)
- **Do not** default stages to kitchen/bar. Hospitality tiles live in `vignette-hospitality/` for rotate only.

---

## Tokens
| Token | Value |
|-------|-------|
| Paper | `#FAFAF8` |
| Ink | `#20232B` |
| Accent | `#7BA1AF` |
| Muted ink | `rgba(32,35,43,0.62)` |
| Soft accent (optional) | `rgba(123,161,175,0.22)` |
| Hairline | `rgba(32,35,43,0.12)` |

## Geometry family
Reuse **steps-left** from the approved logo (`APPROVED-2026-09-15/logo/avatar-steps.svg`): three ascending flat squares, fill `#7BA1AF`, no 3D, no bevel, no shadow theater. Path and stage comps should feel like that mark extended into a chapter, not a new illustration language.

---

## Asset inventory
| File | Role |
|------|------|
| `role-tile.svg` | Generic role block (label via CSS/text later) |
| `role-tile-office.svg` | **Primary** Office |
| `role-tile-crew.svg` | **Primary** Crew |
| `role-tile-owner.svg` | **Primary** Owner |
| `connector.svg` | Inactive (muted ink) + active (accent) states in one file |
| `next-owner-mark.svg` | Tiny accent "next owner" pip |
| `path-steps.svg` | Clear path / steps-left family |
| `stage-stuck.svg` | Full composition Beat 01 (Office / Crew / Owner) |
| `stage-named.svg` | Full composition Beat 02 (Office / Crew / Owner) |
| `stage-moving.svg` | Full composition Beat 03 (Office / Crew / Owner) |
| `vignette-hospitality/` | Rotate-only kitchen / bar / owner tiles (not default stage) |
| `beat-sheet.md` | Eyebrow / H2 / body + rotate labels + Fit Review bridge |
| `LAYERS.md` | Scrub layer map |
| `README.md` | This file |

SVG only is the source of truth. No photoreal. No AI PNG hero dumps. Optional PNG proofs may be added later if a renderer is available; not required to start.

---

## Do
- Flat, crisp, editorial geometry on paper
- Primary stage labels: **Office / Crew / Owner** (field + construction + retail + hospitality without locking to restaurants)
- Three equal vignette labels under the same motion
- One accent "next owner" moment in Beat 02
- Steps-left path as the clear resolution in Beat 03
- CTA: Assess your operations → `/assessment`

## Don't
- Default kitchen/bar as the only or primary face
- Folders, clips, chat piles, kanban boards, checklists-as-hero
- File-sorting or "messy desk → tidy cards" story
- 3D steps, glossy SaaS chrome, WebGL
- Lead copy with "workflow" jargon (brand name OK)
- Em dashes in client-facing lines
- Elevate field/intake as the only product story
- Open a homepage PR or invent an execute ask
- AI-slop image dumps

---

## Sage implementation notes
1. **HOLD** until this corrected pack. Build only after Ian execute (already given) once pack is corrected.
2. **Keep** sticky chapter + scroll scrub + sticky Assess CTA.
3. **Swap** piece set + copy to ownership path (`beat-sheet.md` + primary SVGs here).
4. **Default stages** use Office / Crew / Owner only.
5. **Rotate** three vignette labels under the same motion: hospitality invoices / construction inventory / field (equal weight). Hospitality may swap in `vignette-hospitality/` tiles; construction and field keep Office / Crew / Owner.
6. **Reed** polishes microcopy before live.
7. Pose map suggestion:
   - `p < ~0.33` Stuck (tiles apart, connectors opacity 0)
   - mid Named (connectors draw, next-owner mark on)
   - late Moving (path-steps opacity/fill up; tiles settle onto path)
8. Role labels can be HTML/CSS over `role-tile.svg` so vignette rotate does not require new art for construction/field.

---

## Related
- Locked brief: `/workspace/brand-audit/07-scroll-metaphor-LOCKED.md`
- Approved vignettes: `/workspace/brand-audit/APPROVED-2026-09-16/06-hospitality-vignettes-copy-APPROVED.md`
- Logo steps cue: `/workspace/brand-audit/APPROVED-2026-09-15/logo/avatar-steps.svg`
- Proto (motion only): `/workspace/scroll-proto/mess-to-clear.html`
