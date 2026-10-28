# Vietnam Travel Risk AI — presentation system

Direction: editorial tourism portal, informed by the observed Discover HCMC navigation, destination photography, large type, blue actions and generous section rhythm. The user's expanded brief selects a photographic hero. Original branding, local licensed imagery and HTML Vietnamese copy are used.

- Font: locally packaged Be Vietnam Pro 400/500/600/700; full Vietnamese glyph support.
- Primary/action: #006db8. Navy/footer: #152e53. Ink: #132b42. Muted text: #536778. Paper: #fbfaf6. Line: #dce5e8. Gold is decorative/focus only.
- Dark tokens live in Tourism.css; risk error/warning/success retain MUI semantics and existing classification thresholds.
- Spacing: 4/8px rhythm; fluid 20–80px page gutters, 60–100px public section spacing, 1280px content measure.
- Shape: 18–20px imagery/sections, pill primary actions, 12px form fields; no permanent sidebar.
- Navigation: real routes, top links plus utilities disclosure; mobile drawer with focus management. Footer links target real routes.
- Type: fluid 40–78px home headline, 30–52px section titles, 28–47px page banners. Small caps are labels only; long text uses ordinary case.
- Motion: Framer Motion one-time 22px scroll reveals, image hover scale 1.06, short header/menu transitions. prefers-reduced-motion removes decorative movement.
- Images: explicit aspect containers, lazy loading below hero; Unsplash sources in public/images/landing/PHOTO_CREDITS.md. Illustration is explicitly labeled.
- Data: never infer safety from missing evidence. No illustrative charts or live numbers in production. Source dates, stale flags, absent traffic and empty states remain visible.

Implementation: src/tourism/Tourism.css and SiteChrome.jsx; route presentation in portal/TravelPortal.css. UI-UX Pro Max was queried for tourism/editorial design, React performance and reduced-motion guidance; its Thai font suggestion was rejected in favor of the existing Vietnamese font.
