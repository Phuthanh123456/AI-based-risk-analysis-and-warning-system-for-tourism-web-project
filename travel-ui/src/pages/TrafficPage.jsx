import { useTranslate, getLocale } from "../i18n/index.js";import { Link } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTravel } from "../portal/TravelContext";
import { DataState, PageIntro, SourceNote } from "../portal/UiPrimitives";
import TripDetailNavigation from "../components/TripDetailNavigation";
import JourneyMap from "../components/JourneyMap";
import { assessTraffic } from "../portal/tripAssessment";

export default function TrafficPage() {const translate = useTranslate();
  const travel = useTravel(),trip = travel.tripRes;
  if (!trip) return <div className="portal-page"><PageIntro eyebrow={translate("Bản đồ và giao thông")} title={translate("Hiểu tuyến đường trước khi đi")} /><DataState title={translate("Chưa có hành trình")} description={translate("Chọn điểm đi và điểm đến để xem bản đồ cùng đánh giá tuyến đường.")} /></div>;
  const traffic = trip.traffic || {},assessment = assessTraffic(traffic);
  const facts = [...assessment.facts];
  return <div className="portal-page">
    <TripDetailNavigation />
    <PageIntro eyebrow={translate("Bản đồ và giao thông")} title={translate("Tuyến đường và những điều cần cân nhắc")} description={translate(`${travel.originName || "Điểm xuất phát"} → ${trip.to?.name || travel.destination}. Tuyến ô tô tham khảo, không đại diện cho mọi phương tiện.`)} />
    <Box data-testid="route-assessment-layout" sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0,1fr)", md: "minmax(0,1.25fr) minmax(0,1fr)" }, gap: 3, alignItems: "start" }}>
      <JourneyMap />
      <Box component="section" aria-label={translate("Đánh giá tuyến đường")} className="portal-section" sx={{ minWidth: 0 }}>
        <Typography component="h2" variant="h3">{translate("Đánh giá giao thông và tuyến đường")}</Typography>
        <Typography fontWeight={700} sx={{ my: 1.5 }}>{translate(assessment.label)}</Typography>
        <Box component="dl" sx={{ display: "grid", gap: 1.5, my: 2.5 }}>{translate(facts.map(([label, value]) => <Box component="div" key={label} sx={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 2 }}><Typography component="dt" variant="body2" color="text.secondary">{translate(label)}</Typography><Typography component="dd" variant="body2" sx={{ m: 0, textAlign: "right", fontWeight: 600, overflowWrap: "anywhere" }}>{translate(value)}</Typography></Box>))}</Box>
        {translate(!assessment.routeAvailable && <Alert severity="info">{translate("Chưa lấy được tuyến hợp lệ. Bản đồ chỉ giúp đối chiếu vị trí, chưa xác nhận đường đi.")}</Alert>)}
        <Typography component="h3" variant="subtitle1" fontWeight={700} sx={{ mt: 2.5, mb: 1 }}>{translate("Gợi ý để bạn cân nhắc")}</Typography><Typography variant="body2" data-testid="traffic-detail-advice">{translate(assessment.advice)}</Typography>
        <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap" sx={{ mt: 2.5, "& > .MuiButton-root": { flexShrink: 0, maxWidth: "100%", whiteSpace: "normal", textAlign: "center" } }}><Button variant="contained" onClick={travel.openGoogleDirections}>{translate("Đối chiếu trên Google Maps")}</Button><Button variant="outlined" onClick={travel.refreshTrip} disabled={travel.tripLoading}>{translate(travel.tripLoading ? "Đang cập nhật…" : "Cập nhật đánh giá")}</Button></Stack>
        <SourceNote>{translate("Tuyến và thời gian ô tô tham khảo từ dịch vụ định tuyến. Tra cứu lúc ")}{translate(traffic.checked_at ? new Date(traffic.checked_at).toLocaleString(getLocale()) : "chưa rõ")}{translate(". Bạn có thể đối chiếu chỉ đường và điều kiện thực tế trước khi đi.")}</SourceNote>
      </Box>
    </Box>
    <Alert severity="info">{translate("Thông tin tham khảo; bạn chủ động chọn hành trình theo điều kiện thực tế.")}</Alert>
    <Button component={Link} to="/result" variant="outlined" sx={{ alignSelf: "start" }}>{translate("Quay lại đánh giá tổng quan")}</Button>
  </div>;
}
