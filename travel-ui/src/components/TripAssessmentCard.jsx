import { useTranslate } from "../i18n/index.js";import { Link } from "react-router-dom";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import FactorScale from "./FactorScale";

export default function TripAssessmentCard({ factor, detail = true }) {const translate = useTranslate();
  return <Box className="portal-section" sx={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
    <Typography component="h2" variant="h3">{translate(factor.title)}</Typography>
    {translate(!/Chưa|chưa khả dụng/.test(factor.label) && <Chip label={translate(factor.label)} color={factor.tone} variant="outlined" sx={{ alignSelf: "start", maxWidth: "100%", height: "auto", "& .MuiChip-label": { whiteSpace: "normal", py: 0.5 } }} />)}
    {translate(["weather", "news"].includes(factor.key) && <FactorScale score={factor.score} qualitative={factor.key === "news"} label={translate(factor.key === "news" ? "Mức lưu ý từ tin tức" : "Thang rủi ro thời tiết")} />)}
    <Box component="dl" sx={{ m: 0, display: "grid", gap: 1.2 }}>{translate(factor.facts.filter(([label, value]) => !/Chưa|Không có|Dữ liệu lịch sử/i.test(String(value)) && !/Mức lưu ý từ tiêu đề|Điểm thời tiết/.test(label)).map(([label, value]) => <Box component="div" key={label} sx={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 1.5, alignItems: "start" }}><Typography component="dt" variant="body2" color="text.secondary">{translate(label)}</Typography><Typography component="dd" variant="body2" sx={{ m: 0, textAlign: "right", fontWeight: 600, overflowWrap: "anywhere" }}>{translate(value)}</Typography></Box>))}</Box>
    {translate(detail && <Button component={Link} to={factor.detailPath} variant="outlined" sx={{ mt: "auto" }}>{translate("Xem đánh giá ")}{translate(factor.key === "weather" ? "thời tiết" : factor.key === "traffic" ? "giao thông" : "tin tức")}{translate(" chi tiết")}</Button>)}
  </Box>;
}
