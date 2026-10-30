# Tourism catalogue review

Completed 2026-10-30. Content/source research and the public-page browser review were performed 2026-10-28; the authenticated-page review and final lint/data checks were completed 2026-10-30. Commits use the actual current time.

## Results

- Production build passed after the final UI edits; no new frontend dependency.
- ESLint passed; `node scripts/check-tourism-catalog.mjs` passed.
- Data checks: 34 current provinces/cities, 6 centrally administered cities, 63 unique historical names, 90 editorial guides, 78 licensed Commons photographs. Every current province has at least two guides and a photograph of the region.
- Live API compatibility check: `/map/points` returned 66 historical/configured records; the frontend adapter produced 34 current reference markers. `/health` returned HTTP 200 on the final review date.
- Chrome public/feature review: 22 views, including 1440/768/390/375px, province and individual-place pages, cuisine/culture/nature categories, empty/not-found states, planning and map views, plus the homepage experience section.
- Chrome authenticated review: 5 additional views, covering Explore at desktop/mobile and province/place/cuisine routes on mobile.
- Across all 27 reviewed views: zero uncaught JavaScript exceptions, broken images or document horizontal overflow. Computed typography remained Lexend Deca.
- Ten interaction checks passed: legacy search without accents, opening a province and its merger information, opening a place and sources, login handoff, retained historical risk region, mobile menu open/close, weather navigation, logout, cuisine navigation and filtering cuisine by current province.
- Manually inspected the province/photo contact sheet, desktop Explore, mobile place detail and authenticated mobile Explore. Removed a same-named Chinese-city photo from Mai Châu and replaced it with the verified Vietnamese location; corrected ambiguous source titles and excluded imagery of a different cake.

## Evidence and limits

Local screenshots/reports are ignored under `artifacts/tourism-guide/review`: `catalog-report.json`, `catalog-authenticated-report.json`, `catalog-interactions.json`, and full-page/viewport PNGs. The browser checks use an isolated profile; authenticated state and auth responses are fixtures. No real user history was changed and no model accuracy claim is derived from those fixtures.

The editorial directory is local and remains browsable without an API connection. Actual trip assessment, weather, account operations and push delivery continue to depend on their existing services. Historical news/risk coverage is displayed explicitly; current-marker grouping does not combine old risk scores or create new geographic boundaries. Reference coordinates are not newly surveyed administrative centres.

Some individual entries use clearly credited regional imagery; food photographs illustrate the type of dish rather than a named restaurant. A missing exact photograph is not replaced with a mislabeled food image. Opening hours, prices and access restrictions must be checked with the operator; the catalogue does not claim a complete inventory of Vietnam's tourism sites.

## Commits

- `305958e`: sourced administrative/content catalogue, media and data integrity tooling.
- The UI commit containing this report completes the new routes, experience grid, current-name origin/map adapters and browser review.

No remote push or deployment was performed. Local preview remains at http://localhost:4173/explore.
