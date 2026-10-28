// Tourism navigation replaces the original administration sidebar.
import { SiteHeader, SiteFooter } from "../tourism/SiteChrome";

export default function MuiDashboardShell({ children, themeMode, toggleTheme, logout, fullWidth = false }) {
  return <div className="portal-shell tourism-shell">
    <a className="tour-skip" href="#portal-main">Đi đến nội dung</a>
    <SiteHeader signedIn themeMode={themeMode} toggleTheme={toggleTheme} logout={logout} />
    <main id="portal-main" tabIndex={-1} className={"portal-main" + (fullWidth ? " portal-main-map" : "")}><div className="portal-content">{children}</div></main>
    <SiteFooter />
  </div>;
}
