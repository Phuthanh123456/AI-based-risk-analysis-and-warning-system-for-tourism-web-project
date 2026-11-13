import { getLocale } from "../i18n/index.js"; // Calendar arithmetic uses UTC so browser timezone / daylight saving cannot
// shift an ISO date. The caller supplies today's Vietnam calendar date.
export function planningDays(today) {
  const start = new Date(`${today}T00:00:00Z`);
  return Array.from({ length: 8 }, (_, offset) => {
    const day = new Date(start);
    day.setUTCDate(day.getUTCDate() + offset);
    const date = day.toISOString().slice(0, 10);
    return {
      date,
      label: offset === 0 ? "Hôm nay" : offset === 1 ? "Ngày mai" : new Intl.DateTimeFormat(getLocale(), { weekday: "short", timeZone: "UTC" }).format(day),
      shortDate: `${date.slice(8, 10)}/${date.slice(5, 7)}`
    };
  });
}
