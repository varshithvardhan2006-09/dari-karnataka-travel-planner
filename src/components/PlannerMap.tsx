"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import placesData from "../../data/places.json";
import { Place, Category } from "@/lib/schema";

const allPlaces = placesData as Place[];

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

interface PlannerMapProps {
  selectedCategories?: Category[];
  height?: string;
  onSelectPlace?: (place: Place) => void;
}

export default function PlannerMap({
  selectedCategories = [],
  height = "h-[320px]",
  onSelectPlace,
}: PlannerMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  const createPinIcon = (category: string, isMatch: boolean) => {
    const color = isMatch ? CATEGORY_PIN_COLORS[category] || "#8E1F2F" : "#94A3B8";
    const size = isMatch ? 22 : 14;
    const border = isMatch ? "2.5px solid #ffffff" : "1.5px solid #ffffff";
    const opacity = isMatch ? "1.0" : "0.35";
    const shadow = isMatch
      ? "0 3px 8px rgba(0,0,0,0.35), 0 0 0 2px rgba(142,31,47,0.2)"
      : "none";

    return L.divIcon({
      className: "planner-place-pin",
      html: `<div style="
        background-color: ${color};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: ${border};
        box-shadow: ${shadow};
        opacity: ${opacity};
        transition: all 0.25s ease-out;
      "></div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2],
    });
  };

  // 1. Initialize Leaflet Map Instance
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

    // Karnataka center coordinates
    const map = L.map(container, {
      center: [14.5, 75.8],
      zoom: 6.8,
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

  // 2. Render Markers and Smoothly Fit Bounds when selectedCategories change
  useEffect(() => {
    const map = mapRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    map.invalidateSize();
    layerGroup.clearLayers();

    const matchingPlaces: Place[] = [];

    allPlaces.forEach((place) => {
      const isMatch =
        selectedCategories.length === 0 ||
        place.categories.some((c) => selectedCategories.includes(c as Category));

      if (isMatch) {
        matchingPlaces.push(place);
      }

      const primaryCategory = place.categories[0] || "heritage";
      const marker = L.marker([place.lat, place.lng], {
        icon: createPinIcon(primaryCategory, isMatch),
        zIndexOffset: isMatch ? 500 : 10,
      }).addTo(layerGroup);

      marker.bindPopup(
        `<div style="font-family: inherit; font-size: 13px; line-height: 1.4; padding: 2px; min-width: 140px;">
          <div style="font-weight: 800; color: #14202B; font-size: 14px;">${place.name_en}</div>
          <div style="color: #8E1F2F; font-size: 12px; font-weight: 600;">${place.name_kn}</div>
          <div style="color: #586673; font-size: 11px; margin-top: 3px;">
            ${place.city} · ${place.entry_inr === 0 ? "Free entry" : `Entry ₹${place.entry_inr}`}
          </div>
          <div style="margin-top: 4px;">
            <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              `${place.name_en}, ${place.city}, Karnataka`
            )}" target="_blank" rel="noopener noreferrer" style="color: #8E1F2F; font-size: 11px; font-weight: 700; text-decoration: underline;">Open in Google Maps ↗</a>
          </div>
        </div>`,
        { closeButton: true, offset: [0, -10] }
      );

      marker.on("click", () => {
        onSelectPlace?.(place);
      });
    });

    // Fit bounds to matching places if any, otherwise default Karnataka bounds
    if (matchingPlaces.length > 0) {
      const latLngs = matchingPlaces.map(
        (p) => [p.lat, p.lng] as [number, number]
      );
      if (latLngs.length === 1) {
        map.setView(latLngs[0], 11, { animate: true });
      } else {
        const bounds = L.latLngBounds(latLngs);
        map.flyToBounds(bounds, {
          padding: [30, 30],
          maxZoom: 10,
          duration: 0.8,
        });
      }
    } else {
      map.flyToBounds(
        [
          [11.6, 74.0],
          [18.4, 77.8],
        ],
        { padding: [30, 30], duration: 0.8 }
      );
    }
  }, [selectedCategories, onSelectPlace]);

  return (
    <div
      className={`relative w-full ${height} rounded-2xl overflow-hidden border border-[#DCE1DD] shadow-xs bg-[#F1F3F0]`}
    >
      <div ref={containerRef} className="w-full h-full z-0" />
    </div>
  );
}
