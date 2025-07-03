"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

type Property = {
  id: string;
  title: string;
  price: number;
  lat: number;
  lng: number;
};

type Props = {
  properties: Property[];
  onRegionChange?: (bounds: mapboxgl.LngLatBoundsLike) => void;
};

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

export default function MapBoxMap({ properties, onRegionChange }: Props) {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [properties[0]?.lng ?? 0, properties[0]?.lat ?? 0],
      zoom: 10
    });

    mapRef.current.on("load", () => {
      setLoaded(true);

      // Add markers
      properties.forEach((p) => {
        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
          `<h3>$${p.price}</h3><p>${p.title}</p>`
        );

        new mapboxgl.Marker({ color: "#2563eb" }) // Tailwind's blue-600
          .setLngLat([p.lng, p.lat])
          .setPopup(popup)
          .addTo(mapRef.current!);
      });
    });

    // Handle bounds change
    mapRef.current.on("moveend", () => {
      const bounds = mapRef.current?.getBounds();
      if (!bounds || !onRegionChange) return;
      onRegionChange(bounds);
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [properties]);

  return (
    <div
      className="w-full h-[400px] rounded-2xl shadow-md overflow-hidden border dark:border-gray-700"
      ref={mapContainerRef}
    >
      {!loaded && (
        <p className="text-center py-4 text-gray-500 dark:text-gray-300">
          Loading map...
        </p>
      )}
    </div>
  );
}
