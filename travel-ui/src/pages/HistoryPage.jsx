import { useTranslate, getLocale } from "../i18n/index.js";import { useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTravel } from "../portal/TravelContext";
import { getVerdict } from "../portal/format";
import { DataState, PageIntro, SourceNote } from "../portal/UiPrimitives";

export default function HistoryPage() {const translate = useTranslate();
  const travel = useTravel();
  const [toDelete, setToDelete] = useState(null);
  async function remove() {if (!toDelete) return;await travel.deleteTripHistoryEntry(toDelete.id);setToDelete(null);}
  return <div className="portal-page">
    <PageIntro eyebrow={translate("Lịch sử chuyến đi")} title={translate("Các lần tra cứu đã lưu")} description={translate("Mỗi kết quả phản ánh dữ liệu tại thời điểm tra cứu. Hãy đánh giá lại trước khi khởi hành.")} action={<Button variant="outlined" onClick={travel.loadTripHistory}>{translate("Tải lại")}</Button>} />
    {translate(travel.tripHistoryLoading && <Alert severity="info" icon={<CircularProgress size={18} />}>{translate("Đang tải lịch sử…")}</Alert>)}
    {translate(travel.tripHistoryError && <Alert severity="error">{translate("Không tải được lịch sử: ")}{translate(travel.tripHistoryError)}</Alert>)}
    {translate(!travel.tripHistoryLoading && !travel.tripHistoryError && travel.tripHistory.length === 0 && <DataState title={translate("Chưa có chuyến đi nào được lưu")} description={translate("Sau khi đánh giá khi đã đăng nhập, chuyến đi sẽ xuất hiện ở đây.")} />)}
    {translate(travel.tripHistory.length > 0 && <Box className="portal-section"><Stack spacing={0}>{translate(travel.tripHistory.map((item) => {const verdict = getVerdict(item.recommendation);return <Box key={item.id} sx={{ py: 2, borderBottom: "1px solid", borderColor: "divider", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 2 }}><Box><Typography component="h2" variant="h3">{translate(item.destination)}</Typography><Typography color="text.secondary" variant="body2">{translate(new Date(item.created_at).toLocaleString(getLocale()))}</Typography><Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 1 }}><Chip size="small" label={translate(verdict.label)} color={verdict.tone} variant="outlined" />{translate(item.weather_risk_score != null && <Chip size="small" label={translate(`Thời tiết ${item.weather_risk_score}/10`)} variant="outlined" />)}{translate(item.risk_score != null && <Chip size="small" label={translate(`Tin tức ${item.risk_score}/10`)} variant="outlined" />)}</Stack></Box><Button color="error" variant="text" onClick={() => setToDelete(item)}>{translate("Xóa")}</Button></Box>;}))}</Stack></Box>)}
    <SourceNote>{translate("Lịch sử không tự cập nhật theo tin tức hoặc thời tiết mới. Trước một chuyến đi mới, hãy lập kế hoạch và đánh giá lại.")}</SourceNote>
    <Dialog open={Boolean(toDelete)} onClose={() => setToDelete(null)} aria-labelledby="delete-trip-title"><DialogTitle id="delete-trip-title">{translate("Xóa chuyến đi đã lưu?")}</DialogTitle><DialogContent>{translate("Chuyến đi “")}{translate(toDelete?.destination)}{translate("” sẽ bị xóa khỏi lịch sử tài khoản.")}</DialogContent><DialogActions><Button onClick={() => setToDelete(null)}>{translate("Hủy")}</Button><Button color="error" variant="contained" onClick={remove}>{translate("Xóa")}</Button></DialogActions></Dialog>
  </div>;
}
