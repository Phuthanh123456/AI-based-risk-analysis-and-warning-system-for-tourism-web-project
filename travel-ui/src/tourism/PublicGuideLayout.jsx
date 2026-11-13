import { useTranslate } from "../i18n/index.js";import { Outlet } from "react-router-dom";
import { Suspense } from "react";
import { SiteHeader, SiteFooter } from "./SiteChrome";

export default function PublicGuideLayout({ onLogin }) {const translate = useTranslate();
  return <div className="tour-site"><SiteHeader onLogin={onLogin} /><main id="public-explore"><Suspense fallback={<div className="portal-loading" role="status">{translate("Đang mở hướng dẫn khám phá…")}</div>}><Outlet /></Suspense></main><SiteFooter /></div>;
}
