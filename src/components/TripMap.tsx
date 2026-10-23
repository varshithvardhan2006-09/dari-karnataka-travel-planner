"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { DayPlan } from "@/lib/schema";
import { useLang } from "@/lib/i18n/useLang";

export const DAY_PIN_COLORS: Record<number, string> = {
  1: "#8E1F2F", // Red
  2: "#D99A00", // Gold
  3: "#1E6B52", // Green
  4: "#2B5F8A", // Blue
  5: "#6A4C93", // Purple
  6: "#C05621", // Terracotta
  7: "#2D3748", // Dark slate
};

interface TripMapProps {
  days: DayPlan[];
  selectedDay: number;
  onPinClick?: (placeId: string) => void;
}

export default function TripMap({ days, selectedDay, onPinClick }: TripMapProps) {
  const { lang, t } = useLang();
  const [wholeTrip, setWholeTrip] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  // Create custom HTML divIcon for a stop
  const createDayPinIcon = (dayNum: number) => {
    const color = DAY_PIN_COLORS[dayNum] || "#8E1F2F";
    return L.divIcon({
      className: "custom-day-pin-marker",
      html: `<div style="
        background-color: ${color};
        width: 28px;
        height: 28px;
        border-radius: 50%;
        border: 2px solid #ffffff;
        box-shadow: 0 2px 6px rgba(0,0,0,0.35);
        color: #ffffff;
        font-weight: 700;
        font-size: 13px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">${dayNum}</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -14],
    });
  };

  const handleMarkerClick = useCallback(
    (placeId: string) => {
      if (onPinClick) {
        onPinClick(placeId);
      } else {
        const cardEl = document.getElementById(`stop-card-${placeId}`);
        if (cardEl) {
          cardEl.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    },
    [onPinClick]
  );

  // 1. Initialize Leaflet Map Instance Safely
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clean up any stale map or container state (e.g. from React 19 fast-refresh)
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
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    mapRef.current = map;
    layerGroupRef.current = layerGroup;

    // Trigger map resize after mounting
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      clearTimeout(timer);
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

  // 2. Update Map Layers (Routes, Markers, Bounds) on state change
  useEffect(() => {
    const map = mapRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    // Draw route polylines
    days.forEach((dayPlan) => {
      const points = dayPlan.stops.map((s) => [s.place.lat, s.place.lng] as [number, number]);
      const color = DAY_PIN_COLORS[dayPlan.day] || "#586673";
      const isSelected = dayPlan.day === selectedDay;

      L.polyline(points, {
        color: isSelected ? "#14202B" : color,
        weight: isSelected ? 3.5 : 2,
        dashArray: "6, 8",
        opacity: isSelected ? 0.9 : 0.4,
      }).addTo(layerGroup);
    });

    // Draw markers and tooltips
    days.forEach((dayPlan) => {
      dayPlan.stops.forEach((stop) => {
        const isCurrentDay = dayPlan.day === selectedDay;
        const placeLabel = lang === "kn" ? stop.place.name_kn : stop.place.name_en;

        const marker = L.marker([stop.place.lat, stop.place.lng], {
          icon: createDayPinIcon(dayPlan.day),
          opacity: isCurrentDay ? 1.0 : 0.6,
        }).addTo(layerGroup);

        marker.bindTooltip(
          `<span style="font-weight:700">${placeLabel}</span>`,
          {
            direction: "right",
            offset: [16, 0],
            permanent: isCurrentDay,
            opacity: 0.95,
            className: "font-medium text-xs font-sans",
          }
        );

        marker.on("click", () => handleMarkerClick(stop.place_id));
      });
    });

    // Fit bounds smoothly
    if (wholeTrip) {
      const allLatLngs = days.flatMap((d) =>
        d.stops.map((s) => [s.place.lat, s.place.lng] as [number, number])
      );
      if (allLatLngs.length > 0) {
        map.fitBounds(L.latLngBounds(allLatLngs), {
          padding: [40, 40],
          maxZoom: 12,
          animate: true,
        });
      }
    } else {
      const currentDayPlan = days.find((d) => d.day === selectedDay) || days[0];
      if (currentDayPlan && currentDayPlan.stops.length > 0) {
        const latLngs = currentDayPlan.stops.map(
          (s) => [s.place.lat, s.place.lng] as [number, number]
        );
        if (latLngs.length === 1) {
          map.setView(latLngs[0], 12, { animate: true });
        } else if (latLngs.length > 1) {
          map.fitBounds(L.latLngBounds(latLngs), {
            padding: [60, 60],
            maxZoom: 13,
            animate: true,
          });
        }
      }
    }
  }, [days, selectedDay, wholeTrip, lang, handleMarkerClick]);

  return (
    <div className="relative w-full h-[450px] lg:h-full min-h-[450px] rounded-2xl overflow-hidden border border-[#DCE1DD] shadow-xs">
      {/* Floating Day Legend Bar matching mockup 04 */}
      <div className="absolute top-4 left-4 z-[1000] bg-white/95 backdrop-blur-xs px-3.5 py-2 rounded-xl shadow-sm border border-[#DCE1DD] flex items-center gap-3 text-xs font-semibold text-[#14202B]">
        {days.map((d) => (
          <div key={d.day} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: DAY_PIN_COLORS[d.day] || "#8E1F2F" }}
            />
            <span>
              {t("common.day")} {d.day}
            </span>
          </div>
        ))}
      </div>

      {/* Whole Trip Toggle Button matching mockup 07 */}
      <button
        type="button"
        onClick={() => setWholeTrip((prev) => !prev)}
        className="absolute top-4 right-4 z-[1000] bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-xl shadow-sm border border-[#DCE1DD] text-xs font-semibold text-[#14202B] hover:bg-gray-50 active:scale-95 transition-all cursor-pointer"
      >
        {wholeTrip
          ? lang === "kn"
            ? `ದಿನ ${selectedDay} ಮಾರ್ಗ`
            : `Day ${selectedDay} route`
          : lang === "kn"
          ? "ಸಂಪೂರ್ಣ ಪ್ರವಾಸ"
          : "Whole trip"}
      </button>

      {/* Leaflet Map DOM Element */}
      <div ref={containerRef} className="w-full h-full z-0" />
    </div>
  );
}
