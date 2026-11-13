import { useTranslate } from "../i18n/index.js"; // Tourism navigation replaces the original administration sidebar.
import { SiteHeader, SiteFooter } from "../tourism/SiteChrome";

export default function MuiDashboardShell({ children, themeMode, toggleTheme, logout, fullWidth = false }) {const translate = useTranslate();
  return <div className="portal-shell tourism-shell">
    <a className="tour-skip" href="#portal-main">{translate("Đi đến nội dung")}</a>
    <SiteHeader signedIn themeMode={themeMode} toggleTheme={toggleTheme} logout={logout} />
    <main id="portal-main" tabIndex={-1} className={"portal-main" + (fullWidth ? " portal-main-map" : "")}><div className="portal-content">{translate(children)}</div></main>
    <SiteFooter />
  </div>;
}
