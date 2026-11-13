import { useTranslate } from "../i18n/index.js";import BaseMapTiles from "./BaseMapTiles";
import { useEffect, useState } from "react";
import { CircleMarker, MapContainer, Polyline, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTravel } from "../portal/TravelContext";

function Viewport({ points, action }) {
  const map = useMap();
  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);
  useEffect(() => {
    if (points.length >= 2) map.fitBounds(points, { padding: [28, 28], maxZoom: 15 });
  }, [map, points]);
  useEffect(() => {
    if (action?.type === "flyTo") map.flyTo(action.center, action.zoom || 12);
    if (action?.type === "fitBounds" && action.bounds?.length >= 2) map.fitBounds(action.bounds, { padding: [28, 28] });
  }, [map, action]);
  return null;
}

export default function JourneyMap() {const translate = useTranslate();
  const travel = useTravel(),trip = travel.tripRes;
  const [view, setView] = useState(null);
  const origin = trip?.from,destination = trip?.to;
  const geometry = Boolean(trip?.traffic?.route_polyline) && travel.routeCoords.length >= 2;
  // Endpoints frame the viewport when routing fails; never draw a fictional route.
  const points = geometry ? travel.routeCoords : [[origin?.lat, origin?.lon], [destination?.lat, destination?.lon]].filter((p) => p.every(Number.isFinite));
  return <Box component="section" aria-label={translate("Bản đồ tuyến đường")} sx={{ minWidth: 0, border: "1px solid", borderColor: "divider", borderRadius: "20px", overflow: "hidden", bgcolor: "background.paper" }}>
    <Box sx={{ p: 2.5 }}><Typography component="h2" variant="h3">{translate("Theo dõi hành trình trên bản đồ")}</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{translate("Xác định điểm đi, điểm đến và hình tuyến đường để đối chiếu với đánh giá bên cạnh.")}</Typography>
      <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mt: 1.5 }}><Button variant="outlined" onClick={() => setView({ type: "fitBounds", bounds: points })} disabled={points.length < 2}>{translate("Xem toàn tuyến")}</Button><Button variant="text" onClick={() => setView({ type: "flyTo", center: [origin.lat, origin.lon], zoom: 12 })} disabled={!origin}>{translate("Điểm xuất phát")}</Button></Stack>
    </Box>
    <Box data-testid="journey-map" sx={{ height: { xs: 340, md: 480 }, width: "100%", position: "relative", zIndex: 0 }}>
      <MapContainer center={points[0] || [16.2, 107.8]} zoom={6} scrollWheelZoom={false} style={{ width: "100%", height: "100%" }}>
        <Viewport points={points} action={view || travel.mapAction} />
        <BaseMapTiles />
        {translate(origin && <CircleMarker center={[origin.lat, origin.lon]} radius={8} pathOptions={{ color: "#fff", fillColor: "#176b58", fillOpacity: 1, weight: 3 }}><Popup>{translate("Xuất phát: ")}{translate(travel.originName || "Vị trí đã chọn")}</Popup></CircleMarker>)}
        {translate(destination && <CircleMarker center={[destination.lat, destination.lon]} radius={8} pathOptions={{ color: "#fff", fillColor: "#b7702f", fillOpacity: 1, weight: 3 }}><Popup>{translate("Điểm đến: ")}{translate(destination.name)}</Popup></CircleMarker>)}
        {translate(geometry && <Polyline positions={travel.routeCoords} pathOptions={{ color: "#176b58", weight: 5 }} />)}
      </MapContainer>
    </Box>
    <Box sx={{ p: 2.5 }}><Typography variant="body2">{translate("● Xanh: xuất phát và tuyến tham khảo · ● Cam: điểm đến")}</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{translate(geometry ? "Đường màu xanh là hình tuyến do dịch vụ định tuyến cung cấp, không phải lớp ùn tắc trực tiếp." : "Chỉ có vị trí hai đầu; chưa có hình tuyến để mô tả đường đi.")}{translate(" Bản đồ không xác nhận đường đang mở, không ngập hoặc không có sự cố.")}</Typography></Box>
  </Box>;
}
