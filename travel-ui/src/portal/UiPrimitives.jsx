import { useTranslate } from "../i18n/index.js"; // MetricCard adapts the card title/value/content structure of MUI Dashboard
// StatCard.tsx (MIT). Demo trends and data have been removed.
import { Link, useLocation } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

export function PageIntro({ eyebrow, title, description, action }) {const translate = useTranslate();
  const { pathname } = useLocation();
  const photo = { "/plan": "halong.webp", "/result": "saigon-bridge.webp", "/weather": "halong-karsts.webp", "/traffic": "saigon-night.webp", "/news": "hoian.webp", "/map": "halong.webp", "/compare": "saigon-bridge.webp", "/alerts": "halong-karsts.webp", "/history": "hoian-lanterns.webp" }[pathname] || "halong.webp";
  return <header className="portal-page-header"><img src={"/images/landing/" + photo} alt={translate("")} /><div className="portal-banner-shade" /><div className="portal-banner-content"><p className="portal-eyebrow"><Link to="/">{translate("VIỆT NAM")}</Link><span aria-hidden="true">{translate(" / ")}</span>{translate(eyebrow)}</p><Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "start", sm: "center" }} flexWrap="wrap" sx={{ gap: 2 }}><Typography component="h1" variant="h1" sx={{ minWidth: 0, flex: { xs: "0 1 auto", sm: action ? "1 1 480px" : "1 1 auto" } }}>{translate(title)}</Typography>{translate(action)}</Stack>{translate(description && <Typography component="p" variant="body1">{translate(description)}</Typography>)}</div></header>;
}

export function MetricCard({ title, value, helper, tone = "default", icon, to }) {const translate = useTranslate();
  const inner = <CardContent sx={{ p: "20px !important" }}><Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ gap: 1 }}><Typography component="h2" variant="body2" color="text.secondary" fontWeight={650}>{translate(title)}</Typography>{translate(icon && <Box aria-hidden="true" sx={{ color: tone === "danger" ? "error.main" : tone === "caution" ? "warning.main" : "primary.main" }}>{translate(icon)}</Box>)}</Stack><Typography component="p" className="portal-metric-value" sx={{ mt: 1, color: tone === "danger" ? "error.main" : tone === "caution" ? "warning.dark" : "text.primary" }}>{translate(value ?? "Chưa có dữ liệu")}</Typography>{translate(helper && <Typography component="p" variant="body2" color="text.secondary" sx={{ mt: 1 }}>{translate(helper)}</Typography>)}</CardContent>;
  return <Card component={to ? Link : "div"} to={to} variant="outlined" className={"portal-metric " + (to ? "portal-card-link" : "")}>{translate(inner)}</Card>;
}

export function DataState({ title, description, action = "/plan", actionLabel = "Lập kế hoạch chuyến đi", severity = "info" }) {const translate = useTranslate();
  return <Alert severity={severity} variant="outlined" action={action ? <Button component={Link} to={action} size="small">{translate(actionLabel)}</Button> : null}><strong>{translate(title)}</strong>{translate(description && <div>{translate(description)}</div>)}</Alert>;
}

export function SourceNote({ children }) {const translate = useTranslate();
  return <aside className="portal-source-note"><details><summary>{translate("Nguồn thông tin & cách đọc kết quả")}</summary><Typography component="p" variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>{translate(children)}</Typography></details></aside>;
}

export function RiskChip({ score }) {const translate = useTranslate();
  if (score == null) return <Chip label={translate("Chưa có điểm")} size="small" variant="outlined" />;
  const n = Number(score);
  return <Chip label={translate(`${n.toFixed(1)}/10 · ${n >= 7 ? "Cao" : n >= 4 ? "Cần lưu ý" : "Thấp"}`)} size="small" color={n >= 7 ? "error" : n >= 4 ? "warning" : "success"} variant="outlined" />;
}
