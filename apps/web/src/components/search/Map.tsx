"use client";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Tooltip,
  ZoomControl
} from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import L, { marker } from "leaflet";

delete (L.Icon.Default.prototype as any)._getIconUrl;

// Custom pointer icon
const customIcon = new L.Icon({
  iconUrl: "/map-pointer.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
  shadowSize: [40, 40],
  shadowAnchor: [13, 40],
  className: "custom-map-icon"
});

type MapProps = {
  center: LatLngExpression;
  markers: {
    position: LatLngExpression;
    title: string;
  }[];
};

export default function PropertyMap({ center, markers }: MapProps) {
  if (!center || !markers) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        Map data unavailable
      </div>
    );
  }
  return (
    <MapContainer
      center={center}
      zoom={12}
      scrollWheelZoom={true}
      zoomControl={false}
      className="w-full h-full rounded-2xl shadow-md z-10"
    >
      <ZoomControl position="topright" />

      <TileLayer
        attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {markers.map((marker, idx) => (
        <Marker
          position={marker.position}
          icon={customIcon}
          key={`${marker.position}-${marker.title}`}
        >
          <Tooltip
            direction="top"
            offset={[0, -15]}
            opacity={0.9}
            permanent
            className="!bg-white !text-blue-600 rounded px-2 py-1 shadow"
          >
            {marker.title}
          </Tooltip>
          <Popup className="custom-popup">
            <div className="p-2 space-y-1 text-sm">
              <h3 className="font-semibold">{marker.title}</h3>
              <p className="text-xs text-gray-500">Tap to view details</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
