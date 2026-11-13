import { useTranslate, getLocale } from "../i18n/index.js";import { Link } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTravel } from "../portal/TravelContext";
import { dateLabel, numberLabel } from "../portal/format";
import { DataState, MetricCard, PageIntro, RiskChip, SourceNote } from "../portal/UiPrimitives";
import WeatherOutlook from "../tourism/WeatherOutlook";
import TripDetailNavigation from "../components/TripDetailNavigation";
import { assessWeather } from "../portal/tripAssessment";
import { weatherPurposeAdvice } from "../portal/weatherPurposeAdvice";

export default function WeatherPage() {const translate = useTranslate();
  const travel = useTravel();
  const trip = travel.tripRes;
  if (!trip) return <div className="portal-page"><PageIntro eyebrow={translate("Thời tiết")} title={translate("Thời tiết điểm đến")} /><DataState title={translate("Chưa chọn chuyến đi")} description={translate("Lập kế hoạch để lấy dữ liệu thời tiết đúng tọa độ điểm đến.")} /></div>;
  const current = trip.weather?.error ? null : trip.weather;
  const day = travel.forecastData[travel.selectedDateIndex] || null;
  const display = day || current;
  const score = display?.adjusted_risk_score ?? display?.risk_score;
  const currentScore = current?.adjusted_risk_score ?? current?.risk_score;
  const pm25 = current?.pm25 ?? current?.air_quality?.pm25;
  const advice = assessWeather(display, day ? day.air_quality : current?.air_quality, day ? "forecast" : "current");
  const purposeAdvice = weatherPurposeAdvice(display, travel.tripPurpose || trip.trip_purpose);
  const displayPm25 = day ? day.air_quality?.pm25 : pm25;
  return <div className="portal-page">
    <TripDetailNavigation />
    <PageIntro eyebrow={translate("Thời tiết")} title={translate(`Thời tiết tại ${travel.destination || trip.to?.name}`)} description={translate("Xem thời tiết hiện tại và dự báo từng ngày. Chỉ các chỉ số API đã trả về mới được hiển thị.")} action={<Button component={Link} to="/alerts" variant="outlined">{translate("Thiết lập cảnh báo")}</Button>} />
    {translate(travel.forecastLoading && <Alert severity="info" icon={<CircularProgress size={18} />}>{translate("Đang tải dự báo hôm nay và 7 ngày tiếp theo…")}</Alert>)}
    <Box><Button variant={day ? "outlined" : "contained"} aria-pressed={!day} onClick={() => travel.setSelectedDateIndex(-1)}>{translate("Xem thời tiết hiện tại")}</Button><Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{translate("Các ô ngày phía dưới chỉ để xem riêng từng ngày. Chọn ngày khác ở đây không gộp vào kết luận tổng quan.")}</Typography></Box>
    {translate(purposeAdvice && <Alert severity={advice.tone}><strong>{translate("Lời khuyên ")}{translate(day ? `cho ngày ${dateLabel(day.date)}` : "theo thời tiết hiện tại")}{translate(" · ")}{translate(purposeAdvice.label)}</strong><Typography data-testid="weather-purpose-advice" variant="body2" sx={{ mt: 1 }}>{translate(purposeAdvice.text)}</Typography></Alert>)}
    <Box className="portal-section"><Typography component="h2" variant="h3">{translate("Chất lượng không khí hiện tại")}</Typography><Typography className="portal-metric-value">{translate(numberLabel(pm25, 1, " µg/m³"))}</Typography><Typography variant="body2" color="text.secondary">{translate(current?.air_quality?.status === "available" ? `PM2.5 · Nguồn: ${current.air_quality.source}. Thời điểm dữ liệu: ${current.air_quality.observed_at ? new Date(current.air_quality.observed_at).toLocaleString(getLocale()) : "nhà cung cấp chưa ghi rõ"}.` : "Nguồn chất lượng không khí chưa trả kết quả. Không tự điền giá trị khi nguồn chưa có dữ liệu.")}</Typography></Box>
    {translate(current ? <><Box className="portal-section"><Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "start", sm: "center" }} sx={{ gap: 1 }}><Box><Typography component="h2" variant="h3">{translate("Thời tiết hiện tại")}</Typography><Typography color="text.secondary" variant="body2">{translate("Số liệu và điểm rủi ro tại thời điểm đánh giá chuyến đi.")}</Typography></Box><RiskChip score={currentScore} /></Stack></Box><div className="portal-grid portal-grid-four"><MetricCard title={translate("Nhiệt độ hiện tại")} value={numberLabel(current.temperature, 1, "°C")} /><MetricCard title={translate("Mưa hiện tại")} value={numberLabel(current.precipitation, 1, " mm")} /><MetricCard title={translate("Gió hiện tại")} value={numberLabel(current.wind, 1, " km/h")} /><MetricCard title={translate("Tầm nhìn hiện tại")} value={numberLabel(current.visibility_km, 1, " km")} /></div></> : <Alert severity="warning">{translate("Chưa tải được thời tiết hiện tại cho điểm đến.")}</Alert>)}
    {translate(!travel.forecastLoading && !travel.forecastData.length && <Alert severity="warning">{translate("Chưa lấy được dự báo nhiều ngày. Các chỉ số bên dưới, nếu có, là thông tin hiện tại.")}</Alert>)}
    {translate(travel.forecastData.length > 0 && <WeatherOutlook days={travel.forecastData} />)}
    {translate(travel.forecastData.length > 0 && <Box className="portal-section"><Typography component="h2" variant="h3" sx={{ mb: 2 }}>{translate("Dự báo ")}{translate(travel.forecastData.length)}{translate(" ngày")}</Typography><div className="portal-day-grid">{translate(travel.forecastData.map((item, index) => <Button key={item.date || index} aria-pressed={index === travel.selectedDateIndex} variant={index === travel.selectedDateIndex ? "contained" : "outlined"} onClick={() => travel.setSelectedDateIndex(index)} sx={{ p: 1.5, display: "grid", textAlign: "left", justifyItems: "start" }}><span>{translate(dateLabel(item.date))}</span><strong>{translate(item.temperature != null ? `${Math.round(item.temperature)}°C` : "Chưa có")}</strong><small>{translate("Rủi ro ")}{translate(item.adjusted_risk_score ?? item.risk_score ?? "—")}{translate("/10")}</small></Button>))}</div></Box>)}
    <Box className="portal-section"><Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "start", sm: "center" }} gap={1}><Box><Typography component="h2" variant="h3">{translate(day ? `Chỉ số dự báo ngày ${dateLabel(day.date)}` : "Chỉ số thời tiết hiện tại")}</Typography><Typography color="text.secondary" variant="body2">{translate("Đánh giá dựa trên dữ liệu thời tiết Open-Meteo.")}</Typography></Box><RiskChip score={score} /></Stack></Box>
    {translate(display ? <div className="portal-grid portal-grid-four">
      <MetricCard title={translate("Nhiệt độ")} value={numberLabel(display.temperature, 1, "°C")} />
      <MetricCard title={translate("Lượng mưa")} value={numberLabel(display.precipitation, 1, " mm")} />
      <MetricCard title={translate("Tốc độ gió")} value={numberLabel(display.wind, 1, " km/h")} />
      <MetricCard title={translate("Tầm nhìn")} value={numberLabel(display.visibility_km, 1, " km")} />
      <MetricCard title={translate("Chỉ số UV")} value={numberLabel(display.uv_index, 1)} />
      <MetricCard title={translate(day ? "PM2.5 dự báo trung bình" : "PM2.5 hiện tại")} value={numberLabel(displayPm25, 1, " µg/m³")} helper={day ? day.air_quality?.status === "available" ? `Trung bình ${day.air_quality.hours} giờ có dữ liệu · ${day.air_quality.source}` : "Nguồn không khí chưa có dự báo cho ngày này; xem chỉ số hiện tại ở phía trên." : current?.air_quality?.source} />
      <MetricCard title={translate("Độ ẩm")} value={numberLabel(display.humidity, 1, "%")} />
      <MetricCard title={translate("Điểm rủi ro thời tiết")} value={score != null ? `${Number(score).toFixed(1)}/10` : "Chưa có"} tone={score >= 7 ? "danger" : score >= 4 ? "caution" : "default"} />
    </div> : <DataState title={translate("Không tải được dữ liệu thời tiết")} description={translate("Bạn có thể thử đánh giá lại chuyến đi khi kết nối ổn định.")} severity="warning" />)}
    <SourceNote>{translate("Dữ liệu được lấy theo tọa độ điểm đến. PM2.5 từ Open-Meteo/CAMS là ước tính cho khu vực, không phải phép đo tại địa chỉ hoặc trạm ngay cạnh bạn. Dự báo có thể thay đổi; bạn có thể kiểm tra lại gần giờ khởi hành trước khi chọn hoạt động.")}</SourceNote>
    <TripDetailNavigation />
  </div>;
}
