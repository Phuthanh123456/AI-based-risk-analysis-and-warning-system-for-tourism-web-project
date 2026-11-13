import { useTranslate, getLocale } from "../i18n/index.js";import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import Typography from "@mui/material/Typography";

export default function FactorScale({ score, label, qualitative = false }) {const translate = useTranslate();
  if (score == null) return null;
  const level = score >= 7 ? "Lưu ý cao" : score >= 3 ? "Cần kiểm tra" : "Ít lưu ý";
  return <Box sx={{ p: 2, borderRadius: "12px", bgcolor: "action.hover" }}>
    <Typography variant="body2" fontWeight={700}>{translate(label)}</Typography>
    <Typography variant="h3" sx={{ my: 1 }}>{translate(qualitative ? level : `${Number(score).toLocaleString(getLocale(), { maximumFractionDigits: 1 })} / 10`)}</Typography>
    <LinearProgress aria-label={translate(label)} variant="determinate" value={Math.min(100, Math.max(0, score * 10))} color={score >= 7 ? "error" : score >= (qualitative ? 3 : 4) ? "warning" : "success"} sx={{ height: 8, borderRadius: 5 }} /><Typography variant="caption" color="text.secondary">{translate(qualitative ? "Ít lưu ý → Cần kiểm tra → Lưu ý cao. Dựa trên tiêu đề; hãy đọc bài gốc để xác minh ảnh hưởng." : "0–4: Thấp · 4–7: Cần lưu ý · 7–10: Cao")}</Typography>
  </Box>;
}
