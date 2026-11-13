import { useTranslate, getLocale } from "../i18n/index.js";import BaseMapTiles from "./BaseMapTiles";
import { useEffect, useMemo, useState } from "react";
import { CircleMarker, MapContainer, Popup, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { TRIP_PURPOSES } from "./tripPurposeConfig";
import "./TravelWorkspace.css";

const VIETNAM_CENTER = [16.2, 107.8];
const ORIGINS = [
{ label: "TP. Hồ Chí Minh", lat: 10.7769, lon: 106.7009 },
{ label: "Hà Nội", lat: 21.0278, lon: 105.8342 },
{ label: "Đà Nẵng", lat: 16.0544, lon: 108.2022 },
{ label: "Cần Thơ", lat: 10.0452, lon: 105.7469 }];

const RISK_NAMES = {
  Pricing_Issue: "Giá cả",
  Environmental_Cleanliness: "Môi trường",
  Safety_Security: "An ninh",
  Natural_Disaster: "Thiên tai",
  Fire_Accident_Risk: "Tai nạn, cháy nổ"
};

function MapMovement({ action, route, section }) {
  const map = useMap();
  useEffect(() => {
    if (!action) return;
    if (action.type === "flyTo" && action.center) {
      map.flyTo(action.center, action.zoom || 8, { duration: 0.6 });
    } else if (action.type === "fitBounds" && action.bounds?.length >= 2) {
      map.fitBounds(action.bounds, { padding: [44, 44] });
    } else if (action.type === "resetVN") {
      map.flyTo(VIETNAM_CENTER, 6, { duration: 0.6 });
    }
  }, [action, map]);
  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 120);
    return () => clearTimeout(timer);
  }, [map, section]);
  useEffect(() => {
    if (route?.length >= 2) map.fitBounds(route, { padding: [44, 44] });
  }, [map, route]);
  return null;
}

function formatDay(value) {
  if (!value) return "—";
  const day = new Date(`${value}T12:00:00`);
  return Number.isNaN(day.getTime()) ? value : day.toLocaleDateString(getLocale(), { day: "2-digit", month: "2-digit" });
}

function riskTone(score) {
  if (score == null) return "neutral";
  if (score >= 7) return "danger";
  if (score >= 4) return "caution";
  return "calm";
}

export function TravelWorkspace({
  session, logout, theme, toggleTheme,
  destination, setDestination, tripPurpose, setTripPurpose, canTrip, tripLoading, onCheckTrip,
  userPos, originName, gpsLoading, getGPS, onChooseOrigin,
  tripRes, err, routeCoords, mapAction, resetVN, focusUser, focusRoute, openGoogleDirections,
  forecastData, forecastLoading, selectedDateIndex, setSelectedDateIndex,
  provinces, selectedProv, selectedRisk, onPickProvince,
  tripHistory, tripHistoryLoading, deleteTripHistoryEntry,
  pushStatus, enableWeatherAlerts, canNotify
}) {const translate = useTranslate();
  const [section, setSection] = useState("overview");
  const [originChoice, setOriginChoice] = useState("");
  const [provinceQuery, setProvinceQuery] = useState("");
  const [showHelp, setShowHelp] = useState(false);
  const [showEditor, setShowEditor] = useState(false);

  const matchingProvinces = useMemo(() => {
    const q = provinceQuery.trim().toLocaleLowerCase("vi-VN");
    if (!q) return provinces;
    return provinces.filter((province) => province.province.toLocaleLowerCase("vi-VN").includes(q));
  }, [provinceQuery, provinces]);

  const weatherDay = forecastData[selectedDateIndex] || null;
  const currentWeather = tripRes?.weather?.error ? null : tripRes?.weather;
  const displayedWeather = weatherDay || currentWeather;
  const weatherRisk = displayedWeather?.adjusted_risk_score ?? displayedWeather?.risk_score;
  const recommendation = tripRes?.recommendation || "";
  const verdict = recommendation.includes("KHÔNG NÊN ĐI") ?
  { title: "Chưa nên khởi hành", tone: "danger", description: "Có điều kiện rủi ro cao trong dữ liệu hiện có. Hãy xem chi tiết trước khi quyết định." } :
  recommendation.includes("CẨN THẬN") ?
  { title: "Cần kiểm tra thêm trước chuyến đi", tone: "caution", description: "Một số nguồn dữ liệu còn thiếu hoặc có điều kiện cần lưu ý." } :
  { title: "Có thể tiếp tục lên kế hoạch", tone: "calm", description: "Đây là đánh giá tham khảo từ dữ liệu hiện có. Hãy kiểm tra thông tin thực tế trước khi đi." };

  function chooseOrigin(event) {
    const next = event.target.value;
    setOriginChoice(next);
    const origin = ORIGINS.find((item) => item.label === next);
    if (origin) onChooseOrigin(origin);
  }

  return (
    <div className={`travel-app view-${section}`}>
      <a className="travel-skip" href="#travel-main">{translate("Bỏ qua điều hướng")}</a>
      <header className="travel-header">
        <div className="travel-header-inner">
          <div className="travel-brand" aria-label={translate("An tâm hành trình")}>
            <span className="travel-brand-mark" aria-hidden="true">{translate("A")}</span>
            <span><strong>{translate("An tâm hành trình")}</strong><small>{translate("Thông tin trước mỗi chuyến đi")}</small></span>
          </div>
          <div className="travel-header-actions">
            <button type="button" className="travel-text-button" onClick={() => setShowHelp((open) => !open)} aria-expanded={showHelp}>{translate("Cách sử dụng")}</button>
            <button type="button" className="travel-text-button" onClick={toggleTheme}>{translate(theme === "dark" ? "Giao diện sáng" : "Giao diện tối")}</button>
            <button type="button" className="travel-outline-button" onClick={logout} title={translate(session?.user?.email || "Đăng xuất")}>{translate("Đăng xuất")}</button>
          </div>
        </div>
      </header>

      <main id="travel-main" className="travel-main">
        <div className={`travel-intro ${tripRes ? "travel-intro-compact" : ""}`}>
          <div>
            <p className="travel-eyebrow">{translate("LÊN KẾ HOẠCH CÓ THÔNG TIN")}</p>
            <h1>{translate(tripRes ? "Thông tin cho chuyến đi của bạn" : "Đi đâu, đi như thế nào, cần lưu ý gì?")}</h1>
            <p>{translate(tripRes ? "Xem nhận định tổng quan, rồi mở từng mục để hiểu rõ dữ liệu." : "Chọn điểm xuất phát và điểm đến. Bạn sẽ nhận được nhận định ngắn gọn, rồi xem riêng từng yếu tố khi cần.")}</p>
          </div>
          <div className="travel-intro-note">{translate("Dữ liệu hỗ trợ quyết định; điều kiện thực tế có thể thay đổi trước giờ khởi hành.")}</div>
        </div>

        {translate(showHelp &&
        <div className="travel-help" role="note">
            <strong>{translate("Ba bước đơn giản:")}</strong>{translate(" chọn điểm xuất phát, nhập điểm đến, nhấn “Xem đánh giá”. Sau đó mở từng mục Thời tiết, Tuyến đường hoặc Tin tức để xem chi tiết. Khi dữ liệu thiếu hoặc cũ, hệ thống sẽ ghi rõ.")}
        </div>)
        }

        <div className="travel-layout">
          <div className="travel-column">
            <section className="travel-card travel-plan" aria-labelledby="travel-plan-title">
              <div className="travel-section-heading"><span className="travel-step">{translate("01")}</span><div><h2 id="travel-plan-title">{translate(tripRes && !showEditor ? "Chuyến đi của bạn" : "Chọn chuyến đi")}</h2><p>{translate(tripRes && !showEditor ? "Bạn có thể thay đổi và tra cứu lại bất cứ lúc nào." : "Bắt đầu từ nơi bạn sẽ khởi hành.")}</p></div></div>
              {translate(tripRes && !showEditor ?
              <div className="travel-trip-summary">
                  <div><span>{translate("Xuất phát")}</span><strong>{translate(originName || "Vị trí đã chọn")}</strong></div>
                  <div><span>{translate("Điểm đến")}</span><strong>{translate(tripRes.to?.name || destination)}</strong></div>
                  <button type="button" className="travel-outline-button travel-wide" onClick={() => setShowEditor(true)}>{translate("Thay đổi chuyến đi")}</button>
                </div> :
              <>
              <div className="travel-field">
                <label htmlFor="travel-origin">{translate("Điểm xuất phát")}</label>
                <div className="travel-origin-row">
                  <select id="travel-origin" value={originChoice} onChange={chooseOrigin}>
                    <option value="">{translate("Chọn thành phố")}</option>
                    {translate(ORIGINS.map((item) => <option value={item.label} key={item.label}>{translate(item.label)}</option>))}
                  </select>
                  <button type="button" className="travel-outline-button" onClick={() => {setOriginChoice("");getGPS();}} disabled={gpsLoading}>{translate(gpsLoading ? "Đang xác định…" : "Dùng vị trí của tôi")}</button>
                </div>
                <p className="travel-field-hint">{translate(userPos ? `Đang dùng: ${originName || "vị trí đã chọn"}. Bạn có thể thay đổi trước khi xem đánh giá.` : "Bạn có thể chọn thành phố; không bắt buộc cấp quyền vị trí.")}</p>
              </div>
              <div className="travel-field">
                <label htmlFor="travel-destination">{translate("Điểm đến")}</label>
                <input id="travel-destination" value={destination} onChange={(event) => setDestination(event.target.value)} placeholder={translate("Ví dụ: Đà Lạt, Nha Trang")} autoComplete="off" />
              </div>
              <div className="travel-field">
                <label htmlFor="travel-purpose">{translate("Bạn dự định đi cùng ai?")}</label>
                <select id="travel-purpose" value={tripPurpose || ""} onChange={(event) => setTripPurpose(event.target.value || null)}>
                  <option value="">{translate("Chuyến đi thông thường")}</option>
                  {translate(TRIP_PURPOSES.map((purpose) => <option value={purpose.key} key={purpose.key}>{translate(purpose.label)}</option>))}
                </select>
                <p className="travel-field-hint">{translate("Tùy chọn này giúp điều chỉnh lưu ý thời tiết; không làm giảm cảnh báo nguy hiểm.")}</p>
              </div>
              <button className="travel-primary-button" type="button" onClick={() => {setSection("overview");setShowEditor(false);onCheckTrip();}} disabled={!canTrip || tripLoading}>{translate(tripLoading ? "Đang tổng hợp dữ liệu…" : "Xem đánh giá chuyến đi")}</button>
              {translate(!canTrip && <p className="travel-field-hint">{translate("Chọn điểm xuất phát và nhập điểm đến để tiếp tục.")}</p>)}
              </>)}
              {translate(err && <p className="travel-error" role="alert">{translate(err)}</p>)}
            </section>

            <nav className="travel-tabs" aria-label={translate("Thông tin chuyến đi")}>
              {translate([
              ["overview", "Tổng quan"], ["weather", "Thời tiết"],
              ["route", "Tuyến đường"], ["news", "Tin tức"], ["history", "Đã lưu"]].
              map(([key, label]) =>
              <button type="button" key={key} className={section === key ? "active" : ""} onClick={() => setSection(key)} aria-pressed={section === key}>{translate(label)}</button>
              ))}
            </nav>

            <section className="travel-card travel-detail" aria-live="polite">
              {translate(section === "overview" &&
              <>
                  <div className="travel-section-heading"><span className="travel-step">{translate("02")}</span><div><h2>{translate("Nhận định cho chuyến đi")}</h2><p>{translate("Các yếu tố quan trọng được tóm tắt tại đây.")}</p></div></div>
                  {translate(!tripRes ? <div className="travel-empty"><strong>{translate("Chưa có đánh giá")}</strong><p>{translate("Chọn điểm xuất phát và điểm đến ở phía trên. Kết quả sẽ xuất hiện tại đây sau khi bạn nhấn xem đánh giá.")}</p></div> :
                <>
                      <div className={`travel-verdict ${verdict.tone}`}><span className="travel-verdict-label">{translate(tripRes.to?.name || destination)}</span><h3>{translate(verdict.title)}</h3><p>{translate(verdict.description)}</p></div>
                      <div className="travel-facts">
                        <div><span>{translate("Thời tiết hiện tại")}</span><strong>{translate(currentWeather?.risk_score != null ? `${currentWeather.risk_score}/10` : "Chưa có")}</strong><small>{translate("Điểm rủi ro, 10 là cao nhất")}</small></div>
                        <div><span>{translate("Đường đi")}</span><strong>{translate(tripRes.traffic?.distance_km != null ? `${tripRes.traffic.distance_km} km` : "Chưa có")}</strong><small>{translate(tripRes.traffic?.traffic_available === false ? "Thời gian chỉ là ước tính" : "Có dữ liệu tuyến đường")}</small></div>
                        <div><span>{translate("Tin tức")}</span><strong>{translate(tripRes.risk?.data_status === "fresh" ? "Có tin mới" : "Cần kiểm tra")}</strong><small>{translate(tripRes.risk?.data_status === "stale" ? `Bài gần nhất: ${tripRes.risk.latest_article_date || "không rõ"}` : tripRes.risk?.data_status === "no_data" ? "Chưa có dữ liệu cho điểm đến" : `${tripRes.risk?.num_articles || 0} bài trong ${tripRes.risk?.recent_window_days || 30} ngày`)}</small></div>
                      </div>
                      <div className="travel-next"><strong>{translate("Xem kỹ trước khi quyết định")}</strong><p>{translate("Mở từng mục bên trên để xem dự báo, tuyến đường và độ mới của nguồn tin. Nhận định này không thay thế cảnh báo từ cơ quan chức năng.")}</p></div>
                    </>)
                }
                </>)
              }

              {translate(section === "weather" &&
              <>
                  <div className="travel-section-heading"><span className="travel-step">{translate("03")}</span><div><h2>{translate("Thời tiết điểm đến")}</h2><p>{translate("Xem từng ngày, một ngày tại một thời điểm.")}</p></div></div>
                  {translate(!tripRes ? <div className="travel-empty">{translate("Xem đánh giá chuyến đi trước để tải dự báo cho điểm đến.")}</div> :
                <>
                      {translate(forecastLoading && <p className="travel-field-hint" role="status">{translate("Đang tải dự báo nhiều ngày…")}</p>)}
                      {translate(!forecastLoading && forecastData.length === 0 && currentWeather && <p className="travel-data-note warning">{translate("Chưa tải được dự báo nhiều ngày. Thông tin bên dưới chỉ là thời tiết hiện tại tại điểm đến.")}</p>)}
                      {translate(forecastData.length > 0 && <div className="travel-days" aria-label={translate("Chọn ngày dự báo")}>{translate(forecastData.map((day, index) => {
                      const score = day.adjusted_risk_score ?? day.risk_score;
                      return <button type="button" key={day.date || index} className={selectedDateIndex === index ? "selected" : ""} onClick={() => setSelectedDateIndex(index)} aria-pressed={selectedDateIndex === index}><span>{translate(formatDay(day.date))}</span><strong>{translate(day.temperature != null ? `${Math.round(day.temperature)}°` : "—")}</strong><small className={`travel-score-dot ${riskTone(score)}`}>{translate(score != null ? `${Number(score).toFixed(1)}/10` : "Chưa có")}</small></button>;
                    }))}</div>)}
                      {translate(displayedWeather ? <div className="travel-weather-detail">
                        <div className="travel-weather-lead"><div><span>{translate("Đánh giá thời tiết ")}{translate(weatherDay ? `ngày ${formatDay(weatherDay.date)}` : "hiện tại")}</span><strong className={riskTone(weatherRisk)}>{translate(weatherRisk != null ? `${Number(weatherRisk).toFixed(1)}/10` : "Chưa có")}</strong></div><p>{translate("Điểm rủi ro dự báo; số cao hơn nghĩa là cần thận trọng hơn.")}</p></div>
                        <dl className="travel-data-grid"><div><dt>{translate("Nhiệt độ")}</dt><dd>{translate(displayedWeather.temperature != null ? `${Math.round(displayedWeather.temperature)}°C` : "—")}</dd></div><div><dt>{translate("Lượng mưa")}</dt><dd>{translate(displayedWeather.precipitation != null ? `${displayedWeather.precipitation} mm` : "—")}</dd></div><div><dt>{translate("Gió")}</dt><dd>{translate(displayedWeather.wind != null ? `${displayedWeather.wind} km/h` : "—")}</dd></div><div><dt>{translate("UV")}</dt><dd>{translate(displayedWeather.uv_index ?? "—")}</dd></div></dl>
                        {translate(displayedWeather.health_advice && <p className="travel-advice">{translate(displayedWeather.health_advice.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, "").trim())}</p>)}
                        <p className="travel-source">{translate(weatherDay ? "Dự báo" : "Dữ liệu thời tiết hiện tại")}{translate(" từ Open-Meteo; mức rủi ro do mô hình thời tiết của dự án tính. Điều kiện thực tế có thể thay đổi.")}</p>
                      </div> : <div className="travel-empty">{translate("Chưa tải được dữ liệu thời tiết. Hãy thử xem lại chuyến đi sau.")}</div>)}
                      {translate(canNotify && <button type="button" className="travel-outline-button travel-wide" onClick={enableWeatherAlerts} disabled={pushStatus === "loading" || pushStatus === "enabled"}>{translate(pushStatus === "enabled" ? "Đã bật thông báo thời tiết" : pushStatus === "loading" ? "Đang bật thông báo…" : pushStatus === "denied" ? "Trình duyệt đã từ chối thông báo" : "Bật thông báo thời tiết")}</button>)}
                    </>)
                }
                </>)
              }

              {translate(section === "route" &&
              <>
                  <div className="travel-section-heading"><span className="travel-step">{translate("04")}</span><div><h2>{translate("Tuyến đường dự kiến")}</h2><p>{translate("Đường đi hiển thị trên bản đồ bên cạnh.")}</p></div></div>
                  {translate(!tripRes ? <div className="travel-empty">{translate("Chọn chuyến đi để xem tuyến đường và thời gian ước tính.")}</div> : <>
                    <div className="travel-route-endpoints"><div><span>{translate("Từ")}</span><strong>{translate(originName || "Điểm xuất phát đã chọn")}</strong></div><div><span>{translate("Đến")}</span><strong>{translate(tripRes.to?.name)}</strong></div></div>
                    <dl className="travel-data-grid"><div><dt>{translate("Quãng đường")}</dt><dd>{translate(tripRes.traffic?.distance_km ?? "—")}{translate(" km")}</dd></div><div><dt>{translate("Thời gian dự kiến")}</dt><dd>{translate(tripRes.traffic?.time_normal_human || "Chưa có")}</dd></div></dl>
                    <div className="travel-data-note">{translate(tripRes.traffic?.traffic_available === false ? "Chưa có dữ liệu giao thông trực tiếp. Thời gian trên là ước tính theo tuyến đường và không phản ánh kẹt xe hiện tại." : `Có dữ liệu giao thông trực tiếp. Thời gian dự kiến theo tình hình hiện tại: ${tripRes.traffic?.time_traffic_human || "chưa có"}.`)}</div>
                    <div className="travel-inline-actions"><button type="button" className="travel-outline-button" onClick={focusRoute}>{translate("Xem toàn tuyến")}</button><button type="button" className="travel-outline-button" onClick={openGoogleDirections}>{translate("Mở chỉ đường")}</button></div>
                    <p className="travel-source">{translate("Tuyến đường tham khảo từ ")}{translate(tripRes.traffic?.route_polyline_provider === "serpapi" ? "Google Maps" : "OSRM")}{translate(". Kiểm tra biển báo và điều kiện đường thực tế trước khi đi.")}</p>
                  </>)}
                </>)
              }

              {translate(section === "news" &&
              <>
                  <div className="travel-section-heading"><span className="travel-step">{translate("05")}</span><div><h2>{translate("Tin tức và dữ liệu địa phương")}</h2><p>{translate("Luôn xem ngày cập nhật trước khi dựa vào điểm rủi ro.")}</p></div></div>
                  {translate(tripRes ? <div className={`travel-data-note ${tripRes.risk?.data_status === "fresh" ? "" : "warning"}`}>{translate(tripRes.risk?.data_status === "fresh" ? `Có ${tripRes.risk.num_articles} bài trong ${tripRes.risk.recent_window_days} ngày gần đây về ${tripRes.to?.province_inferred || "điểm đến"}. Điểm tin tức tham khảo: ${tripRes.risk.risk_score}/10.` : tripRes.risk?.data_status === "stale" ? `Chưa có tin mới cho ${tripRes.to?.province_inferred || "điểm đến"}. Bài gần nhất: ${tripRes.risk.latest_article_date || "không rõ"}. Điểm lịch sử không đại diện cho tình hình hiện tại.` : "Chưa có dữ liệu tin tức cho điểm đến này. Không thể kết luận mức an toàn từ nguồn tin hiện có.")}</div> : <div className="travel-data-note">{translate("Chọn chuyến đi hoặc tra cứu tỉnh bên dưới để xem nguồn tin đã thu thập.")}</div>)}
                  <div className="travel-field"><label htmlFor="travel-province-search">{translate("Tra cứu một tỉnh")}</label><input id="travel-province-search" value={provinceQuery} onChange={(event) => setProvinceQuery(event.target.value)} placeholder={translate("Nhập tên tỉnh")} /></div>
                  <div className="travel-province-list">{translate(matchingProvinces.slice(0, provinceQuery ? 8 : 6).map((province) => <button type="button" key={province.province} onClick={() => onPickProvince(province, { fly: true })} className={selectedProv?.province === province.province ? "selected" : ""}>{translate(province.province)}</button>))}</div>
                  {translate(provinceQuery && !matchingProvinces.length && <p className="travel-field-hint">{translate("Không tìm thấy tỉnh phù hợp.")}</p>)}
                  {translate(selectedProv && <div className="travel-province-detail"><strong>{translate(selectedProv.province)}</strong>{translate(selectedRisk ? <><p>{translate(!selectedRisk.num_articles ? "Chưa có bài báo phù hợp trong dữ liệu đã thu thập. Không thể suy ra mức an toàn hiện tại." : selectedRisk.is_stale ? `Tin gần nhất: ${selectedRisk.latest_article_date || "không rõ"}. Dữ liệu đã cũ, không dùng điểm lịch sử để kết luận hiện tại.` : `Điểm rủi ro tin tức tham khảo: ${selectedRisk.overall_risk_score}/10 từ ${selectedRisk.num_articles} bài.`)}</p>{translate(selectedRisk.num_articles > 0 && <details><summary>{translate("Xem nhóm tin đã ghi nhận")}</summary><dl>{translate(Object.entries(selectedRisk.risk_assessment || {}).map(([key, count]) => <div key={key}><dt>{translate(RISK_NAMES[key] || key)}</dt><dd>{translate(count)}</dd></div>))}</dl></details>)}</> : <p>{translate("Đang tải dữ liệu tỉnh…")}</p>)}</div>)}
                  <p className="travel-source">{translate("Mô hình phân loại mức liên quan của bài báo; quy tắc xác định loại sự cố. Tin được thu thập theo đợt, không phải nguồn cảnh báo thời gian thực.")}</p>
                </>)
              }

              {translate(section === "history" &&
              <>
                  <div className="travel-section-heading"><span className="travel-step">{translate("06")}</span><div><h2>{translate("Chuyến đi đã lưu")}</h2><p>{translate("Để bạn xem lại các lần tra cứu trước.")}</p></div></div>
                  {translate(tripHistoryLoading ? <div className="travel-empty">{translate("Đang tải lịch sử…")}</div> : tripHistory.length === 0 ? <div className="travel-empty">{translate("Chưa có chuyến đi nào được lưu.")}</div> : <div className="travel-history">{translate(tripHistory.map((item) => <div key={item.id}><div><strong>{translate(item.destination)}</strong><small>{translate(new Date(item.created_at).toLocaleString(getLocale()))}</small></div><button type="button" onClick={() => deleteTripHistoryEntry(item.id)} aria-label={translate(`Xóa chuyến đi ${item.destination}`)}>{translate("Xóa")}</button></div>))}</div>)}
                  <p className="travel-source">{translate("Kết quả cũ phản ánh dữ liệu tại thời điểm tra cứu. Hãy tra lại trước chuyến đi mới.")}</p>
                </>)
              }
            </section>
          </div>

          <section className="travel-map-column" aria-label={translate("Bản đồ chuyến đi")}>
            <div className="travel-map-heading"><div><span>{translate("BẢN ĐỒ HÀNH TRÌNH")}</span><h2>{translate(tripRes?.to?.name || "Khám phá điểm đến")}</h2></div><div className="travel-map-actions"><button type="button" onClick={focusUser} disabled={!userPos}>{translate("Điểm xuất phát")}</button><button type="button" onClick={focusRoute} disabled={!routeCoords?.length}>{translate("Toàn tuyến")}</button><button type="button" onClick={resetVN}>{translate("Đặt lại")}</button></div></div>
            <div className="travel-map-frame">
              <MapContainer center={VIETNAM_CENTER} zoom={6} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
                <MapMovement action={mapAction} route={routeCoords} section={section} />
                <BaseMapTiles />
                {translate(section === "news" && provinces.map((province) => <CircleMarker key={province.province} center={[province.lat, province.lon]} radius={selectedProv?.province === province.province ? 8 : 5} pathOptions={{ color: "#fff", weight: 2, fillColor: "#217a69", fillOpacity: 0.9 }} eventHandlers={{ click: () => onPickProvince(province) }}><Popup>{translate(province.province)}</Popup></CircleMarker>))}
                {translate(userPos && <CircleMarker center={[userPos.lat, userPos.lon]} radius={9} pathOptions={{ color: "#fff", weight: 3, fillColor: "#1e5e52", fillOpacity: 1 }}><Popup>{translate("Điểm xuất phát: ")}{translate(originName || "vị trí đã chọn")}</Popup></CircleMarker>)}
                {translate(tripRes?.to?.lat && tripRes?.to?.lon && <CircleMarker center={[tripRes.to.lat, tripRes.to.lon]} radius={9} pathOptions={{ color: "#fff", weight: 3, fillColor: "#d89541", fillOpacity: 1 }}><Popup>{translate("Điểm đến: ")}{translate(tripRes.to.name)}</Popup></CircleMarker>)}
                {translate(routeCoords?.length >= 2 && <Polyline positions={routeCoords} pathOptions={{ color: "#1f6b5c", weight: 5, opacity: 0.9 }} />)}
              </MapContainer>
              {translate(tripLoading && <div className="travel-map-loading" role="status">{translate("Đang kiểm tra tuyến đường và thời tiết…")}</div>)}
            </div>
            <p className="travel-map-footnote">{translate("Bản đồ và thời gian di chuyển là thông tin tham khảo. Kiểm tra tình hình đường sá trước khi xuất phát.")}</p>
          </section>
        </div>
      </main>
    </div>);

}
