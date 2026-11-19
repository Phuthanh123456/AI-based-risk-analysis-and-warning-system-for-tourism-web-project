import { NavLink } from "react-router-dom";
import { createElement } from "react";
import Explore from "@mui/icons-material/ExploreOutlined";
import Route from "@mui/icons-material/RouteOutlined";
import Map from "@mui/icons-material/MapOutlined";
import Cloud from "@mui/icons-material/WbCloudyOutlined";
import Article from "@mui/icons-material/ArticleOutlined";
import Assessment from "@mui/icons-material/AssessmentOutlined";
import Compare from "@mui/icons-material/CompareArrowsRounded";
import History from "@mui/icons-material/HistoryRounded";
import Notifications from "@mui/icons-material/NotificationsNoneRounded";
import { useTranslate } from "../i18n/index.js";

const items = [["/explore", "Khám phá", Explore], ["/plan", "Lên hành trình", Route], ["/result", "Kết quả rủi ro", Assessment], ["/map", "Bản đồ", Map], ["/weather", "Thời tiết", Cloud], ["/news", "Tin tức địa phương", Article], ["/compare", "So sánh điểm đến", Compare], ["/alerts", "Cảnh báo của bạn", Notifications], ["/history", "Lịch sử hành trình", History]];
export default function WorkspaceNavigation() {
  const t = useTranslate();
  return <nav className="guardian-workspace-rail" aria-label={t("Điều hướng công cụ")}>{items.map(([to, label, Icon]) => <NavLink key={to} to={to} aria-label={t(label)}>{createElement(Icon, { "aria-hidden": true })}<span aria-hidden="true">{t(label)}</span></NavLink>)}</nav>;
}
