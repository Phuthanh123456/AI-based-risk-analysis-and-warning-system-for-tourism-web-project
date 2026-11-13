import { useTranslate, getLocale } from "../i18n/index.js";import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { apiGet } from "../api";
import { useTravel } from "../portal/TravelContext";
import { dateLabel } from "../portal/format";
import { DataState, MetricCard, PageIntro, RiskChip, SourceNote } from "../portal/UiPrimitives";
import TripDetailNavigation from "../components/TripDetailNavigation";
import { assessNews } from "../portal/tripAssessment";
import FactorScale from "../components/FactorScale";

const GROUP_NAMES = { Pricing_Issue: "Giá cả", Environmental_Cleanliness: "Môi trường", Safety_Security: "An ninh", Natural_Disaster: "Thiên tai", Fire_Accident_Risk: "Tai nạn, cháy nổ" };
const IMPACT_NAMES = { adverse: "Dấu hiệu bất lợi", supportive: "Nêu khắc phục / mở lại", uncertain: "Cảnh báo / chưa rõ tác động" };

function HeadlineImpact({ event }) {const translate = useTranslate();
  const attention = event.attention;
  if (!attention) return <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{translate("Chưa có phân tích mức lưu ý cho tiêu đề này.")}</Typography>;
  return <Box sx={{ mt: 1.5, pl: 1.5, borderLeft: "3px solid", borderColor: attention.impact === "supportive" ? "success.main" : "warning.main" }}><Typography variant="body2" fontWeight={700}>{translate(IMPACT_NAMES[attention.impact] || "Chưa rõ tác động")}{translate(" · Mức lưu ý ")}{translate(attention.score)}{translate("/10 (tạm tính)")}</Typography><Typography variant="body2" sx={{ mt: .5 }}>{translate(attention.reason)}</Typography><Typography variant="caption" color="text.secondary">{translate("Suy luận từ tiêu đề; chưa xác minh toàn văn, vị trí cụ thể hoặc diễn biến hiện tại.")}</Typography></Box>;
}

export default function NewsPage() {const translate = useTranslate();
  const travel = useTravel();
  const [place, setPlace] = useState(() => travel.tripRes?.to?.province_inferred || travel.selectedProv?.dataProvince || travel.selectedProv?.province || "");
  const [summary, setSummary] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(Boolean(place));
  const [error, setError] = useState("");
  const [recent, setRecent] = useState(travel.tripRes?.risk?.recent_news || null);

  useEffect(() => {
    if (!place) return;
    let alive = true;
    Promise.allSettled([apiGet(`/risk?place=${encodeURIComponent(place)}`), apiGet(`/risk/events?place=${encodeURIComponent(place)}&limit=12`), apiGet(`/api/news/recent?place=${encodeURIComponent(place)}`)]).then(([risk, articles, latest]) => {
      if (!alive) return;
      if (risk.status === "fulfilled") setSummary(risk.value);
      if (articles.status === "fulfilled") setEvents(articles.value.events || []);
      if (latest.status === "fulfilled") setRecent(latest.value);
      if ([risk, articles, latest].some((item) => item.status === "rejected")) setError("Một phần nguồn tin chưa phản hồi; các nguồn tải được vẫn hiển thị bên dưới.");
      setLoading(false);
    }).catch((reason) => {if (alive) {setError(String(reason.message || reason));setLoading(false);}});
    return () => {alive = false;};
  }, [place]);

  function selectPlace(value) {setPlace(value);setSummary(null);setEvents([]);setRecent(null);setError("");setLoading(Boolean(value));}
  const advice = assessNews({ data_status: summary?.num_articles ? summary.is_stale ? "stale" : "fresh" : "no_data", risk_score: summary?.overall_risk_score, num_articles: summary?.num_articles, recent_news: recent });
  return <div className="portal-page">
    {translate(travel.tripRes && <TripDetailNavigation />)}
    <PageIntro eyebrow={translate("Tin tức và sự kiện")} title={translate("Đánh giá tin tức tại điểm đến")} description={translate("Tra cứu tiêu đề mới trong 7 ngày và đối chiếu dữ liệu phân tích lịch sử. Mỗi bài có ngày, nguồn và đường dẫn để kiểm tra.")} />
    <Typography variant="caption" color="text.secondary">{translate("Tiêu đề bài báo được giữ nguyên ngôn ngữ nguồn.")}</Typography>
    <Box className="portal-section"><TextField select fullWidth label={translate("Chọn địa điểm")} value={place} onChange={(event) => selectPlace(event.target.value)} helperText={translate("Bạn có thể tra cứu từng tỉnh trong dữ liệu hiện có.")}><MenuItem value="">{translate("Chọn tỉnh, thành phố")}</MenuItem>{translate(travel.provinces.map((p) => <MenuItem key={p.province} value={p.province}>{translate(p.province)}</MenuItem>))}{translate(place && !travel.provinces.some((p) => p.province === place) && <MenuItem value={place}>{translate(place)}</MenuItem>)}</TextField></Box>
    {translate(!place && <DataState title={translate("Chọn địa điểm để xem tin tức")} action={null} />)}
    {translate(loading && <Alert severity="info" icon={<CircularProgress size={18} />}>{translate("Đang tải tin tức và đánh giá địa phương…")}</Alert>)}
    {translate(error && <Alert severity="error">{translate("Không tải được dữ liệu: ")}{translate(error)}</Alert>)}
    {translate(place && <Box className="portal-section" data-testid="news-assessment"><Typography component="h2" variant="h3">{translate("Đánh giá và gợi ý từ tin tức")}</Typography><Typography fontWeight={700} sx={{ my: 1.5 }}>{translate(advice.label)}</Typography><FactorScale score={advice.score} qualitative label={translate("Mức lưu ý từ tin tức")} /><Typography variant="body2" sx={{ mt: 2 }} data-testid="news-detail-advice">{translate(advice.advice)}</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{translate("Phạm vi: ")}{translate(recent?.place || place)}{translate(", tối đa 12 tin trong 7 ngày. Chưa xác nhận sự việc xảy ra ngay tại địa điểm bạn chọn hoặc còn ảnh hưởng hôm nay.")}</Typography><SourceNote>{translate("Thang quy tắc: 0 = tiêu đề nêu khắc phục/mở lại; 3 = cảnh báo/dự kiến hoặc sự cố được đăng hơn 48 giờ trước; 5 = tiêu đề nêu sự cố; 7 = tiêu đề nêu gián đoạn/nguy hại đáng lưu ý. Mức chung lấy điểm cao nhất trong mẫu, không cộng số lượng bài và không để tin thuận lợi triệt tiêu tin bất lợi. Mức 8–10 không tự gán từ tiêu đề. Điểm không phải xác suất xảy ra hay xác nhận an toàn; trạng thái thực tế cần đọc nguồn và đối chiếu thông báo địa phương. Bạn chủ động lựa chọn lịch trình.")}</SourceNote></Box>)}
    {translate(recent && <Box className="portal-section"><Typography component="h2" variant="h3" sx={{ mb: 2 }}>{translate("Tin mới khớp địa danh và từ khóa rủi ro trong 7 ngày")}</Typography>{translate(recent.status === "available" ? recent.events?.length ? <div className="portal-news-list">{translate(recent.events.map((event) => <article className="portal-news-item" key={event.id}><Typography component="h3" variant="subtitle1" fontWeight={700}><a href={event.url} target="_blank" rel="noopener noreferrer" lang="vi" data-i18n-original>{event.title}</a></Typography><Stack direction="row" gap={1} flexWrap="wrap" sx={{ mt: 1 }}><Chip size="small" label={translate(dateLabel(event.date))} /><Chip size="small" label={translate(event.source || "Nguồn chưa rõ")} /><Chip size="small" label={translate("Cần đọc nguồn để xác minh")} variant="outlined" /></Stack><HeadlineImpact event={event} /></article>))}</div> : <Alert severity="info">{translate("Đã tra cứu nhưng chưa có tiêu đề khớp bộ lọc. Không thể suy ra địa điểm an toàn từ việc không tìm thấy tin.")}</Alert> : <Alert severity="warning">{translate("Nguồn tin mới chưa phản hồi. Bạn vẫn có thể xem dữ liệu lịch sử bên dưới.")}</Alert>)}<Typography variant="caption" color="text.secondary">{translate("Nguồn: ")}{translate(recent.provider || "chưa có")}{translate(". Tra cứu lúc ")}{translate(recent.checked_at ? new Date(recent.checked_at).toLocaleString(getLocale()) : "chưa rõ")}{translate(". Tiêu đề được lọc bằng địa danh và từ khóa, chưa xác minh toàn văn hoặc việc sự cố còn tiếp diễn.")}</Typography></Box>)}
    {translate(summary && <><Alert severity={summary.is_stale ? "warning" : "info"}>{translate(summary.num_articles === 0 ? "Chưa có bài báo được hệ thống phân loại cho địa điểm này. Không thể suy ra mức an toàn từ việc thiếu tin." : summary.is_stale ? `Bài gần nhất ngày ${dateLabel(summary.latest_article_date)}. Dữ liệu đã cũ; điểm lịch sử không phản ánh tình hình hiện tại.` : `${summary.num_articles} bài được hệ thống phân loại; bài gần nhất ngày ${dateLabel(summary.latest_article_date)}.`)}</Alert><div className="portal-grid"><MetricCard title={translate("Bài trong dữ liệu đã thu thập")} value={summary.num_articles} /><MetricCard title={translate("Bài gần nhất")} value={dateLabel(summary.latest_article_date)} /><MetricCard title={translate("Điểm rủi ro báo chí")} value={summary.is_stale || summary.num_articles === 0 ? "Không dùng hiện tại" : `${summary.overall_risk_score}/10`} helper={summary.is_stale ? "Chỉ dùng để tham khảo lịch sử" : "Tính từ các bài trong dữ liệu"} /></div></>)}
    {translate(summary && <Box className="portal-section"><Stack direction="row" alignItems="center" justifyContent="space-between" gap={1} sx={{ mb: 2 }}><Typography component="h2" variant="h3">{translate("Bài có tiêu đề nêu rõ rủi ro")}</Typography>{translate(!summary.is_stale && summary.num_articles > 0 && <RiskChip score={summary.overall_risk_score} />)}</Stack>{translate(events.length ? <div className="portal-news-list">{translate(events.map((event) => <article className="portal-news-item" key={event.id}><Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={1}><Typography component="h3" variant="subtitle1" fontWeight={700}>{translate(event.url ? <a href={event.url} target="_blank" rel="noopener noreferrer" lang="vi" data-i18n-original>{event.title}</a> : <span lang="vi" data-i18n-original>{event.title}</span>)}</Typography>{translate(event.risk_score != null && <RiskChip score={event.risk_score} />)}</Stack><Stack direction="row" flexWrap="wrap" gap={1} sx={{ my: 1 }}><Chip size="small" variant="outlined" label={translate(dateLabel(event.date))} /><Chip size="small" variant="outlined" label={translate(event.source || "Nguồn chưa rõ")} />{translate((event.risk_groups || []).map((group) => <Chip key={group} size="small" label={translate(GROUP_NAMES[group] || group)} />))}</Stack></article>))}</div> : <DataState title={translate("Chưa có tiêu đề nêu rõ rủi ro")} description={translate("Chưa có bài báo trong dữ liệu nêu rõ một sự cố ở tiêu đề. Điều này không có nghĩa là địa điểm an toàn.")} action={null} />)}</Box>)}
    <SourceNote>{translate("Tin mới đọc từ Google News RSS, lọc theo ngày, địa danh và từ khóa, bao gồm một số tin khắc phục. Đây là mẫu tin theo chủ đề rủi ro, không phải toàn bộ tin tốt/xấu của địa phương. Thang mức lưu ý là quy tắc công khai; chưa xác minh toàn văn hoặc ảnh hưởng tại điểm đến. Dữ liệu lịch sử dùng pipeline của dự án và có thể đã cũ.")}</SourceNote>
    {translate(travel.tripRes && <TripDetailNavigation />)}
  </div>;
}
