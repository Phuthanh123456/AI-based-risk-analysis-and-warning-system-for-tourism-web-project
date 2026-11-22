import { useTranslate } from "../i18n/index.js";import { lazy, Suspense, useEffect, useMemo } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import CssBaseline from "@mui/material/CssBaseline";
import MuiDashboardShell from "../template/MuiDashboardShell";
import { TravelContext } from "./TravelContext";
import PlanPage from "../pages/PlanPage";
import ExplorePage from "../pages/ExplorePage";
import { LandingPage } from "../screens/LandingPage";
import "./TravelPortal.css";
import { useLanguage } from "../i18n/index.js";
import { enUS, viVN } from "@mui/material/locale";

const ResultPage = lazy(() => import("../pages/ResultPage"));
const WeatherPage = lazy(() => import("../pages/WeatherPage"));
const TrafficPage = lazy(() => import("../pages/TrafficPage"));
const NewsPage = lazy(() => import("../pages/NewsPage"));
const MapPage = lazy(() => import("../pages/MapPage"));
const ComparePage = lazy(() => import("../pages/ComparePage"));
const AlertsPage = lazy(() => import("../pages/AlertsPage"));
const HistoryPage = lazy(() => import("../pages/HistoryPage"));
const ProfilePage = lazy(() => import("../pages/ProfilePage"));
const ProvinceGuidePage = lazy(() => import("../pages/ProvinceGuidePage"));
const PlaceGuidePage = lazy(() => import("../pages/PlaceGuidePage"));
const ExperiencePage = lazy(() => import("../pages/ExperiencePage"));

function PortalRoutes({ context }) {const translate = useTranslate();
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    document.getElementById("portal-main")?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname]);

  function openTool(route = "/plan", place, prefillPurpose) {
    if (route === "/plan") navigate(route, { state: { prefillDestination: place, prefillPurpose } });else
    {
      if (place) context.updateDestination(place);
      navigate(route);
    }
  }
  if (location.pathname === "/") return <LandingPage signedIn travel={context} themeMode={context.theme} toggleTheme={context.toggleTheme} logout={context.logout} onGoToLogin={openTool} />;
  return (
    <TravelContext.Provider value={context}>
      <MuiDashboardShell themeMode={context.theme} toggleTheme={context.toggleTheme} logout={context.logout} email={context.session?.user?.email} fullWidth={location.pathname === "/map"}>
        {translate(context.err && location.pathname !== "/plan" && <Alert severity="error" sx={{ mb: 2 }} onClose={context.clearError}>{translate(context.err)}</Alert>)}
        <Suspense fallback={<Box className="portal-loading"><CircularProgress size={28} /><span>{translate("Đang mở trang…")}</span></Box>}>
          <Routes>
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/explore/:provinceId" element={<ProvinceGuidePage onSelect={(place) => openTool("/plan", place)} />} />
            <Route path="/explore/:provinceId/:placeId" element={<PlaceGuidePage onSelect={(place) => openTool("/plan", place)} />} />
            <Route path="/experiences/:categoryId" element={<ExperiencePage />} />
            <Route path="/plan" element={<PlanPage />} />
            <Route path="/result" element={<ResultPage />} />
            <Route path="/weather" element={<WeatherPage />} />
            <Route path="/traffic" element={<TrafficPage />} />
            <Route path="/news" element={<NewsPage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/profile" element={<ProfilePage email={context.session?.user?.email} />} />
            <Route path="*" element={<Navigate to="/plan" replace />} />
          </Routes>
        </Suspense>
      </MuiDashboardShell>
    </TravelContext.Provider>);

}

export default function TravelPortal(props) {
  const language = useLanguage();
  const theme = useMemo(() => createTheme({
    palette: {
      mode: props.theme === "dark" ? "dark" : "light",
      primary: { main: props.theme === "dark" ? "#ecb48e" : "#2b2720" },
      secondary: { main: "#b4532a" },
      background: props.theme === "dark" ? { default: "#171918", paper: "#222622" } : { default: "#f6f6f6", paper: "#ffffff" },
      text: props.theme === "dark" ? { primary: "#f2f2ed", secondary: "#b8bcb4" } : { primary: "#191919", secondary: "#686761" },
      divider: props.theme === "dark" ? "#3d443c" : "#e4e2dc"
    },
    typography: { fontFamily: '"Be Vietnam Pro", sans-serif', fontSize: 15, h1: { fontSize: "clamp(2.1rem, 2.7vw, 2.5rem)", lineHeight: 1.42, fontWeight: 700, letterSpacing: 0 }, h2: { fontSize: "1.65rem", lineHeight: 1.4, fontWeight: 700, letterSpacing: 0 }, h3: { fontSize: "1.3rem", lineHeight: 1.4, fontWeight: 700, letterSpacing: 0 }, body1: { fontSize: "1.0625rem", lineHeight: 1.8 }, body2: { fontSize: "1rem", lineHeight: 1.8 }, caption: { fontSize: ".8125rem", lineHeight: 1.7 }, subtitle1: { fontSize: "1.0625rem" } },
    shape: { borderRadius: 18 },
    components: { MuiButton: { styleOverrides: { root: { textTransform: "none", minHeight: 44, borderRadius: 100, fontWeight: 600, fontSize: 14, padding: "10px 22px" } } }, MuiCard: { styleOverrides: { root: { boxShadow: "none", border: "1px solid", borderColor: "var(--portal-border)" } } }, MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 18, fontSize: 17 } } }, MuiFormHelperText: { styleOverrides: { root: { fontSize: 13, lineHeight: 1.7 } } } }
  }, language === "en" ? enUS : viVN), [props.theme, language]);
  return <ThemeProvider theme={theme}><CssBaseline /><PortalRoutes context={props} /></ThemeProvider>;
}
