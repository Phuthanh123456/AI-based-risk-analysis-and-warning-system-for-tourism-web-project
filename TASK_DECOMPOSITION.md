# Tourism UI redesign milestones

Scope: existing travel-ui; preserve backend, model logic, data and API contracts. No deployment or remote push requested. Each milestone records focused validation and a separate commit.

| Milestone | Acceptance criteria | Status |
| --- | --- | --- |
| M0 Audit + reference | Source/routes/endpoints and preservation constraints documented; reference observations and limits explicit | Complete — UI_UX_AUDIT.md |
| M1 Tokens + shared layout | Vietnamese font, shared colors/spacing/buttons, travel top navigation/mobile menu/footer, no permanent admin sidebar | Complete — design-system/MASTER.md and shared tourism presentation |
| M2 Homepage | Photographic hero, image-first destinations, real feature actions, storytelling/how-it-works/CTA; reduced motion | Complete — local imagery and real navigation |
| M3 Explore | Existing province API, working search, image associations, loading/error/empty states; choose destination for plan | Complete — public /explore backed by /map/points |
| M4 Risk + weather | Preserve all score/response meanings; coherent banners/forms/verdict; chart only from returned forecast | Complete — direct forecast chart with accessible data table |
| M5 Map + other pages | Large dedicated map/search, existing markers/layers; news/traffic/compare/alerts/history/auth follow shared system | Pending |
| M6 Visual QA | Build/lint, desktop/mobile/tablet screenshots, no horizontal overflow, route/auth/error checks, document real API limits | Pending |

## Session baseline

Initial HEAD b37aeb5, clean working tree. This session's pre-spec landing work is included in the milestones; do not overwrite unrelated work. No secrets, node_modules, model files, dataset changes or temporary checkpoints may be staged.

## Checks and evidence

M1: npm run build passed. Initial lint found two JSX naming issues in new files; corrected before milestone commit. Full regression/visual QA is recorded at M6.

M2/M3 are committed together because public home navigation and its Explore destination must be introduced atomically. BrowserRouter now lives at the entry point; existing auth/session behavior remains and selected destinations are carried to the existing plan form after login. Full build and lint passed before the commit. Experience-category filters are deliberately omitted: the existing province API supplies no such taxonomy. Search and pagination operate on returned province records.

M4: npm run lint and npm run build passed. Weather chart reads the existing temperature and adjusted_risk_score/risk_score fields; missing values remain gaps. The original verdict mapping, thresholds and result calculations were not changed. Plan form retains GPS, date, purpose and request behavior.
