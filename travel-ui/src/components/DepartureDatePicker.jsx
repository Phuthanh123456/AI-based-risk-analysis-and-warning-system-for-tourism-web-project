import { useTranslate } from "../i18n/index.js";import { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import { localToday } from "../portal/tripAssessment";
import { planningDays } from "../portal/planningDates";

export default function DepartureDatePicker({ value, onChange }) {const translate = useTranslate();
  const [today, setToday] = useState(localToday);
  const rail = useRef(null);
  const days = planningDays(today);
  const lastDate = days.at(-1).date;
  useEffect(() => {
    const refresh = () => setToday(localToday());
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    const timer = setInterval(refresh, 60000);
    return () => {window.removeEventListener("focus", refresh);document.removeEventListener("visibilitychange", refresh);clearInterval(timer);};
  }, []);
  useEffect(() => {
    if (value && value < today) onChange(today);
  }, [today, value, onChange]);
  useEffect(() => {
    const container = rail.current;
    const selected = container?.querySelector('[aria-pressed="true"]');
    if (!selected || !container) return;
    function alignSelected() {
      // Only move the horizontal rail; do not scroll the whole form on load.
      const overflow = selected.offsetLeft + selected.offsetWidth - container.clientWidth;
      container.scrollLeft = Math.max(0, overflow + 12);
    }
    alignSelected();
    const observer = new ResizeObserver(alignSelected);
    observer.observe(container);
    return () => observer.disconnect();
  }, [value, today]);
  function scroll(direction) {
    rail.current?.scrollBy({ left: direction * 240, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }
  return <Box sx={{ minWidth: 0 }}>
    <TextField type="date" label={translate("Ngày đi dự kiến")} value={value} onChange={(event) => onChange(event.target.value)} fullWidth required slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: today, max: lastDate } }} helperText={translate("Mặc định là hôm nay. Chọn nhanh một ngày trong dải bên dưới hoặc mở lịch.")} />
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mt: 1.5, mb: .5 }}>
      <Typography variant="body2" fontWeight={600}>{translate("Hôm nay và 7 ngày tiếp theo")}</Typography>
      <Box sx={{ display: "flex", flexShrink: 0 }}><IconButton aria-label={translate("Cuộn về các ngày trước")} onClick={() => scroll(-1)}><ChevronLeftRoundedIcon /></IconButton><IconButton aria-label={translate("Cuộn đến các ngày tiếp theo")} onClick={() => scroll(1)}><ChevronRightRoundedIcon /></IconButton></Box>
    </Box>
    <Box ref={rail} role="group" aria-label={translate("Chọn ngày dự kiến trong tuần tới")} data-testid="departure-date-rail" sx={{ display: "flex", gap: 1, overflowX: "auto", position: "relative", pb: 1.5, scrollSnapType: "x proximity", scrollbarWidth: "thin", scrollbarColor: "#7b9bb3 transparent", "&::-webkit-scrollbar": { height: 8 }, "&::-webkit-scrollbar-thumb": { bgcolor: "#7b9bb3", borderRadius: 4 }, "& button": { flexShrink: 0, minWidth: 100, scrollSnapAlign: "start", display: "flex", flexDirection: "column", gap: .5, borderRadius: "12px", py: 1.25 } }}>
      {translate(days.map((day) => <Button key={day.date} type="button" variant={value === day.date ? "contained" : "outlined"} aria-pressed={value === day.date} aria-label={translate(`${day.label}, ${day.shortDate}/${day.date.slice(0, 4)}`)} data-date={day.date} onClick={() => onChange(day.date)}><span>{translate(day.label)}</span><Typography component="span" fontWeight={700} sx={{ fontSize: "1.1rem" }}>{translate(day.shortDate)}</Typography></Button>))}
    </Box>
    <Typography variant="caption" color="text.secondary">{translate("Dự báo phụ thuộc dữ liệu thực tế của ngày bạn chọn; ngày chưa có dự báo sẽ được thông báo rõ.")}</Typography>
  </Box>;
}
