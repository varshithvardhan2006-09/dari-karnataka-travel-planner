"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import placesData from "../../data/places.json";
import { Place } from "@/lib/schema";
import { getGoogleMapsSearchUrl, escapeHtml } from "@/lib/maps";

const allPlaces = placesData as Place[];

const REGION_BOUNDS: Record<string, [[number, number], [number, number]]> = {
  all: [
    [11.6, 74.0],
    [18.4, 77.8],
  ],
  mysuru: [
    [11.9, 75.8],
    [13.2, 76.9],
  ],
  hampi: [
    [15.1, 75.4],
    [17.0, 76.9],
  ],
  coast: [
    [12.8, 74.2],
    [14.9, 74.9],
  ],
  hills: [
    [12.1, 75.3],
    [13.6, 76.2],
  ],
  bengaluru: [
    [12.85, 77.45],
    [13.1, 77.7],
  ],
  north: [
    [15.2, 75.0],
    [18.0, 77.5],
  ],
};

const CATEGORY_PIN_COLORS: Record<string, string> = {
  heritage: "#8E1F2F", // Red
  food: "#D99A00", // Gold
  nature: "#1E6B52", // Green
  spiritual: "#2B5F8A", // Blue
  beach: "#0284C7", // Cyan
  adventure: "#EA580C", // Orange
  wildlife: "#15803D", // Forest
  coffee: "#78350F", // Brown
};

interface RegionMapProps {
  selectedRegion: string;
  onSelectPlace?: (place: Place) => void;
}

export default function RegionMap({ selectedRegion, onSelectPlace }: RegionMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  const createPinIcon = (category: string, isHighlighted: boolean) => {
    const color = CATEGORY_PIN_COLORS[category] || "#8E1F2F";
    const size = isHighlighted ? 24 : 16;
    const border = isHighlighted ? "2.5px solid #ffffff" : "1.5px solid #ffffff";
    const opacity = isHighlighted ? "1.0" : "0.5";
    const shadow = isHighlighted ? "0 2px 8px rgba(0,0,0,0.4)" : "0 1px 3px rgba(0,0,0,0.2)";

    return L.divIcon({
      className: "region-place-pin",
      html: `<div style="
        background-color: ${color};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: ${border};
        box-shadow: ${shadow};
        opacity: ${opacity};
        transition: all 0.2s ease;
      "></div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2],
    });
  };

  // 1. Initialize Map
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (mapRef.current) {
      try {
        mapRef.current.remove();
      } catch {
        // ignore
      }
      mapRef.current = null;
    }

    const rawContainer = container as unknown as { _leaflet_id?: number };
    if (rawContainer._leaflet_id) {
      delete rawContainer._leaflet_id;
    }
    container.innerHTML = "";

    const map = L.map(container, {
      center: [14.5, 75.8],
      zoom: 7,
      scrollWheelZoom: false,
      zoomControl: false,
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    mapRef.current = map;
    layerGroupRef.current = layerGroup;

    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    const handleResize = () => {
      map.invalidateSize();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
      if (layerGroupRef.current) {
        try {
          layerGroupRef.current.clearLayers();
        } catch {
          // ignore
        }
        layerGroupRef.current = null;
      }
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch {
          // ignore
        }
        mapRef.current = null;
      }
      if (rawContainer._leaflet_id) {
        delete rawContainer._leaflet_id;
      }
    };
  }, []);

  // 2. Render Markers and pan/zoom according to selectedRegion
  useEffect(() => {
    const map = mapRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    map.invalidateSize();
    layerGroup.clearLayers();

    const isPlaceMatching = (p: Place) => {
      if (selectedRegion === "all") return true;
      if (selectedRegion === "mysuru" && (p.region === "Mysuru" || p.region === "Hassan")) return true;
      if (selectedRegion === "hampi" && (p.region === "Hampi-Ballari" || p.region === "Badami-Bagalkot")) return true;
      if (selectedRegion === "coast" && (p.region === "Coast" || p.region === "North Kannada")) return true;
      if (selectedRegion === "hills" && (p.region === "Coorg" || p.region === "Chikkamagaluru")) return true;
      if (selectedRegion === "bengaluru" && p.region === "Bengaluru") return true;
      if (selectedRegion === "north" && (p.region === "Kalyana-Karnataka" || p.region === "Dharwad-Hubballi")) return true;
      return false;
    };

    allPlaces.forEach((place) => {
      const isHighlighted = isPlaceMatching(place);
      const category = place.categories[0] || "heritage";

      const marker = L.marker([place.lat, place.lng], {
        icon: createPinIcon(category, isHighlighted),
        zIndexOffset: isHighlighted ? 500 : 10,
      }).addTo(layerGroup);

      // Popup
      const mapsUrl = getGoogleMapsSearchUrl(place);
      marker.bindPopup(
        `<div style="font-family: inherit; font-size: 13px; line-height: 1.4; padding: 2px; min-width: 140px;">
          <div style="font-weight: 800; color: #14202B; font-size: 14px;">${escapeHtml(place.name_en)}</div>
          <div style="color: #8E1F2F; font-size: 12px; font-weight: 600;">${escapeHtml(place.name_kn)}</div>
          <div style="color: #586673; font-size: 11px; margin-top: 3px;">
            ${escapeHtml(place.city)} · ${place.entry_inr === 0 ? "Free entry" : `Entry ₹${escapeHtml(place.entry_inr)}`}
          </div>
          <div style="margin-top: 6px;">
            <a href="${escapeHtml(mapsUrl)}" target="_blank" rel="noopener noreferrer" style="color: #8E1F2F; font-size: 11px; font-weight: 700; text-decoration: underline;">
              Open in Google Maps ↗
            </a>
          </div>
        </div>`,
        { closeButton: true, offset: [0, -10] }
      );

      marker.on("click", () => {
        onSelectPlace?.(place);
      });
    });

    const size = map.getSize();
    if (!size.x || !size.y) return;

    // Fit bounds to selected region smoothly
    const bounds = REGION_BOUNDS[selectedRegion] || REGION_BOUNDS.all;
    map.flyToBounds(bounds, {
      padding: [40, 40],
      duration: 0.8,
    });
  }, [selectedRegion, onSelectPlace]);

  return (
    <div className="relative w-full h-[360px] sm:h-[400px] rounded-2xl overflow-hidden border border-[#DCE1DD] shadow-xs">
      <div ref={containerRef} className="w-full h-full z-0" />
    </div>
  );
}