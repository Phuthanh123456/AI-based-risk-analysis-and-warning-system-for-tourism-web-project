import { getLocale } from "../i18n/index.js"; // One assessment shared by the overview and factor details. Missing observations
// and route estimates never become invented live scores.
const num = (v) => v != null && Number.isFinite(Number(v)) ? Number(v) : null;
const val = (v, unit = "") => num(v) == null ? "Chưa có" : `${Number(v).toLocaleString(getLocale(), { maximumFractionDigits: 1 })}${unit}`;
export function localToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}
export function assessWeather(w, air, context = "current") {
  if (!w || w.error) return { key: "weather", title: "Thời tiết và không khí", label: "Chưa đủ dữ liệu", tone: "warning", score: null, summary: "Bạn có thể cập nhật dự báo trước khi chốt lịch.", advice: "Kiểm tra lại dự báo trước khi chốt lịch; chưa đủ dữ liệu thời tiết để kết luận cho ngày đi.", facts: [], detailPath: "/weather" };
  const score = num(w.adjusted_risk_score ?? w.risk_score);
  const high = (num(w.risk_level) ?? 0) >= 4 || score != null && score >= 7;
  const moderate = !high && (score == null || score >= 4);
  air = air || w.air_quality;
  const pm = air?.status === "available" ? num(air.pm25) : null;
  const notes = [];
  if (num(w.precipitation) >= 5) notes.push("chuẩn bị áo mưa, tránh hoạt động ngoài trời khi mưa tăng");
  if (num(w.wind) >= 25) notes.push("cân nhắc hoạt động ngoài trời do gió mạnh");
  if (num(w.visibility_km) != null && num(w.visibility_km) < 2) notes.push("hạn chế di chuyển khi tầm nhìn thấp");
  if (num(w.uv_index) >= 7) notes.push("chuẩn bị đồ chống nắng");
  let advice = high ? "Bạn có thể cân nhắc hoãn hoặc đổi thời điểm hoạt động ngoài trời sau khi đối chiếu cảnh báo thời tiết tại địa phương." :
  moderate ? "Ưu tiên lịch trình linh hoạt và có phương án trong nhà do thời tiết cần thận trọng." :
  "Có thể lên kế hoạch theo điều kiện thời tiết đang có; kiểm tra lại dự báo gần giờ khởi hành.";
  if (notes.length) advice += " Có thể " + notes.join("; ") + ".";
  if (pm == null) advice += " Chưa có PM2.5 tương ứng để đánh giá chất lượng không khí.";
  const summary = high ? "Bạn có thể cân nhắc đổi giờ hoặc chọn hoạt động trong nhà." : moderate ? "Có thể giữ lịch trình linh hoạt và chuẩn bị phương án trong nhà." : "Bạn có thể lên kế hoạch và kiểm tra lại thời tiết gần giờ đi.";
  return { key: "weather", title: "Thời tiết và không khí", label: high ? "Rủi ro thời tiết cao" : moderate ? "Cần lưu ý thời tiết" : "Thời tiết ít điểm cần lưu ý", tone: high ? "error" : moderate ? "warning" : "success", score, summary, advice,
    facts: [["Điểm thời tiết", score == null ? "Chưa có" : `${score.toFixed(1)}/10`], ["Nhiệt độ", val(w.temperature, "°C")], ["Mưa / gió", `${val(w.precipitation, " mm")} / ${val(w.wind, " km/h")}`], [context === "forecast" ? "PM2.5 dự báo trung bình" : "PM2.5 hiện tại", val(pm, " µg/m³")]], source: air?.source, context, airUnavailable: pm == null, detailPath: "/weather" };
}
export function assessTraffic(t = {}) {
  const route = t.route_available !== false && num(t.distance_km) > 0;
  const live = route && t.traffic_available === true && num(t.time_traffic_min) > 0;
  const advice = !route ? "Chưa chốt được tuyến đường; thử cập nhật đánh giá hoặc mở chỉ đường để kiểm tra trước khi đi." :
  `${num(t.time_normal_min) >= 240 ? "Hành trình dài; bạn có thể chia chặng, bố trí nghỉ và chọn phương án di chuyển phù hợp." : "Bạn có thể sắp xếp giờ đi dựa trên thời gian tuyến tham khảo."} Thời gian là ước tính cho tuyến ô tô, có thể thay đổi theo điều kiện thực tế. Bạn có thể đối chiếu chỉ đường và dành thời gian dự phòng trước khi đi.`;
  const summary = !route ? "Bạn có thể cập nhật tuyến hoặc đối chiếu chỉ đường trước khi đi." : num(t.time_normal_min) >= 240 ? "Hành trình dài; bạn có thể chia chặng và bố trí nghỉ." : "Bạn có thể dành thời gian dự phòng và kiểm tra chỉ đường trước khi đi.";
  return { key: "traffic", title: "Tuyến đường và di chuyển", label: !route ? "Chưa lấy được tuyến" : "Có tuyến và thời gian ước tính", tone: !route ? "warning" : "info", score: null, summary, advice,
    facts: [["Quãng đường", val(t.distance_km, " km")], ["Thời gian theo tuyến (ước tính)", t.time_normal_human || t.time_normal || (num(t.time_normal_min) != null ? val(t.time_normal_min, " phút") : "Chưa có")], ["Nguồn tuyến", t.route_polyline_provider || t.traffic_source || "Chưa có"]], detailPath: "/traffic", routeAvailable: route, live };
}
export function assessNews(risk = {}) {
  const recent = risk.recent_news,count = recent?.count || 0;
  const fresh = risk.data_status === "fresh",available = recent?.status === "available";
  const attention = available ? recent.assessment : null;
  const score = num(attention?.score);
  const modelScore = fresh ? num(risk.risk_score) : null;
  const counts = attention?.counts || {};
  const high = modelScore != null && modelScore >= 7;
  const advice = high ? "Dữ liệu phân loại tin còn mới có tín hiệu rủi ro cao; bạn có thể đối chiếu bài gốc và thông báo địa phương trước khi chọn lịch trình." :
  score != null ? `${counts.adverse || 0} tin có dấu hiệu bất lợi, ${counts.supportive || 0} tin nêu khắc phục/mở lại và ${counts.uncertain || 0} tin cảnh báo hoặc chưa rõ tác động. ${score >= 7 ? "Có tiêu đề nêu gián đoạn đáng lưu ý; bạn có thể cân nhắc đổi giờ, tuyến hoặc hoạt động sau khi xác minh." : "Bạn có thể đọc các tin phù hợp với hoạt động dự định để tự cân nhắc."} Chưa xác nhận ảnh hưởng còn diễn ra tại địa điểm cụ thể.` :
  count ? `Có ${count} tiêu đề trong 7 ngày gần đây. Bạn có thể mở bài gốc để đối chiếu thời gian, địa bàn và ảnh hưởng thực tế; chưa có cơ sở chấm mức lưu ý cho mẫu tin này.` :
  available ? "Chưa tìm thấy tiêu đề khớp bộ lọc rủi ro và địa danh trong 7 ngày. Vẫn kiểm tra thông báo địa phương; kết quả này không chứng minh địa điểm an toàn." :
  "Tin mới chưa lấy được; hãy kiểm tra thông báo địa phương trước chuyến đi. Các bài cũ chỉ dùng tham khảo lịch sử.";
  const summary = high || score >= 7 ? "Có tin cần ưu tiên xác minh trước khi bạn chọn lịch trình." : count ? `Có ${count} tin để đối chiếu; bạn có thể xem ảnh hưởng đến kế hoạch của mình.` : available ? "Chưa có tin phù hợp; bạn có thể đối chiếu thông báo địa phương." : "Bạn có thể kiểm tra nguồn tin địa phương trước khi đi.";
  return { key: "news", title: "Tin tức và sự kiện địa phương", label: high ? "Có tín hiệu rủi ro trong tin đã phân loại" : score >= 7 ? "Có tiêu đề cần ưu tiên xác minh" : count ? "Có tin mới để đối chiếu" : available ? "Đã tra cứu tin mới" : "Tin mới chưa khả dụng", tone: high ? "error" : count && (score == null || score > 0) || !available ? "warning" : "info", score, modelScore, attention, summary, advice,
    facts: [["Mức lưu ý từ tiêu đề", score == null ? "Chưa có mẫu phù hợp để chấm" : `${score}/10 · tạm tính`], ["Tin trong mẫu 7 ngày", available ? `${count} bài (tối đa 12)` : "Chưa lấy được"], ["Phạm vi tin", recent?.place || "Địa bàn tỉnh của điểm đến"], ["Bài mới gần nhất", recent?.events?.[0]?.date || "Chưa có bài khớp bộ lọc"], ["Dữ liệu tin đã thu thập", fresh ? `${risk.num_articles || 0} bài còn mới` : risk.data_status === "stale" ? "Dữ liệu lịch sử đã cũ" : "Chưa có dữ liệu"]], detailPath: "/news", feedAvailable: available, recent };
}
export function weatherTripVerdict(weather, { fallback = false, forecastLoading = false, requestedDate = "", assessmentDate = "" } = {}) {
  const score = num(weather?.score);
  const high = score != null && (score >= 7 || weather.tone === "error");
  const caution = !high && (score == null || score >= 4 || fallback);
  const title = high ? "KHÔNG NÊN ĐI" : caution ? "CẦN LƯU Ý TRƯỚC KHI ĐI" : "NÊN ĐI";
  const conclusion = high ? "Thời tiết có rủi ro cao; nên hoãn hoặc đổi ngày đi." :
  score == null ? "Chưa lấy được thời tiết; cần cập nhật trước khi đi." :
  fallback ? requestedDate < assessmentDate ? "Ngày đã chọn đã qua; kết quả thời tiết đang áp dụng cho hôm nay." : forecastLoading ? "Đang lấy dự báo ngày đã chọn; kết luận sẽ cập nhật khi có dữ liệu." : "Chưa có dự báo ngày đã chọn; cần kiểm tra lại trước khi đi." :
  caution ? "Thời tiết có yếu tố cần lưu ý; nên chuẩn bị phương án phù hợp." :
  "Thời tiết ít rủi ro, phù hợp để thực hiện chuyến đi.";
  return { title, conclusion, label: title, tone: high ? "error" : caution ? "warning" : "success", decision: high ? "DONT_GO" : caution ? "CAUTION" : "GO" };
}

// The trip-level outcome combines the three displayed factors without inventing
// a traffic score. Headline scores are provisional, so they trigger verification
// rather than an automatic no-go recommendation.
export function overallTripVerdict({ weather, traffic, news, fallback = false } = {}) {
  const severeWeather = weather?.score != null && (weather.score >= 7 || weather.tone === "error");
  const severeNews = news?.modelScore != null && news.modelScore >= 7;
  const weatherUnknown = weather?.score == null || fallback;
  const weatherNeedsCare = weather?.score != null && weather.score >= 4;
  const routeUnknown = !traffic?.routeAvailable;
  const newsUnknown = !news?.feedAvailable && news?.modelScore == null;
  const newsNeedsCheck = news?.score != null && news.score >= 3 || news?.modelScore != null && news.modelScore >= 4;

  const title = severeWeather || severeNews ? "KHÔNG NÊN ĐI" :
  weatherUnknown || weatherNeedsCare || routeUnknown || newsUnknown || newsNeedsCheck ?
  "CẦN LƯU Ý TRƯỚC KHI ĐI" :
  "NÊN ĐI";
  const tone = severeWeather || severeNews ? "error" : title === "NÊN ĐI" ? "success" : "warning";
  const decision = severeWeather || severeNews ? "DONT_GO" : title === "NÊN ĐI" ? "GO" : "CAUTION";

  const weatherStatus = weatherUnknown ? "chưa có dự báo đúng ngày" :
  severeWeather ? `thời tiết rủi ro cao (${weather.score.toFixed(1)}/10)` :
  weatherNeedsCare ? `thời tiết cần lưu ý (${weather.score.toFixed(1)}/10)` :
  `thời tiết ít lưu ý (${weather.score.toFixed(1)}/10)`;
  const routeStatus = routeUnknown ? "chưa xác nhận được tuyến" :
  "đã có tuyến đường và thời gian tham khảo";
  const newsStatus = severeNews || news?.modelScore >= 4 ? news.label : newsUnknown ? "nguồn tin mới chưa phản hồi" :
  newsNeedsCheck ? `${news.recent?.count || 0} tin · ${news.score >= 7 ? "lưu ý cao" : "cần kiểm tra ảnh hưởng"}` :
  news.recent?.count ? `${news.recent.count} tin trong mẫu, chưa đủ dấu hiệu chấm mức lưu ý` :
  "chưa thấy tin khớp trong mẫu 7 ngày";

  const conclusion = severeNews ? news.advice : severeWeather ?
  `Dự báo ${weatherStatus}; tuyến đường và tin địa phương vẫn cần được đối chiếu trước khi quyết định.` :
  title === "NÊN ĐI" ?
  `Dựa trên dữ liệu hiện có: ${weatherStatus}; ${routeStatus}; ${newsStatus}. Bạn có thể cân nhắc đi và kiểm tra lại gần giờ khởi hành.` :
  `Dữ liệu hiện có: ${weatherStatus}; ${routeStatus}; ${newsStatus}. Bạn có thể cân nhắc lịch trình linh hoạt và kiểm tra lại các nguồn trước khi đi.`;

  return {
    title, conclusion, tone, decision,
    factors: [
    { key: "weather", available: !weatherUnknown, label: "Thời tiết", value: weatherStatus, tone: severeWeather ? "error" : weatherUnknown || weatherNeedsCare ? "warning" : "success" },
    { key: "traffic", available: !routeUnknown, label: "Tuyến đường", value: routeStatus, tone: routeUnknown ? "warning" : "info" },
    { key: "news", available: !newsUnknown, label: "Tin địa phương", value: newsStatus, tone: newsUnknown || newsNeedsCheck ? "warning" : "info" }]

  };
}

export function buildTripAssessment(trip, forecasts = [], departureDate, forecastLoading = false, today = localToday()) {
  const requestedDate = departureDate || today;
  const valid = (w) => w && !w.error && num(w.adjusted_risk_score ?? w.risk_score) != null;
  const current = valid(trip?.weather) ? trip.weather : null;
  const requestedDay = forecasts.find((item) => item.date === requestedDate);
  const todayForecast = forecasts.find((item) => item.date === today);
  const useRequestedForecast = requestedDate > today && valid(requestedDay);
  const assessmentDate = useRequestedForecast ? requestedDate : today;
  const data = useRequestedForecast ? requestedDay : current || (valid(todayForecast) ? todayForecast : null);
  const context = useRequestedForecast || data && data === todayForecast ? "forecast" : "current";
  const weather = assessWeather(data, data?.air_quality, context);
  const traffic = assessTraffic(trip?.traffic),news = assessNews(trip?.risk),factors = [weather, traffic, news];
  const fallback = requestedDate !== today && !useRequestedForecast;
  const dateLabel = (date) => date.split("-").reverse().join("/");
  const scopeLabel = assessmentDate === today ? `Hôm nay · ${dateLabel(today)}` : `Ngày đi · ${dateLabel(assessmentDate)}`;
  const dateNotice = fallback ?
  requestedDate < today ?
  `Ngày dự kiến ${dateLabel(requestedDate)} đã qua. Kết luận này chỉ đánh giá hôm nay ${dateLabel(today)}, không đánh giá lại quá khứ.` :
  `${forecastLoading ? "Đang tìm" : "Chưa có"} dự báo phù hợp cho ngày ${dateLabel(requestedDate)}. Kết luận hiện áp dụng cho hôm nay ${dateLabel(today)}; không phải dự đoán cho ngày đó.` :
  useRequestedForecast ?
  `Chỉ dùng dự báo thời tiết ngày ${dateLabel(assessmentDate)}. Tuyến đường và tin tức phản ánh lần tra cứu hiện tại, cần kiểm tra lại gần giờ đi.` :
  `Chỉ đánh giá điều kiện hôm nay ${dateLabel(today)}. Các ngày dự báo khác không tham gia kết luận này.`;
  const danger = weather.tone === "error" || news.tone === "error";
  const unavailable = weather.score == null || !traffic.routeAvailable;
  const caution = !danger && (fallback || factors.some((f) => f.tone === "warning") || weather.airUnavailable);
  const decision = danger ? "DONT_GO" : unavailable ? "VERIFY" : caution ? "CAUTION" : "GO";
  const title = danger ? "KHÔNG NÊN ĐI" : unavailable || caution ? "CẦN LƯU Ý TRƯỚC KHI ĐI" : "NÊN ĐI";
  const conclusion = danger ?
  weather.tone === "error" ? "Rủi ro thời tiết cao; nên hoãn hoặc đổi ngày đi." : "Tin địa phương có tín hiệu rủi ro cao; nên xác minh trước khi khởi hành." :
  weather.score == null ? "Chưa lấy được thời tiết; cần cập nhật trước khi khởi hành." :
  !traffic.routeAvailable ? "Chưa xác nhận được tuyến đường; cần kiểm tra chỉ đường trước khi đi." :
  fallback ? requestedDate < today ? "Ngày đã chọn đã qua; kết quả này đánh giá hôm nay." : forecastLoading ? "Đang tải dự báo ngày đã chọn; kết luận sẽ cập nhật khi có dữ liệu." : "Chưa có dự báo cho ngày đã chọn; cần kiểm tra lại gần giờ đi." :
  weather.tone === "warning" ? "Thời tiết có yếu tố cần lưu ý; nên chuẩn bị phương án phù hợp." :
  news.recent?.count && news.tone === "warning" ? `Có ${news.recent.count} tin địa phương cần xác minh trước chuyến đi.` :
  !news.feedAvailable ? "Nguồn tin địa phương chưa phản hồi; cần đối chiếu trước khi đi." :
  weather.airUnavailable ? "Chưa có chỉ số không khí; cần kiểm tra thêm trước khi đi." :
  "Thời tiết ít điểm cần lưu ý, tuyến đường đã có; có thể thực hiện chuyến đi.";
  let advice = danger ? "Bạn có thể cân nhắc hoãn hoặc đổi thời điểm do có yếu tố rủi ro cao, sau khi đối chiếu cảnh báo tại địa phương." :
  unavailable ? `${weather.score == null ? "Nguồn thời tiết chưa phản hồi; hãy cập nhật đánh giá." : "Cần xác nhận tuyến đường trước khi khởi hành."} Những dữ liệu đã lấy được vẫn hiển thị riêng bên dưới.` :
  `${weather.score >= 4 ? "Thời tiết có yếu tố cần lưu ý; bạn có thể giữ lịch trình linh hoạt hoặc chọn hoạt động trong nhà." : "Thời tiết hiện có ít điểm cần lưu ý, chưa phải bảo đảm an toàn cho chuyến đi."} ${num(trip?.traffic?.time_normal_min) >= 240 ? "Hành trình dài, bạn có thể chia chặng và bố trí nghỉ." : "Bạn có thể dành thời gian dự phòng cho di chuyển."} Thời gian tuyến đường là ước tính và có thể thay đổi. ${news.recent?.count ? `Mức lưu ý tin tức ${news.score == null ? "chưa chấm được" : `${news.score}/10 (tạm tính)`}; bạn có thể mở nguồn để xác minh ảnh hưởng đến kế hoạch.` : "Chưa có mẫu tin phù hợp để kết luận mức ảnh hưởng; có thể đối chiếu thông báo địa phương."}`;
  advice += " Đây là gợi ý tham khảo; bạn chủ động quyết định theo điều kiện thực tế và nhu cầu của mình.";
  const summary = danger ? "Bạn có thể cân nhắc đổi lịch và đối chiếu cảnh báo địa phương." : unavailable ? "Có thông tin chưa đầy đủ; bạn có thể cập nhật trước khi chốt lịch." : caution ? "Bạn có thể cân nhắc chuyến đi với lịch trình linh hoạt và các lưu ý bên dưới." : "Điều kiện hiện có có thể phù hợp; bạn chủ động lựa chọn theo tình hình thực tế.";
  const weatherVerdict = weatherTripVerdict(weather, { fallback, forecastLoading, requestedDate, assessmentDate });
  const overallVerdict = overallTripVerdict({ weather, traffic, news, fallback });
  return { factors, weather, traffic, news, title, conclusion, summary, advice, decision, weatherVerdict, overallVerdict,
    tone: danger ? "error" : unavailable || caution ? "warning" : "success",
    label: title,
    weatherScore: weather.score, assessmentDate, requestedDate, scopeLabel, dateNotice, fallback,
    availableFactors: Number(weather.score != null) + Number(traffic.routeAvailable) + Number(news.feedAvailable),
    weatherData: data };
}
