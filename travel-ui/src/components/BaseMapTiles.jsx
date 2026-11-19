import { useState } from "react";
import { GeoJSON, Pane, TileLayer } from "react-leaflet";
import vietnam from "../tourism/geography/vietnam.json";
import neighbors from "../tourism/geography/neighbors.json";

const tileSources = [
  {url: "https://tile.openstreetmap.de/{z}/{x}/{y}.png", credit: ' · <a href="https://openstreetmap.de/germanstyle/">FOSSGIS</a>'},
  {url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png", credit: ""},
];
const osmCredit = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

export default function BaseMapTiles() {
  const [sourceIndex, setSourceIndex] = useState(0);
  const source = tileSources[sourceIndex];
  return <>
    <Pane name="geographic-overview" style={{zIndex: 180, pointerEvents: "none"}}>
      <GeoJSON data={neighbors} interactive={false} style={{color:"#a9b8a6",weight:1,fillColor:"#e4e7da",fillOpacity:1}} />
      <GeoJSON data={vietnam} interactive={false} style={{color:"#729b86",weight:1,fillColor:"#c9ddca",fillOpacity:1}}
        attribution='<a href="https://www.naturalearthdata.com/">Natural Earth</a>' />
    </Pane>
    <TileLayer key={source.url} url={source.url} attribution={osmCredit + source.credit} maxZoom={18}
      eventHandlers={{tileerror: () => { if (sourceIndex === 0) setSourceIndex(1); }}} />
  </>;
}
