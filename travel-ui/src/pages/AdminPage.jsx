import { useEffect, useState } from "react";
import { Alert, Button, CircularProgress, FormControlLabel, IconButton, Switch, useTheme } from "@mui/material";
import DashboardOutlined from "@mui/icons-material/DashboardOutlined";
import TimelineOutlined from "@mui/icons-material/TimelineOutlined";
import PlaceOutlined from "@mui/icons-material/PlaceOutlined";
import GroupsOutlined from "@mui/icons-material/GroupsOutlined";
import NotificationsNone from "@mui/icons-material/NotificationsNone";
import ExploreOutlined from "@mui/icons-material/ExploreOutlined";
import LogoutOutlined from "@mui/icons-material/LogoutOutlined";
import RefreshOutlined from "@mui/icons-material/RefreshOutlined";
import DarkModeOutlined from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlined from "@mui/icons-material/LightModeOutlined";
import { Link } from "react-router-dom";
import { apiGet } from "../api";
import { useLanguage } from "../i18n/index.js";
import { withAdminDemoData } from "./adminDemoData";
import "./AdminPage.css";

function ActivityChart({ days, labels, dateLabel }) {
  if (!days.length) return <p>{labels.empty}</p>;
  const step = Math.max(1, Math.ceil(Math.max(...days.flatMap((day) => [day.assessments, day.sign_ins])) / 4));
  const x = (index) => 48 + index * 540 / Math.max(days.length - 1, 1);
  const y = (value) => 174 - value * 152 / (step * 4);
  return <>
    <div className="vj-admin-legend">
      <span className="vj-admin-series">{labels.assessments}</span>
      <span className="vj-admin-series vj-admin-series--alt">{labels.signIns}</span>
    </div>
    <svg className="vj-admin-chart" viewBox="0 0 612 210" role="img" aria-label={labels.chart} preserveAspectRatio="xMidYMid meet">
      {[0, 1, 2, 3, 4].map((tick) => <g key={tick}>
        <line x1="48" x2="588" y1={y(tick * step)} y2={y(tick * step)} />
        <text x="39" y={y(tick * step) + 4} textAnchor="end">{tick * step}</text>
      </g>)}
      {days.map((day, index) => (index % 3 === 0 || index === days.length - 1) &&
        <text key={day.date} x={x(index)} y="199" textAnchor="middle">{dateLabel(day.date)}</text>)}
      {["assessments", "sign_ins"].map((key) => <g key={key} className={key === "assessments" ? "vj-admin-line" : "vj-admin-line vj-admin-line--alt"}>
        <polyline points={days.map((day, index) => [x(index), y(day[key])].join(",")).join(" ")} />
        {days.map((day, index) => <circle key={day.date} cx={x(index)} cy={y(day[key])} r="3"><title>{dateLabel(day.date)} · {day[key]}</title></circle>)}
      </g>)}
    </svg>
  </>;
}

export default function AdminPage({ token, email, logout, toggleTheme }) {
  const vi = useLanguage() === "vi";
  const theme = useTheme();
  const dark = theme.palette.mode === "dark";
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState(null);
  const [demo, setDemo] = useState(false);
  const [section, setSection] = useState("overview");
  const t = (vn, en) => vi ? vn : en;
  const labels = {
    empty: t("Chưa có dữ liệu.", "No data yet."),
    chart: t("Biểu đồ hoạt động 14 ngày", "14-day activity chart"),
    assessments: t("Đánh giá đã lưu", "Saved assessments"),
    signIns: t("Lượt đăng nhập", "Sign-ins"),
  };
  const locale = vi ? "vi-VN" : "en-GB";
  const number = new Intl.NumberFormat(locale);
  const dates = new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", timeZone: "UTC" });
  const dateLabel = (date) => dates.format(new Date(date));
  const sections = [
    ["overview", t("Tổng quan", "Overview"), DashboardOutlined],
    ["activity", t("Hoạt động hệ thống", "System activity"), TimelineOutlined],
    ["destinations", t("Điểm đến", "Destinations"), PlaceOutlined],
  ];

  useEffect(() => {
    let active = true;
    apiGet("/api/admin/overview", token).then(
      (data) => {
        if (active) setResult(data?.counts ? { data, updated: new Date() } : { unavailable: true });
      },
      (error) => { if (active) setResult({ error: error.message }); }
    );
    return () => { active = false; };
  }, [token, revision]);

  function refresh() {
    setResult(null);
    setRevision((value) => value + 1);
  }

  const live = result?.data;
  const data = demo && live?.activity ? withAdminDemoData(live) : live;
  const days = data?.activity ?? [];
  const metrics = data ? [
    [t("Tài khoản", "Accounts"), data.counts.accounts, GroupsOutlined],
    [labels.assessments, data.counts.assessments, ExploreOutlined],
    [labels.signIns, data.counts.sign_ins, TimelineOutlined],
    [t("Đăng ký cảnh báo", "Alert subscriptions"), data.counts.subscriptions, NotificationsNone],
  ] : [];
  const daily = [...days].reverse();

  return <div className={dark ? "vj-admin vj-admin--dark" : "vj-admin"}>
    <aside className="vj-admin-sidebar">
      <Link className="vj-admin-brand" to="/"><span><ExploreOutlined /></span><div>VietJourney<small>{t("Quản trị hệ thống", "Administration")}</small></div></Link>
      <nav aria-label={t("Điều hướng quản trị", "Admin navigation")}>
        {sections.map(([id, label, Icon]) => <button type="button" key={id} aria-current={section === id ? "location" : undefined} onClick={() => {
          setSection(id);
          document.getElementById("vj-admin-" + id)?.scrollIntoView({ block: "start" });
        }}><Icon fontSize="small" />{label}</button>)}
      </nav>
      <Link className="vj-admin-return" to="/plan">{t("Về trang lập hành trình", "Back to trip planner")}</Link>
    </aside>
    <div className="vj-admin-workspace">
      <header className="vj-admin-topbar">
        <span>{t("Quản trị", "Admin")} <span aria-hidden="true">/</span> <strong>{sections.find(([id]) => id === section)[1]}</strong></span>
        <div className="vj-admin-actions">
          <IconButton onClick={toggleTheme} aria-label={t("Đổi giao diện sáng tối", "Toggle color theme")}>{dark ? <LightModeOutlined /> : <DarkModeOutlined />}</IconButton>
          <span className="vj-admin-email">{email}</span>
          <IconButton onClick={logout} aria-label={t("Đăng xuất", "Sign out")}><LogoutOutlined /></IconButton>
        </div>
      </header>
      <main className="vj-admin-content" id="vj-admin-overview">
        <div className="vj-admin-hero">
          <div>
            <span className="vj-admin-kicker">VIETJOURNEY</span>
            <h1>{t("Tổng quan", "Operations")} <em>{t("vận hành", "overview")}</em></h1>
            <p>{t("Theo dõi hoạt động đánh giá chuyến đi và sử dụng dịch vụ.", "Track trip assessments and platform activity.")}</p>
          </div>
          <div className="vj-admin-hero-actions">
            <FormControlLabel
              control={<Switch size="small" checked={demo} onChange={(_, checked) => setDemo(checked)} disabled={!live?.activity} />}
              label={t("Dữ liệu demo", "Demo data")}
            />
            {result?.updated && <time dateTime={result.updated.toISOString()}>{t("Cập nhật", "Updated")} {result.updated.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}</time>}
            <Button variant="contained" startIcon={<RefreshOutlined />} onClick={refresh} disabled={!result}>
              {t("Tải lại dữ liệu", "Refresh data")}
            </Button>
          </div>
        </div>
        {demo && data && <Alert severity="info">{t(
          "Chế độ demo · Số liệu thật cộng 100 tài khoản và hoạt động mô phỏng.",
          "Demo mode · Live totals plus 100 simulated accounts and sample activity."
        )}</Alert>}
        {!result && <CircularProgress aria-label={t("Đang tải", "Loading")} />}
        {result && !data && <Alert severity="error">{result.error === "Administrator access required"
          ? t("Trang này chỉ dành cho quản trị viên.", "Administrator access required.")
          : result.error || t("API quản trị chưa sẵn sàng.", "The admin API is unavailable.")}</Alert>}
        {data && <>
          <section className="vj-admin-metrics" aria-label={t("Số liệu tổng quan", "Key metrics")}>
            {metrics.map(([label, value, Icon]) => <article className="vj-admin-card vj-admin-metric" key={label}>
              <div className="vj-admin-icon"><Icon fontSize="small" /></div>
              <div><span>{label}</span><strong>{number.format(value)}</strong></div>
            </article>)}
          </section>
          <div className="vj-admin-grid">
            <section className="vj-admin-card vj-admin-panel" id="vj-admin-activity">
              <h2>{t("Nhịp hoạt động", "Activity trends")}</h2>
              <p>{t("Đánh giá và đăng nhập mỗi ngày trong 14 ngày gần nhất (UTC).", "Daily assessments and sign-ins over the last 14 days (UTC).")}</p>
              <ActivityChart days={days} labels={labels} dateLabel={dateLabel} />
            </section>
            <section className="vj-admin-card vj-admin-panel">
              <h2>{t("Phương thức đăng nhập", "Sign-in methods")}</h2>
              <p>{t("Tổng lượt đăng nhập đã ghi nhận.", "All recorded sign-ins.")}</p>
              {data.sign_in_providers.length ? <ul className="vj-admin-list">{data.sign_in_providers.map(({ provider, total }) =>
                <li key={provider}><span>{provider === "password" ? t("Email và mật khẩu", "Email and password") : provider === "google" ? "Google" : provider}</span><strong>{number.format(total)}</strong></li>
              )}</ul> : <p>{labels.empty}</p>}
            </section>
          </div>
          <section className="vj-admin-card vj-admin-panel vj-admin-table-panel">
            <h2>{t("Hoạt động gần đây", "Recent activity")}</h2>
            <p>{t("Số liệu tổng hợp theo ngày (UTC).", "Daily totals (UTC).")}</p>
            {days.length ? <div className="vj-admin-table-wrap"><table>
              <thead><tr><th scope="col">{t("Ngày", "Date")}</th><th scope="col">{labels.assessments}</th><th scope="col">{labels.signIns}</th></tr></thead>
              <tbody>{daily.slice(0, 7).map((day) => <tr key={day.date}><th scope="row"><time dateTime={day.date}>{dateLabel(day.date)}</time></th><td>{number.format(day.assessments)}</td><td>{number.format(day.sign_ins)}</td></tr>)}</tbody>
            </table></div> : <p>{labels.empty}</p>}
          </section>
          <section className="vj-admin-card vj-admin-panel vj-admin-table-panel" id="vj-admin-destinations">
            <h2>{t("Điểm đến được quan tâm", "Popular destinations")}</h2>
            <p>{t("Tối đa 10 điểm đến có từ hai lượt đánh giá đã lưu.", "Up to 10 destinations with at least two saved assessments.")}</p>
            {data.destinations.length ? <div className="vj-admin-table-wrap"><table>
              <thead><tr><th scope="col">{t("Điểm đến", "Destination")}</th><th scope="col">{labels.assessments}</th></tr></thead>
              <tbody>{data.destinations.map((item) => <tr key={item.destination}><th scope="row">{item.destination}</th><td>{number.format(item.total)}</td></tr>)}</tbody>
            </table></div> : <p>{labels.empty}</p>}
          </section>
        </>}
      </main>
    </div>
  </div>;
}
