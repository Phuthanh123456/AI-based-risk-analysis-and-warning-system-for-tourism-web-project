import { useEffect, useState } from "react";
import { Alert, Box, Button, CircularProgress, Paper, Stack, Typography } from "@mui/material";
import { apiGet } from "../api";
import { useLanguage } from "../i18n/index.js";

export default function AdminPage({ token }) {
  const vi = useLanguage() === "vi";
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState(null);

  useEffect(() => {
    let active = true;
    setResult(null);
    apiGet("/api/admin/overview", token).then(
      (data) => { if (active) setResult(data.counts ? { data } : { error: vi ? "API quản trị chưa sẵn sàng." : "The admin API is unavailable." }); },
      (error) => { if (active) setResult({ error: error.message }); }
    );
    return () => { active = false; };
  }, [token, revision, vi]);

  if (!result) return <CircularProgress aria-label={vi ? "Đang tải" : "Loading"} />;
  if (result.error) return <Stack spacing={2} alignItems="flex-start">
    <Alert severity="error">{result.error === "Administrator access required"
      ? (vi ? "Trang này chỉ dành cho quản trị viên." : result.error)
      : result.error}</Alert>
    <Button onClick={() => setRevision((n) => n + 1)}>{vi ? "Thử lại" : "Retry"}</Button>
  </Stack>;

  const { counts, sign_in_providers, destinations } = result.data;
  const metrics = [
    [vi ? "Tài khoản" : "Accounts", counts.accounts],
    [vi ? "Đánh giá đã lưu" : "Saved assessments", counts.assessments],
    [vi ? "Lượt đăng nhập" : "Sign-ins", counts.sign_ins],
    [vi ? "Đăng ký cảnh báo" : "Push subscriptions", counts.subscriptions],
  ];

  return <Stack spacing={3}>
    <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={2}>
      <Box>
        <Typography variant="h1">{vi ? "Quản trị VietJourney" : "VietJourney administration"}</Typography>
        <Typography color="text.secondary">{vi ? "Theo dõi mức sử dụng và cảnh báo thời tiết." : "Monitor usage and weather alert subscriptions."}</Typography>
      </Box>
      <Button variant="outlined" onClick={() => setRevision((n) => n + 1)} sx={{ alignSelf: "flex-start" }}>
        {vi ? "Tải lại" : "Refresh"}
      </Button>
    </Stack>
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" }, gap: 2 }}>
      {metrics.map(([label, count]) => <Paper key={label} variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
        <Typography color="text.secondary">{label}</Typography>
        <Typography variant="h2" sx={{ mt: 1 }}>{count.toLocaleString(vi ? "vi-VN" : "en-US")}</Typography>
      </Paper>)}
    </Box>
    {[
      [vi ? "Đăng nhập theo phương thức" : "Sign-ins by method", sign_in_providers, "provider"],
      [vi ? "Điểm đến được đánh giá nhiều nhất" : "Most assessed destinations", destinations, "destination"],
    ].map(([title, entries, key]) => <Paper key={key} variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
      <Typography variant="h3">{title}</Typography>
      {entries.length ? <Stack component="ul" spacing={1} sx={{ listStyle: "none", pl: 0 }}>
        {entries.map((item) => <Stack component="li" key={item[key]} direction="row" justifyContent="space-between" gap={2}>
          <Typography sx={{ overflowWrap: "anywhere" }}>{item[key]}</Typography><strong>{item.total}</strong>
        </Stack>)}
      </Stack> : <Typography color="text.secondary" sx={{ mt: 1 }}>{vi ? "Chưa đủ dữ liệu." : "No data yet."}</Typography>}
    </Paper>)}
  </Stack>;
}
