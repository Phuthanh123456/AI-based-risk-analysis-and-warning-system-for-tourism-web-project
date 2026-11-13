import { useTranslate, getLocale } from "../i18n/index.js";import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import { SourceNote } from "../portal/UiPrimitives";

export default function TripDecisionDashboard({ assessment, checkedAt }) {const translate = useTranslate();
  const verdict = assessment.overallVerdict;
  const advice = verdict.decision === "DONT_GO" ? "Bạn có thể cân nhắc đổi ngày hoặc điều chỉnh hành trình sau khi đối chiếu các cảnh báo liên quan." :
  verdict.decision === "GO" ? "Bạn có thể cân nhắc thực hiện chuyến đi và kiểm tra lại điều kiện gần giờ khởi hành." :
  "Bạn có thể giữ lịch trình linh hoạt, đối chiếu tuyến đường và đọc các tin liên quan trước khi quyết định.";
  return <Box component="section" aria-label={translate("Kết quả tổng quan hành trình")} sx={{ border: "1px solid", borderColor: "divider", borderRadius: "20px", overflow: "hidden", backgroundColor: "background.paper" }}>
    <Box sx={{ px: { xs: 2.5, md: 4 }, py: 2, borderBottom: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1.5, backgroundColor: "action.hover" }}>
      <Typography variant="body2" sx={{ letterSpacing: ".08em", textTransform: "uppercase", fontWeight: 700 }}>{translate("Kết quả tổng quan hành trình")}</Typography>
      <Chip data-testid="assessment-date" label={translate(assessment.scopeLabel)} variant="outlined" color="primary" />
    </Box>
    <Box sx={{ p: { xs: 2.5, md: 4 } }}>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.35fr 1fr" }, gap: { xs: 3, md: 5 }, alignItems: "start" }}>
        <Box>
          <Chip label={translate("KẾT LUẬN")} color={verdict.tone} sx={{ mb: 2, fontWeight: 700 }} />
          <Typography component="h2" variant="h2" data-testid="trip-verdict" sx={{ fontSize: { xs: "1.8rem", md: "2.2rem" }, lineHeight: 1.35 }}>{translate(verdict.title)}</Typography>
          <Typography data-testid="overall-conclusion" sx={{ mt: 1.5, lineHeight: 1.8 }}>{translate(advice)}</Typography>
        </Box>
        <Box component="section" aria-label={translate("Tóm tắt ba yếu tố")} sx={{ p: 2.5, border: "1px solid", borderColor: "divider", borderRadius: "16px" }}>
          <Typography component="h3" variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>{translate("Tóm tắt ba yếu tố")}</Typography>
          <Box sx={{ display: "grid", gap: 1.5 }}>{translate(verdict.factors.filter((factor) => factor.available).map((factor) => <Box key={factor.key} sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "125px minmax(0,1fr)" }, gap: { xs: .5, sm: 1.5 }, alignItems: "start" }}>
            <Typography variant="body2" fontWeight={700}>{translate(factor.label)}</Typography>
            <Typography variant="body2" color={factor.tone === "error" ? "error.main" : factor.tone === "warning" ? "warning.dark" : "text.primary"}>{translate(factor.value)}</Typography>
          </Box>))}</Box>
        </Box>
      </Box>
      <Box sx={{ mt: 3, pt: 2.5, borderTop: "1px solid", borderColor: "divider" }}>
        <SourceNote>{translate(assessment.dateNotice)}{translate(" Kết luận dựa trên dự báo thời tiết cho ngày đang chọn, tuyến tham khảo và mẫu tin mới trong 7 ngày. Thời gian tuyến không phản ánh ùn tắc trực tiếp; mức lưu ý tin tức suy ra từ tiêu đề và cần kiểm tra bài gốc. Thiếu dữ liệu không đồng nghĩa với an toàn. Đây là thông tin tham khảo để bạn tự quyết định. Lần đánh giá: ")}{translate(checkedAt ? new Date(checkedAt).toLocaleString(getLocale()) : "chưa rõ")}{translate(".")}</SourceNote>
      </Box>
    </Box>
  </Box>;
}
