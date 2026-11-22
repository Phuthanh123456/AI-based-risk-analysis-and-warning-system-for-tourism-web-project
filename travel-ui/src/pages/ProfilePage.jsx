import { useState } from "react";
import { Link } from "react-router-dom";
import { Avatar, Box, Button, Stack, TextField, Typography } from "@mui/material";
import { useLanguage } from "../i18n";

const fields = [
  ["name", "Tên hiển thị", "Display name"],
  ["home", "Nơi bạn sống", "Where you live"],
  ["favorite", "Điểm đến yêu thích", "Favorite destination"],
  ["style", "Phong cách du lịch", "Travel style"],
  ["bio", "Giới thiệu bản thân", "About you"],
];

export default function ProfilePage({ email }) {
  const vi = useLanguage() === "vi";
  const label = (vn, en) => vi ? vn : en;
  const storageKey = "vietjourney.profile:" + email;
  const [profile, setProfile] = useState(() => {
    try { return JSON.parse(localStorage.getItem(storageKey)) || {}; }
    catch { return {}; }
  });
  const [status, setStatus] = useState("");

  function save(event) {
    event.preventDefault();
    try {
      localStorage.setItem(storageKey, JSON.stringify(profile));
      setStatus("saved");
    } catch { setStatus("error"); }
  }

  return (
    <Box className="portal-page">
      <Stack className="portal-section" direction="row" spacing={2} alignItems="center">
        <Avatar sx={{ bgcolor: "primary.main", width: 56, height: 56 }}>
          {profile.name?.trim().charAt(0).toUpperCase()}
        </Avatar>
        <Box sx={{ minWidth: 0, overflowWrap: "anywhere" }}>
          <Typography component="h1" variant="h2">{label("Hồ sơ du lịch", "Traveler profile")}</Typography>
          <Typography color="text.secondary">{email}</Typography>
        </Box>
      </Stack>
      <Box sx={{ display: "grid", gap: 3, alignItems: "start", gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" } }}>
        <Stack component="form" className="portal-section" spacing={2.5} onSubmit={save}>
          <Typography component="h2" variant="h3">{label("Thông tin của bạn", "Your information")}</Typography>
          <Typography color="text.secondary">{label("Thêm vài thông tin để hồ sơ mang dấu ấn của bạn. Các mục đều tùy chọn và được lưu trên trình duyệt này.", "Make this profile yours. All fields are optional and saved in this browser.")}</Typography>
          {fields.map(([key, vn, en]) => (
            <TextField key={key} label={label(vn, en)} value={profile[key] ?? ""}
              multiline={key === "bio"} minRows={key === "bio" ? 3 : undefined}
              slotProps={{ htmlInput: { maxLength: key === "bio" ? 500 : 120 } }}
              onChange={event => {
                setProfile({ ...profile, [key]: event.target.value });
                setStatus("");
              }} />
          ))}
          <Button type="submit" variant="contained" sx={{ alignSelf: "flex-start" }}>{label("Lưu hồ sơ", "Save profile")}</Button>
          <Box role="status">
            {status === "saved" && label("Đã lưu hồ sơ.", "Profile saved.")}
            {status === "error" && label("Trình duyệt chưa lưu được hồ sơ.", "Your browser could not save the profile.")}
          </Box>
        </Stack>
        <Stack className="portal-section" spacing={2}>
          <Typography component="h2" variant="h3">{label("Lịch sử tra cứu", "Trip history")}</Typography>
          <Typography color="text.secondary">{label("Xem lại các chuyến đi đã đánh giá khi đăng nhập.", "Revisit the trips you assessed while signed in.")}</Typography>
          <Button component={Link} to="/history" variant="outlined">{label("Xem lịch sử", "View history")}</Button>
        </Stack>
      </Box>
    </Box>
  );
}
