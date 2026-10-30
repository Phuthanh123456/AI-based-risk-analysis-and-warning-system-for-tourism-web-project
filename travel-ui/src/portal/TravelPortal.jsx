import { lazy, Suspense, useEffect, useMemo } from "react";
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

const ResultPage = lazy(() => import("../pages/ResultPage"));
const WeatherPage = lazy(() => import("../pages/WeatherPage"));
const TrafficPage = lazy(() => import("../pages/TrafficPage"));
const NewsPage = lazy(() => import("../pages/NewsPage"));
const MapPage = lazy(() => import("../pages/MapPage"));
const ComparePage = lazy(() => import("../pages/ComparePage"));
const AlertsPage = lazy(() => import("../pages/AlertsPage"));
const HistoryPage = lazy(() => import("../pages/HistoryPage"));
const ProvinceGuidePage = lazy(() => import("../pages/ProvinceGuidePage"));
const PlaceGuidePage = lazy(() => import("../pages/PlaceGuidePage"));
const ExperiencePage = lazy(() => import("../pages/ExperiencePage"));

function PortalRoutes({ context }) {
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    document.getElementById("portal-main")?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname]);

  function openTool(route = "/plan", place) {
    if (place) context.updateDestination(place);
    navigate(route);
  }
  if (location.pathname === "/") return <LandingPage signedIn themeMode={context.theme} toggleTheme={context.toggleTheme} logout={context.logout} onGoToLogin={openTool} />;
  return (
    <TravelContext.Provider value={context}>
      <MuiDashboardShell themeMode={context.theme} toggleTheme={context.toggleTheme} logout={context.logout} email={context.session?.user?.email} fullWidth={location.pathname === "/map"}>
        {context.err && <Alert severity="error" sx={{ mb: 2 }} onClose={context.clearError}>{context.err}</Alert>}
        <Suspense fallback={<Box className="portal-loading"><CircularProgress size={28} /><span>Đang mở trang…</span></Box>}>
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
            <Route path="*" element={<Navigate to="/plan" replace />} />
          </Routes>
        </Suspense>
      </MuiDashboardShell>
    </TravelContext.Provider>
  );
}

export default function TravelPortal(props) {
  const theme = useMemo(() => createTheme({
    palette: {
      mode: props.theme === "dark" ? "dark" : "light",
      primary: { main: props.theme === "dark" ? "#8bc8f4" : "#006db8" },
      secondary: { main: "#bd773e" },
      background: props.theme === "dark" ? { default: "#111e2c", paper: "#192a3c" } : { default: "#fbfaf6", paper: "#ffffff" },
      text: props.theme === "dark" ? { primary: "#eef5fc", secondary: "#b7c8d8" } : { primary: "#132b42", secondary: "#536778" },
      divider: props.theme === "dark" ? "#34485b" : "#dce5e8",
    },
    typography: { fontFamily: '"Lexend Deca", sans-serif', fontSize: 14, h1: { fontSize: "clamp(1.9rem, 2.5vw, 2.25rem)", lineHeight: 1.42, fontWeight: 700, letterSpacing: 0 }, h2: { fontSize: "1.5rem", lineHeight: 1.4, fontWeight: 700, letterSpacing: 0 }, h3: { fontSize: "1.18rem", lineHeight: 1.4, fontWeight: 700, letterSpacing: 0 }, body1: { lineHeight: 1.65 }, body2: { lineHeight: 1.6 } },
    shape: { borderRadius: 12 },
    components: { MuiButton: { styleOverrides: { root: { textTransform: "none", minHeight: 44, borderRadius: 100, fontWeight: 600, fontSize: 12, padding: "10px 22px" } } }, MuiCard: { styleOverrides: { root: { boxShadow: "none", border: "1px solid", borderColor: "var(--portal-border)" } } }, MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 12 } } } },
  }), [props.theme]);
  return <ThemeProvider theme={theme}><CssBaseline /><PortalRoutes context={props} /></ThemeProvider>;
}
