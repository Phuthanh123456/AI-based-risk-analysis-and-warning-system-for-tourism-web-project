import { useState } from "react";
import { Link } from "react-router-dom";
import { useContext } from "react";
import { TravelContext } from "../portal/TravelContext";
import { useTranslate } from "../i18n/index.js";

export default function JourneyRail() {
  const t = useTranslate();
  const travel = useContext(TravelContext);
  const trip = travel?.tripRes;
  const today = new Date();
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const locale = t("Trang chủ") === "Trang chủ" ? "vi-VN" : "en-GB";
  const dayCount = new Date(month.getFullYear(), month.getMonth()+1, 0).getDate();
  function shift(delta) { setMonth(new Date(month.getFullYear(), month.getMonth()+delta, 1)); }
  return <aside className="journey-calendar">
    <header><strong>{month.toLocaleDateString(locale,{month:"long",year:"numeric"})}</strong>
      <button aria-label={locale==="vi-VN"?"Tháng trước":"Previous month"} onClick={()=>shift(-1)}>‹</button>
      <button aria-label={locale==="vi-VN"?"Tháng sau":"Next month"} onClick={()=>shift(1)}>›</button></header>
    <div className="calendar-grid">{Array.from({length:7},(_,i)=><small key={"w"+i}>{new Date(2024,0,1+i).toLocaleDateString(locale,{weekday:"short"})}</small>)}
      {Array.from({length:(month.getDay()+6)%7},(_,i)=><span key={"pad"+i}/>)}
      {Array.from({length:dayCount},(_,i)=><span key={i} aria-current={month.getFullYear()===today.getFullYear() && month.getMonth()===today.getMonth() && i+1===today.getDate()?"date":undefined}>{i+1}</span>)}
    </div>
    {trip?.to && <section className="rail-itinerary">
      <small>{t("Hành trình của bạn")}</small>
      <h2>{travel.destination || trip.to.name}</h2>
      <Link to="/result">{t("Đánh giá chuyến đi")} →</Link>
      {Number.isFinite(trip.weather?.temperature) && <Link to="/weather">{t("Nhiệt độ hiện tại")} <strong>{trip.weather.temperature} °C</strong></Link>}
      {trip.traffic?.route_polyline && <Link to="/traffic">{t("Xem bản đồ hành trình")} →</Link>}
    </section>}
    <Link className="tour-button tour-button-blue" to="/plan">{t("Lên hành trình")} →</Link>
  </aside>;
}
