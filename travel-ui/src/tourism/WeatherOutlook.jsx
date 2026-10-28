import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { dateLabel } from "../portal/format";

function numeric(value) { return value == null || !Number.isFinite(Number(value)) ? null : Number(value); }

export default function WeatherOutlook({ days }) {
  const data = days.map((day) => ({ date: day.date, temperature: numeric(day.temperature), risk: numeric(day.adjusted_risk_score ?? day.risk_score) }));
  if (!data.length) return null;
  return <section className="portal-section" aria-labelledby="weather-outlook-title">
    <p className="tour-kicker">NHÌN TRƯỚC NHỮNG NGÀY SẮP TỚI</p><h2 id="weather-outlook-title" className="weather-outlook-title">Thời tiết thay đổi, bạn vẫn chủ động.</h2>
    <p className="portal-chart-caption">Nhiệt độ và điểm rủi ro lấy trực tiếp từ dự báo hiện có. Hai đường dùng hai trục đo riêng; điểm rủi ro không phải xác suất an toàn.</p>
    <div className="portal-weather-chart" role="img" aria-label="Biểu đồ nhiệt độ và điểm rủi ro theo ngày. Bảng số liệu chi tiết ở ngay bên dưới.">
      <ResponsiveContainer width="100%" height="100%"><LineChart data={data} margin={{ top: 12, right: 8, left: -25, bottom: 0 }}><CartesianGrid stroke="var(--tour-line)" strokeDasharray="3 5" vertical={false} /><XAxis dataKey="date" tickFormatter={(date) => dateLabel(date).slice(0, 5)} tick={{ fontSize: 10, fill: "var(--tour-muted)" }} tickLine={false} axisLine={false} /><YAxis yAxisId="temperature" tick={{ fontSize: 10, fill: "var(--tour-muted)" }} unit="°" tickLine={false} axisLine={false} /><YAxis yAxisId="risk" orientation="right" domain={[0, 10]} tick={{ fontSize: 10, fill: "var(--tour-muted)" }} tickLine={false} axisLine={false} /><Tooltip labelFormatter={dateLabel} contentStyle={{ background: "var(--tour-surface)", borderColor: "var(--tour-line)", borderRadius: 12, fontSize: 11, color: "var(--tour-ink)" }} /><Legend wrapperStyle={{ fontSize: 11 }} /><Line yAxisId="temperature" dataKey="temperature" name="Nhiệt độ (°C)" stroke="#0078c8" strokeWidth={3} dot={{ r: 3 }} connectNulls={false} isAnimationActive={false} /><Line yAxisId="risk" dataKey="risk" name="Điểm rủi ro (/10)" stroke="#a65321" strokeWidth={2} strokeDasharray="6 4" dot={{ r: 3 }} connectNulls={false} isAnimationActive={false} /></LineChart></ResponsiveContainer>
    </div>
    <details className="weather-data-table"><summary>Xem bảng số liệu dự báo</summary><div><table><caption>Dữ liệu API theo từng ngày</caption><thead><tr><th scope="col">Ngày</th><th scope="col">Nhiệt độ °C</th><th scope="col">Rủi ro /10</th></tr></thead><tbody>{data.map((day) => <tr key={day.date}><th scope="row">{dateLabel(day.date)}</th><td>{day.temperature ?? "Chưa có"}</td><td>{day.risk ?? "Chưa có"}</td></tr>)}</tbody></table></div></details>
  </section>;
}
