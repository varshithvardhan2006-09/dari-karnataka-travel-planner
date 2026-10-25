"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { DayPlan } from "@/lib/schema";
import { useLang } from "@/lib/i18n/useLang";
import { getPinNumber, DAY_PIN_COLORS } from "@/lib/geo";
import { getGoogleMapsSearchUrl } from "@/lib/maps";

export { DAY_PIN_COLORS };

interface TripMapProps {
  days: DayPlan[];
  selectedDay: number;
  selectedPlaceId?: string | null;
  onSelectDay?: (day: number) => void;
  onPinClick?: (placeId: string) => void;
  activeTab?: string;
}

export default function TripMap({
  days,
  selectedDay,
  selectedPlaceId,
  onSelectDay,
  onPinClick,
  activeTab,
}: TripMapProps) {
  const { lang, t } = useLang();
  const [wholeTrip, setWholeTrip] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const fitBoundsRef = useRef<(() => void) | null>(null);

  // Create custom HTML divIcon for a stop with pin numbering
  const createDayPinIcon = (pinNumber: number, dayNum: number, isSelected: boolean) => {
    const color = DAY_PIN_COLORS[dayNum] || "#8E1F2F";
    const size = isSelected ? 34 : 28;
    const borderWidth = isSelected ? 3 : 2;
    const shadow = isSelected
      ? "0 4px 12px rgba(142,31,47,0.5), 0 0 0 4px rgba(255,255,255,0.85)"
      : "0 2px 6px rgba(0,0,0,0.35)";

    return L.divIcon({
      className: "custom-day-pin-marker",
      html: `<div style="
        background-color: ${color};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: ${borderWidth}px solid #ffffff;
        box-shadow: ${shadow};
        color: #ffffff;
        font-weight: 800;
        font-size: ${isSelected ? 14 : 12}px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.15s ease-out;
      ">${pinNumber}</div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2],
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

    // Zoom control at bottom right
    L.control.zoom({ position: "bottomright" }).addTo(map);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    mapRef.current = map;
    layerGroupRef.current = layerGroup;

    const timer = setTimeout(() => {
      map.invalidateSize();
      fitBoundsRef.current?.();
    }, 150);

    const handleResize = () => {
      map.invalidateSize();
      fitBoundsRef.current?.();
    };
    window.addEventListener("resize", handleResize);

    // ResizeObserver watches for display:none -> block or tab switches
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
            map.invalidateSize();
            fitBoundsRef.current?.();
          }
        }
      });
      resizeObserver.observe(container);
    }

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
      resizeObserver?.disconnect();
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

  // Invalidate and refit map whenever tab changes (especially mobile tab switch)
  useEffect(() => {
    if (!mapRef.current) return;
    const timer = setTimeout(() => {
      mapRef.current?.invalidateSize();
      fitBoundsRef.current?.();
    }, 120);
    return () => clearTimeout(timer);
  }, [activeTab]);

  // 2. Update Map Layers (Routes, Markers, Bounds) on state change
  useEffect(() => {
    const map = mapRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    // Invalidate size on state updates to ensure smooth rendering on tab/container changes
    map.invalidateSize();

    layerGroup.clearLayers();
    markersRef.current.clear();

    // Determine which days to display
    const visibleDays = wholeTrip ? days : days.filter((d) => d.day === selectedDay);

    // 2a. Draw polylines with white casing underneath for high contrast
    visibleDays.forEach((dayPlan) => {
      const points = dayPlan.stops.map((s) => [s.place.lat, s.place.lng] as [number, number]);
      if (points.length < 2) return;

      const color = DAY_PIN_COLORS[dayPlan.day] || "#8E1F2F";

      // White casing line underneath
      L.polyline(points, {
        color: "#ffffff",
        weight: 6,
        opacity: 0.9,
      }).addTo(layerGroup);

      // Dashed colored route on top
      L.polyline(points, {
        color: color,
        weight: 3.5,
        dashArray: "6, 8",
        opacity: 0.95,
      }).addTo(layerGroup);
    });

    // 2b. Draw pins and single active popup
    visibleDays.forEach((dayPlan, dayIdx) => {
      dayPlan.stops.forEach((stop, stopIdx) => {
        const pinNumber = getPinNumber(
          wholeTrip ? dayPlan.day - 1 : dayIdx,
          stopIdx,
          days,
          wholeTrip
        );
        const isSelected = selectedPlaceId === stop.place_id;
        const placeLabel = lang === "kn" ? stop.place.name_kn : stop.place.name_en;

        const marker = L.marker([stop.place.lat, stop.place.lng], {
          icon: createDayPinIcon(pinNumber, dayPlan.day, isSelected),
          zIndexOffset: isSelected ? 1000 : 100,
        }).addTo(layerGroup);

        markersRef.current.set(stop.place_id, marker);

        // Bind popup only for selected pin or when clicked (no permanent overlapping labels)
        marker.bindPopup(
          `<div style="font-family: inherit; font-size: 13px; line-height: 1.4; padding: 2px; min-width: 140px;">
            <div style="font-weight: 800; color: #14202B; margin-bottom: 2px;">${placeLabel}</div>
            <div style="color: #586673; font-size: 11px;">${stop.place.city} · ${stop.start} (${stop.duration_min} min)</div>
            <div style="margin-top: 4px;">
              <a href="${getGoogleMapsSearchUrl(stop.place)}" target="_blank" rel="noopener noreferrer" style="color: #8E1F2F; font-size: 11px; font-weight: 700; text-decoration: underline;">Open in Google Maps ↗</a>
            </div>
          </div>`,
          { closeButton: false, offset: [0, -14] }
        );

        if (isSelected) {
          marker.openPopup();
        }

        marker.on("click", () => {
          handleMarkerClick(stop.place_id);
          marker.openPopup();
        });
      });
    });

    // 2c. Fit bounds smoothly (guard against 0x0 container size on mobile/hidden tabs)
    const fitCurrentBounds = () => {
      const currentMap = mapRef.current;
      if (!currentMap) return;
      const size = currentMap.getSize();
      if (!size.x || !size.y) return;

      const pad: [number, number] = size.x < 500 ? [24, 24] : [60, 60];

      if (wholeTrip) {
        const allLatLngs = days.flatMap((d) =>
          d.stops.map((s) => [s.place.lat, s.place.lng] as [number, number])
        );
        if (allLatLngs.length > 0) {
          currentMap.fitBounds(L.latLngBounds(allLatLngs), {
            padding: pad,
            maxZoom: 14,
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
            currentMap.setView(latLngs[0], 13, { animate: true });
          } else if (latLngs.length > 1) {
            currentMap.fitBounds(L.latLngBounds(latLngs), {
              padding: pad,
              maxZoom: 14,
              animate: true,
            });
          }
        }
      }
    };

    fitBoundsRef.current = fitCurrentBounds;
    fitCurrentBounds();
  }, [days, selectedDay, wholeTrip, selectedPlaceId, lang, handleMarkerClick]);

  // Center on selected stop when selectedPlaceId changes
  useEffect(() => {
    if (!selectedPlaceId || !mapRef.current) return;
    const marker = markersRef.current.get(selectedPlaceId);
    if (marker) {
      const latLng = marker.getLatLng();
      mapRef.current.panTo(latLng, { animate: true, duration: 0.5 });
      marker.openPopup();
    }
  }, [selectedPlaceId]);

  const handleLocateMe = () => {
    fitBoundsRef.current?.();
  };

  return (
    <div className="relative w-full h-full min-h-[450px] rounded-2xl overflow-hidden border border-[#DCE1DD] shadow-xs">
      {/* Day Chips on the Map (matching mockup 04: Day 1 / 2 / 3 / 4 / All) */}
      <div className="absolute top-3 left-3 z-[1000] max-w-[calc(100%-3.5rem)] overflow-x-auto scrollbar-none flex items-center gap-1.5 bg-white/95 backdrop-blur-xs p-1.5 rounded-xl shadow-sm border border-[#DCE1DD] text-xs font-semibold text-[#14202B]">
        {days.map((d) => (
          <button
            key={d.day}
            type="button"
            onClick={() => {
              setWholeTrip(false);
              onSelectDay?.(d.day);
            }}
            className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
              !wholeTrip && selectedDay === d.day
                ? "bg-[#14202B] text-white shadow-2xs"
                : "text-[#586673] hover:text-[#14202B] hover:bg-gray-100"
            }`}
          >
            <span
              className="w-2 h-2 rounded-full inline-block shrink-0"
              style={{ backgroundColor: DAY_PIN_COLORS[d.day] || "#8E1F2F" }}
            />
            <span>
              {t("common.day")} {d.day}
            </span>
          </button>
        ))}

        <button
          type="button"
          onClick={() => setWholeTrip(true)}
          className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer shrink-0 ${
            wholeTrip
              ? "bg-[#14202B] text-white shadow-2xs"
              : "text-[#586673] hover:text-[#14202B] hover:bg-gray-100"
          }`}
        >
          {lang === "kn" ? "ಎಲ್ಲಾ" : "All"}
        </button>
      </div>

      {/* Locate/Reset View Button placed safely at top-right */}
      <button
        type="button"
        onClick={handleLocateMe}
        title="Reset map view"
        aria-label="Reset map view"
        className="absolute top-3 right-3 z-[1000] w-8 h-8 bg-white/95 backdrop-blur-xs rounded-xl shadow-sm border border-[#DCE1DD] flex items-center justify-center text-[#14202B] hover:bg-gray-50 active:scale-95 transition-all cursor-pointer"
      >
        <svg
          className="w-4 h-4 text-[#14202B]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v3m0 14v3M2 12h3m14 0h3" />
        </svg>
      </button>

      {/* Leaflet Map DOM Element */}
      <div ref={containerRef} className="w-full h-full z-0" />
    </div>
  );
}