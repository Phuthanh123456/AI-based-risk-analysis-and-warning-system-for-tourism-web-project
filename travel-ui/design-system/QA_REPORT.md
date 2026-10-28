# Tourism UI visual review — 2026-10-28

M0–M6 are complete. Preview: http://localhost:4173; backend: http://localhost:8000. Run `npm run build` then `npm run preview -- --host 127.0.0.1 --port 4173` in travel-ui to refresh the production preview after later edits.

## Typography and assets

Discover HCMC's homepage public CSS declares Lexend Deca for content and headings. The frontend now uses that same family throughout CSS, MUI, authentication and map popups. Google Fonts WOFF2 subsets are hosted locally at public/fonts/lexend-deca, including Vietnamese and variable weights 300–700; OFL.txt and FONT_CREDITS.md accompany them. Browser computed styles and font loading were checked in every reviewed view.

The original generated skyline was encoded from PNG (2,115,484 bytes) to WebP (190,138 bytes). Its imagegen prompt and illustration status are recorded in PHOTO_CREDITS.md alongside the licensed travel photography. All images are local; reference screenshots are review evidence only.

## Checks completed

- `npm run lint`: passed.
- `npm run build`: passed; all existing route chunks built.
- `node scripts/visual-review.mjs`: passed, 23 browser views and 6 interaction checks.
- Desktop 1440px, tablet 768px, mobile 390px and small mobile 375px: no document horizontal overflow, broken images or uncaught JavaScript exceptions in the reviewed views.
- Reviewed home, Explore, plan, result, weather, map, news, comparison, alerts, history, traffic and login, plus Explore empty/error states and reduced-motion home.
- Search without Vietnamese accents, destination-to-login handoff, retained destination after login, mobile drawer, weather navigation and logout all passed.
- Inspected desktop/mobile screenshots for typography, Vietnamese accents, hero overlays, route banners, chart, map and source disclosure.

Screenshots and JSON reports are local and ignored under artifacts/tourism-review. The review script uses Chrome DevTools Protocol and an isolated temporary browser profile; no extra npm dependency is needed. Execute it while the production preview is running.

## Data and test boundaries

Private-page visual reviews and the six interaction checks use explicitly isolated browser fixtures. They validate rendering and navigation, not model accuracy, real authentication or delivery of notifications. Fixtures never enter production source/API responses. The live Explore view was also checked against the running backend, which returned 66 configured records; no province count is hardcoded in the UI.

The separate routing repair e856bca was checked against the real /trip endpoint: TP. Hồ Chí Minh → Đồng Tháp resolved to 10.4938,105.6882, returned an OSRM driving route of 144.3 km and 130 minutes, and decoded into 1,573 points using the frontend polyline library. This is a route estimate, not live congestion data. Backend health returned ok. Weather forecast retrieval succeeded in a live API check; upstream air-quality retrieval timed out in another request, so third-party availability remains variable.

Before a public release, check real account login/register, geolocation permission on the target device, history deletion, notification permissions/subscription and actual push delivery. These browser/account actions were not exercised against the user's real records. Dated news remains marked stale where returned; missing data remains explicit.

## Preservation and commits

Dataset files, model weights/training, risk thresholds, inference/classification and existing API response fields are unchanged by the UI work. The user-requested canonical-province routing correction was committed separately.

- aac1f60 — M0 audit and decomposition.
- 7f7ccab — M1 shared layout/design system.
- 69b68aa — M2/M3 home and live Explore.
- af94522 — M4 risk and weather presentation.
- 7703eb0 — M5 map and account journeys.
- e856bca — separate routing correction.
- M6 is the commit containing this report: font matching, responsive polish, image optimization and browser review.

No remote push or deployment was performed.
