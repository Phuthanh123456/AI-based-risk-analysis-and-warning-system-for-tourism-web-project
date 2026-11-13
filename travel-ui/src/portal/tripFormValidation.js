import { TRIP_PURPOSES } from "../components/tripPurposeConfig.js";
import { planningDays } from "./planningDates.js";

const coordinates = point => Number.isFinite(point?.lat) && Number.isFinite(point?.lon) && Math.abs(point.lat) <= 90 && Math.abs(point.lon) <= 180;

export function missingTripFields({ origin, destination, selectedDestination, date, purpose }, today) {
  const missing = [];
  if (!coordinates(origin)) missing.push("điểm xuất phát");
  if (!destination?.trim() || selectedDestination?.label !== destination || !coordinates(selectedDestination)) missing.push("điểm đến trong danh sách gợi ý");
  if (!planningDays(today).some(day => day.date === date)) missing.push("ngày đi hợp lệ từ hôm nay đến 7 ngày tiếp theo");
  if (!TRIP_PURPOSES.some(item => item.key === purpose)) missing.push("mục đích chuyến đi");
  return missing;
}
