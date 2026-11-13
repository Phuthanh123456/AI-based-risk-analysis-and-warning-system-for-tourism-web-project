import { useTranslate } from "../i18n/index.js";import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import MyLocationOutlinedIcon from "@mui/icons-material/MyLocationOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import { TRIP_PURPOSES } from "../components/tripPurposeConfig";
import { useTravel } from "../portal/TravelContext";
import { PageIntro, SourceNote } from "../portal/UiPrimitives";
import { currentProvincePoints } from "../tourism/catalog/provinces";
import LocationSearch from "../components/LocationSearch";
import DepartureDatePicker from "../components/DepartureDatePicker";
import { missingTripFields } from "../portal/tripFormValidation";
import { localToday } from "../portal/tripAssessment";

export default function PlanPage() {const translate = useTranslate();
  const travel = useTravel();
  const navigate = useNavigate();
  const location = useLocation();
  const initializePlan = travel.initializePlan;
  const errorRef = useRef(null);
  const originValue = travel.originName || "";
  const missing = missingTripFields({ origin: travel.userPos, destination: travel.destination, selectedDestination: travel.destinationLocation, date: travel.departureDate, purpose: travel.tripPurpose }, localToday());
  useLayoutEffect(() => {
    if (!location.state?.editTrip) initializePlan(location.state?.prefillDestination || "");
  }, [location.key, location.state, initializePlan]);
  const originPoints = currentProvincePoints(travel.provinces);
  const references = originPoints.map((point) => ({
    id: `province:${point.currentId}`, name: point.province, label: point.province,
    lat: point.lat, lon: point.lon, source: "reference"
  }));
  const selectedOrigin = travel.userPos && originValue ? {
    id: `origin:${travel.userPos.lat}:${travel.userPos.lon}`, name: originValue,
    label: originValue, ...travel.userPos
  } : null;

  useEffect(() => {
    if (!travel.err || !errorRef.current) return;
    errorRef.current.focus({ preventScroll: true });
    errorRef.current.scrollIntoView({ block: "nearest", behavior: "auto" });
  }, [travel.err]);

  async function submit(event) {
    event.preventDefault();
    const result = await travel.checkTrip();
    if (result) navigate("/result");
  }

  return <div className="portal-page">
    <PageIntro eyebrow={translate("Lập kế hoạch")} title={translate("Đi đâu, đi như thế nào, cần lưu ý gì?")} description={translate("Chọn hành trình của bạn để xem đánh giá từ dữ liệu thời tiết, tuyến đường và tin tức hiện có.")} />
    <div className="portal-grid portal-grid-two">
      <Box component="form" onSubmit={submit} className="portal-section" sx={{ display: "grid", gap: 2.2, alignContent: "start" }}>
        <Typography component="h2" variant="h3">{translate("Thông tin chuyến đi")}</Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems="stretch">
          <LocationSearch label={translate("Điểm xuất phát")} text={originValue} selected={selectedOrigin} onTextChange={travel.updateOrigin} onPick={travel.chooseOrigin} references={references} />
          <Button variant="outlined" startIcon={travel.gpsLoading ? <CircularProgress size={16} /> : <MyLocationOutlinedIcon />} onClick={travel.getGPS} disabled={travel.gpsLoading} sx={{ minWidth: { sm: 160 }, alignSelf: { sm: "start" }, mt: { sm: 1 } }}>{translate(travel.gpsLoading ? "Đang lấy vị trí" : "Dùng GPS")}</Button>
        </Stack>
        <Typography variant="caption" color="text.secondary">{translate("Tìm địa chỉ cụ thể hoặc chọn một trong 34 tỉnh/thành. Các mục tỉnh/thành là điểm tham chiếu; dùng địa chỉ hoặc GPS nếu cần vị trí chính xác.")}</Typography>
        <LocationSearch label={translate("Điểm đến")} text={travel.destination} selected={travel.destinationLocation} onTextChange={travel.updateDestination} onPick={travel.chooseDestination} near={travel.userPos} references={references} />
        <DepartureDatePicker value={travel.departureDate} onChange={travel.updateDepartureDate} />
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <TextField select required label={translate("Mục đích chuyến đi")} value={travel.tripPurpose || ""} onChange={(event) => travel.updatePurpose(event.target.value || null)} fullWidth helperText={translate("Bắt buộc chọn mục đích để nhận lưu ý thời tiết phù hợp.")}>
            <MenuItem value="" disabled>{translate("Chọn mục đích chuyến đi")}</MenuItem>
            {translate(TRIP_PURPOSES.map((purpose) => <MenuItem key={purpose.key} value={purpose.key}>{translate(purpose.label)}</MenuItem>))}
          </TextField>
        </Stack>
        <Button size="large" variant="contained" type="submit" startIcon={travel.tripLoading ? <CircularProgress size={17} color="inherit" /> : <SearchOutlinedIcon />} disabled={!travel.canTrip || travel.tripLoading}>{translate(travel.tripLoading ? "Đang tổng hợp dữ liệu…" : "Đánh giá chuyến đi")}</Button>
        {translate(travel.err && <Alert ref={errorRef} severity="error" role="alert" tabIndex={-1} sx={{ scrollMarginTop: "120px" }} onClose={travel.clearError}>{translate(travel.err)}</Alert>)}
        {translate(missing.length > 0 && <Typography variant="body2" color="text.secondary" role="status">{translate("Cần chọn thêm: ")}{translate(missing.join(", "))}{translate(".")}</Typography>)}
      </Box>
      <Box className="portal-section plan-story-panel" sx={{ display: "grid", alignContent: "start", gap: 2 }}>
        <img className="plan-story-image" src="/images/landing/hoian-lanterns.webp" alt={translate("Ánh đèn trên phố Hội An")} loading="lazy" />
        <Typography component="h2" variant="h3">{translate("Kiểm tra trước chuyến đi, chuẩn bị chủ động hơn")}</Typography>
        <Typography color="text.secondary" variant="body2">{translate("Chọn nơi đi, nơi đến, ngày đi và mục đích chuyến đi. Chúng tôi giúp bạn xem thời tiết, tuyến đường và tin tức tại điểm đến để cân nhắc lịch trình phù hợp.")}</Typography>
        <Divider />
        <Stack spacing={2.2}>
          <Box><Typography fontWeight={700}>{translate("01 · Cân nhắc có nên đi vào ngày đã chọn")}</Typography><Typography color="text.secondary" variant="body2">{translate("Xem kết luận “Nên đi”, “Cần lưu ý trước khi đi” hoặc “Không nên đi”, kèm gợi ý để bạn cân nhắc giữ lịch, điều chỉnh hoặc đổi ngày.")}</Typography></Box>
          <Box><Typography fontWeight={700}>{translate("02 · Biết cần chuẩn bị những gì")}</Typography><Typography color="text.secondary" variant="body2">{translate("Xem mưa, nắng, gió và chất lượng không khí để chọn trang phục, chuẩn bị đồ dùng và sắp xếp hoạt động phù hợp với chuyến đi.")}</Typography></Box>
          <Box><Typography fontWeight={700}>{translate("03 · Nắm đường đi và tin đáng chú ý")}</Typography><Typography color="text.secondary" variant="body2">{translate("Xem tuyến đường trên bản đồ, quãng đường và thời gian di chuyển tham khảo. Đọc các tin liên quan tại điểm đến để kiểm tra xem có ảnh hưởng đến kế hoạch của bạn không.")}</Typography></Box>
        </Stack>
        {translate(travel.tripRes && <Alert severity="info">{translate("Bạn đã có kết quả cho chuyến đi trước. Nếu thay đổi thông tin ở đây, hãy đánh giá lại để cập nhật kết quả.")}</Alert>)}
        <SourceNote>{translate("Thời tiết được xem theo ngày đang đánh giá. Tuyến đường và tin tức được tra cứu tại thời điểm bạn tìm kiếm; thời gian di chuyển là ước tính, không phản ánh tình trạng kẹt xe trực tiếp. Bạn nên kiểm tra lại gần giờ khởi hành và chủ động quyết định theo tình hình thực tế.")}</SourceNote>
      </Box>
    </div>
  </div>;
}
