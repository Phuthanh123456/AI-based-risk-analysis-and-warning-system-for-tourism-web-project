import { useTranslate } from "../i18n/index.js";import { Link } from "react-router-dom";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
export default function TripDetailNavigation() {const translate = useTranslate();
  return <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap><Button component={Link} to="/result" variant="outlined" startIcon={<ArrowBackOutlinedIcon />}>{translate("Quay lại tổng quan")}</Button><Button component={Link} to="/plan" state={{ editTrip: true }}>{translate("Chỉnh sửa chuyến đi")}</Button></Stack>;
}
