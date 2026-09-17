# Stage SVG layers (for Sage scrub)

Separate files are the source of truth (`stage-stuck.svg`, `stage-named.svg`, `stage-moving.svg`).

**Primary roles (default):** Office / Crew / Owner.  
**Hospitality kitchen/bar:** rotate-only via `vignette-hospitality/`; never the sole default face.

Suggested DOM layers if compositing one master SVG:

1. `bg` - paper + card frame  
2. `roles` - three role tiles Office / Crew / Owner (positions lerp Stuck → Named → Moving)  
3. `connectors` - opacity 0 in Stuck; accent in Named; fade into path in Moving  
4. `next-owner` - opacity 0 until Named; stays on active role in Moving  
5. `path-steps` - opacity 0 until Moving; fill draws left→right  

Piece SVGs (`role-tile-office.svg`, `role-tile-crew.svg`, `role-tile-owner.svg`, `connector.svg`, `next-owner-mark.svg`, `path-steps.svg`) are preferred for CSS/JS animation over inlining the full stage comps.

Vignette swap: when rotate = hospitality invoices, optionally substitute `vignette-hospitality/role-tile-*.svg` labels; keep the same layer stack and motion.
