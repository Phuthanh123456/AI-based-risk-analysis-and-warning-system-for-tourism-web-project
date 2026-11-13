import { TRIP_PURPOSES } from "../components/tripPurposeConfig.js";

const number = value => value != null && Number.isFinite(Number(value)) ? Number(value) : null;

export function weatherPurposeAdvice(weather, purpose) {
  const selected = TRIP_PURPOSES.find(item => item.key === purpose);
  if (!selected) return null;
  const score = number(weather?.adjusted_risk_score ?? weather?.risk_score);
  if (!weather || weather.error || score == null) return { label: selected.label, text: "Bạn có thể giữ lịch trình linh hoạt và kiểm tra lại dự báo trước khi chốt hoạt động cho chuyến đi." };
  const severe = score >= 7 || number(weather.risk_level) >= 4;
  const rain = number(weather.precipitation) >= 5;
  const wind = number(weather.wind) >= 25;
  const visibility = number(weather.visibility_km);
  const caution = score >= 4 || rain || wind || (visibility != null && visibility < 2);
  const tips = {
    dating: severe ? "Bạn có thể đổi ngày hẹn hoặc chọn địa điểm trong nhà gần nơi lưu trú, hạn chế di chuyển khi thời tiết xấu."
      : caution ? "Có thể chọn quán cà phê, bảo tàng hoặc địa điểm có mái che cho buổi hẹn; giữ linh hoạt giờ đi và chuẩn bị đồ che mưa nếu cần."
        : "Có thể cân nhắc đi dạo hoặc ngắm cảnh cho buổi hẹn, đồng thời chuẩn bị một điểm dừng trong nhà nếu thời tiết thay đổi.",
    family: severe ? "Bạn có thể hoãn hoạt động ngoài trời của cả nhà và chọn nơi trú an toàn, thuận tiện di chuyển."
      : caution ? "Có thể ưu tiên hoạt động có mái che, chặng di chuyển ngắn và điểm nghỉ thuận tiện, nhất là khi có trẻ nhỏ hoặc người lớn tuổi."
        : "Có thể lên lịch hoạt động ngoài trời vừa sức, chia chặng ngắn và bố trí điểm nghỉ cho cả nhà.",
    adventure: severe ? "Bạn có thể cân nhắc hoãn trekking, leo núi hoặc hoạt động trên nước và đối chiếu hướng dẫn của đơn vị tổ chức."
      : caution ? "Có thể chọn tuyến ngắn, dễ quay lại; kiểm tra điều kiện tại chỗ với hướng dẫn viên trước khi vào vùng núi, suối hoặc hoạt động trên nước."
        : "Có thể cân nhắc tuyến phù hợp kinh nghiệm, kiểm tra trang bị và thông báo lịch trình cho người đồng hành hoặc đơn vị tổ chức.",
    solo: severe ? "Nếu đi một mình, bạn có thể đổi lịch, ở gần nơi lưu trú và chia sẻ vị trí với người tin cậy."
      : caution ? "Có thể ưu tiên nơi dễ tiếp cận, tránh khu vực vắng khi thời tiết xấu; chuẩn bị pin dự phòng và chia sẻ lịch trình."
        : "Có thể chọn lịch trình linh hoạt, di chuyển khi còn sáng và chia sẻ điểm đến dự kiến với người tin cậy.",
  };
  const sun = number(weather.uv_index) >= 7 || number(weather.temperature) >= 35;
  return { label: selected.label, text: tips[purpose] + (sun ? " Có thể ưu tiên giờ mát, mang nước và đồ chống nắng." : "") };
}
