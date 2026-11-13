import { useTranslate } from "../i18n/index.js";import { Link } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTravel } from "../portal/TravelContext";
import { dateLabel } from "../portal/format";
import { buildTripAssessment } from "../portal/tripAssessment";
import { DataState, PageIntro } from "../portal/UiPrimitives";
import TripAssessmentCard from "../components/TripAssessmentCard";
import TripDecisionDashboard from "../components/TripDecisionDashboard";

export default function ResultPage() {const translate = useTranslate();
  const travel = useTravel();
  const { tripRes, destination, originName, departureDate, tripCheckedAt, forecastData, forecastLoading } = travel;
  if (!tripRes) return <div className="portal-page"><PageIntro eyebrow={translate("Tổng quan hành trình")} title={translate("Đánh giá chuyến đi")} />{translate(travel.tripLoading ? <Alert severity="info" icon={<CircularProgress size={18} />}>{translate("Đang lấy lại dữ liệu và đánh giá ba yếu tố…")}</Alert> : <DataState title={translate("Chưa có đánh giá chuyến đi")} description={translate("Chọn hành trình và nhấn Đánh giá chuyến đi để xem đủ ba yếu tố.")} />)}</div>;
  const assessment = buildTripAssessment(tripRes, forecastData, departureDate, forecastLoading);
  return <div className="portal-page">
    <PageIntro eyebrow={translate("Tổng quan hành trình")} title={translate(`Đánh giá chuyến đi đến ${travel.destinationLocation?.name || destination || tripRes.to?.name}`)} description={translate(`${originName || "Điểm xuất phát"} → ${tripRes.to?.name || destination} · Ngày dự kiến ${dateLabel(departureDate)}`)} action={<Button component={Link} to="/plan" state={{ editTrip: true }} variant="outlined">{translate("Chỉnh sửa chuyến đi")}</Button>} />
    <TripDecisionDashboard assessment={assessment} checkedAt={tripCheckedAt} />
    <Typography component="h2" variant="h2">{translate("Đánh giá chi tiết ba yếu tố")}</Typography>
    <div className="portal-grid">{translate(assessment.factors.map((factor) => <TripAssessmentCard key={factor.key} factor={factor} />))}</div>
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} useFlexGap flexWrap="wrap"><Button component={Link} to="/map" variant="contained">{translate("Xem bản đồ hành trình")}</Button><Button variant="outlined" onClick={travel.refreshTrip} disabled={travel.tripLoading}>{translate("Cập nhật đánh giá")}</Button></Stack>
  </div>;
}
