import { getLocale } from "../i18n/index.js";export function getVerdict(recommendation) {
  const value = String(recommendation || "");
  if (value.includes("KHÔNG NÊN ĐI") || value.startsWith("Cân nhắc điều chỉnh hoặc hoãn")) return { label: "KHÔNG NÊN ĐI", vi: "Nên hoãn hoặc đổi lịch", tone: "error", css: "danger" };
  if (value.includes("CẨN THẬN") || value.includes("CẦN LƯU Ý TRƯỚC KHI ĐI") || value.startsWith("Cân nhắc các lưu ý")) return { label: "CẦN LƯU Ý TRƯỚC KHI ĐI", vi: "Có thông tin cần kiểm tra trước khi đi", tone: "warning", css: "caution" };
  if (value.includes("NÊN ĐI") || value.startsWith("Có thể cân nhắc hành trình")) return { label: "NÊN ĐI", vi: "Có thể thực hiện chuyến đi", tone: "success", css: "calm" };
  return { label: "CHƯA CÓ", vi: "Chưa đủ dữ liệu để kết luận", tone: "info", css: "neutral" };
}

export function dateLabel(value) {
  if (!value) return "Chưa rõ ngày";
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(getLocale(), { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function numberLabel(value, digits = 0, unit = "") {
  if (value == null || !Number.isFinite(Number(value))) return "Chưa có dữ liệu";
  return `${Number(value).toLocaleString(getLocale(), { maximumFractionDigits: digits })}${unit}`;
}
