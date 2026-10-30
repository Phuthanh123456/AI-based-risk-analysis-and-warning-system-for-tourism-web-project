import { Outlet } from "react-router-dom";
import { Suspense } from "react";
import { SiteHeader, SiteFooter } from "./SiteChrome";

export default function PublicGuideLayout({ onLogin }) {
  return <div className="tour-site"><SiteHeader onLogin={onLogin} /><main id="public-explore"><Suspense fallback={<div className="portal-loading" role="status">Đang mở hướng dẫn khám phá…</div>}><Outlet /></Suspense></main><SiteFooter /></div>;
}
