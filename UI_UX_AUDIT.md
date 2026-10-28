# UI/UX audit — 28 October 2026

## Baseline and scope

Repository: AI-based-risk-analysis-and-warning-system-for-tourism. Baseline HEAD: b37aeb5. Initial working tree was clean. Before the expanded specification arrived, this session had started modifying App.jsx, LandingPage.jsx and MuiDashboardShell.jsx, and adding licensed local travel photos. Those are session changes, not pre-existing user work; they are retained and reviewed in the milestones below. No backend, dataset, model or secret file is included in this redesign.

## Actual frontend

- `travel-ui/src/main.jsx`: React 19 entry, locally packaged Be Vietnam Pro weights 400–700.
- Vite 7, React Router 7, MUI 9 + Emotion, MUI SVG icons, Framer Motion 12, React Leaflet 5/Leaflet 1.9, Recharts 3.
- `src/App.jsx`: authentication/session, trip context, GPS, province loading, API trip requests, forecast, push subscriptions and history orchestration.
- `src/api.js`: existing API_BASE and HTTP helpers; `src/push.js` + public/sw.js implement Web Push.
- `src/portal/TravelPortal.jsx`: theme, context and lazy route views. `TravelContext.js` shares the existing state. `format.js` maps API verdicts and formats dates/numbers.
- `src/template/MuiDashboardShell.jsx`: original MUI sidebar shell; to become travel navigation rather than an administration layout.
- Styling: index.css and App.css global rules, TravelPortal.css for route presentation; older TravelWorkspace.css/component remain in the repository. Landing and authentication previously used substantial inline styling.
- No AGENTS.md or separate hooks/services directory was found. Do not introduce an assumed framework or replace the app.

## Routes and redesign mapping

| Existing view | Component | Redesign |
| --- | --- | --- |
| Public home before authentication | screens/LandingPage.jsx | Photographic tourism home, editorial exploration, real feature actions |
| Login/register state screens | screens/LoginScreen.jsx, RegisterScreen.jsx | Shared photo/editorial authentication, same submit contracts |
| /plan (and authenticated / redirect) | pages/PlanPage.jsx | Travel planning form, destination banner, existing GPS/purpose/date flow |
| /result | pages/ResultPage.jsx | Clear verdict, reasons, sources and same score display |
| /weather | pages/WeatherPage.jsx | Forecast timeline/real-data chart and readable weather conditions |
| /traffic | pages/TrafficPage.jsx | Route information, preserved live/estimated distinctions |
| /news | pages/NewsPage.jsx | Local editorial news, province selection, stale/empty/error states |
| /map | pages/MapPage.jsx | Large dedicated map, province search; preserve markers/heat/geometry |
| /compare | pages/ComparePage.jsx | Existing 2–4 province comparison and source limitations |
| /alerts | pages/AlertsPage.jsx | Existing subscription/check-now controls and browser permissions |
| /history | pages/HistoryPage.jsx | Saved trip list, confirmation before deletion |

The requested Explore view does not currently exist. Add `/explore` as a presentation view over the **existing `/map/points` API**, not a new tourism database. Search operates on returned province names. Images are editorial associations with existing provinces; unmatched provinces use an explicitly illustrative Vietnam panorama. No safety ranking, live metrics, category labels or synthetic API results are generated.

## Verified data flow and API contracts

Frontend `App.jsx` → `GET /map/points` → nationwide province coordinates; selected province → `GET /risk?place=...`.

Plan form → `GET /trip?destination=...&lat=...&lon=...` with optional trip_purpose → backend combines weather model, news evidence and traffic. Response keys `to`, `from`, `weather`, `risk`, `traffic`, `recommendation` remain unchanged. Polyline/polyline6 decoding stays in App. Forecast → `GET /weather/ai/forecast?city=...&days=7` with existing province/purpose/coordinates parameters.

- News: `/risk`, `/risk/events?place=...&limit=12`.
- Comparison: `/risk/compare?places=...`; `/risk/trend` exists server-side but is not requested by the current route views.
- Map: `/map/heat`, `/map/points`; OpenStreetMap tiles and attribution.
- Authentication: `POST /api/auth/login`, `POST /api/auth/register`; `{email,password}` and `{user,token}` response usage. Existing JWT/session storage and expiry stay intact.
- History: `GET /api/trip-history`, `DELETE /api/trip-history/{id}` using bearer token.
- Notifications: vapid-public-key, subscriptions, subscribe, unsubscribe, check-now under `/api/notifications`; browser Service Worker and geolocation permission flows remain.
- Vite proxies `/api`, `/trip`, `/risk`, `/weather/`, `/map/`, `/gps`, `/traffic/`, `/health`, `/debug` to localhost:8000. Production uses the existing API_BASE.

Backend read-only verification: src/api/app.py, auth.py, notifications.py, weather_ai.py and README identify FastAPI, SQLite, XGBoost weather with safety rules, offline TF-IDF news probabilities and optional PhoBERT. No changes to these implementations are part of this task.

## Logic that must remain

Keep getVerdict, RiskChip thresholds, stale-news response handling, highest-score calculation, date/purpose invalidation, saved-context age checks, geolocation, route fallback warning, forecast selected-day semantics, source notes, authentication, history confirmation and notification permission handling. Never turn missing data into a low-risk score. Keep all nationwide API points; TP.HCM is editorial imagery only.

## Reference observation

Read https://discoverhcmc.com/, /dia-diem/ and attempted /ban-do/. Homepage was inspected in the previous part of this session: pale sky/illustrated skyline hero, very large left-aligned typography, transparent navigation, blue pill actions, navy ticker, image-first cards and broad section spacing. The new specification explicitly requests a photographic hero; use original/local licensed photography for that treatment while retaining the observed typography/navigation rhythm. Destination index has location and experience filters, search, photo cards and pagination. Its tourism categories cannot be reused as if supported by this project's province API. Web retrieval of /ban-do/ returned a cache-miss error; browser inspection will be attempted and any remaining limitation recorded.

Assets: licensed Unsplash WebP files with PHOTO_CREDITS.md; separately generated original Vietnam skyline illustration, not copied from Discover HCMC. All important text remains HTML and supports Vietnamese.

## Validation

Build with npm run build; lint with npm run lint (record baseline findings). Browser QA: 1440px, 768px, 390px/375px, reduced motion, image loading, menu keyboard behavior, route actions, auth and API failure states. Fixture-driven browser checks are QA-only and never appear as production analytical data. Real external weather/routing/push delivery requires a running configured backend and actual browser permission.
