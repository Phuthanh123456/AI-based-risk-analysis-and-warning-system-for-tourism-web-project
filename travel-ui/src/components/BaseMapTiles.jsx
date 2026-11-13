import { TileLayer } from "react-leaflet";

export default function BaseMapTiles() {
  return <TileLayer
    url="https://tile.openstreetmap.de/{z}/{x}/{y}.png"
    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · <a href="https://openstreetmap.de/germanstyle/">FOSSGIS</a>'
    maxZoom={18}
  />;
}
