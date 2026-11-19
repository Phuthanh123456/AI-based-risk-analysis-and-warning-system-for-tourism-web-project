import { useLocation } from "react-router-dom";
import { useTranslate } from "../i18n/index.js"; // Tourism navigation replaces the original administration sidebar.
import { SiteHeader, SiteFooter } from "../tourism/SiteChrome";
import WorkspaceNavigation from "../tourism/WorkspaceNavigation";

export default function MuiDashboardShell({ children, themeMode, toggleTheme, logout, fullWidth = false }) {
  const translate = useTranslate();
  const { pathname } = useLocation();
  return <div className="portal-shell tourism-shell guardian-workspace">
    <a className="tour-skip" href="#portal-main">{translate("Đi đến nội dung")}</a>
    <SiteHeader signedIn themeMode={themeMode} toggleTheme={toggleTheme} logout={logout} />
    <WorkspaceNavigation />
    <main id="portal-main" tabIndex={-1} className={"portal-main" + (fullWidth ? " portal-main-map" : "")}><div key={pathname} className="portal-content">{translate(children)}</div></main>
    <SiteFooter />
  </div>;
}
