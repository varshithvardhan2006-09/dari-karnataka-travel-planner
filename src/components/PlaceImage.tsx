"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Place } from "@/lib/schema";
import { useLang } from "@/lib/i18n/useLang";
import PalaceScene from "./illustrations/PalaceScene";
import HampiScene from "./illustrations/HampiScene";
import CoastScene from "./illustrations/CoastScene";

interface PlaceImageProps {
  place: Place;
  size?: "sm" | "md" | "hero";
  /** Preloads the image via a <link> in <head>; use for an above-the-fold hero. */
  preload?: boolean;
  className?: string;
}

export default function PlaceImage({
  place,
  size = "md",
  preload = false,
  className = "",
}: PlaceImageProps) {
  const { lang } = useLang();
  const [imgError, setImgError] = useState(false);

  // SVG Scene fallback selection
  const renderFallbackScene = () => {
    if (
      place.categories.includes("beach") ||
      place.region === "Coast" ||
      place.region === "North Kannada"
    ) {
      return <CoastScene className="w-full h-full object-cover" />;
    }
    if (place.region === "Hampi-Ballari" || place.region === "Badami-Bagalkot") {
      return <HampiScene className="w-full h-full object-cover" />;
    }
    return <PalaceScene className="w-full h-full object-cover" />;
  };

  const imageSrc =
    size === "sm" && place.image?.thumb ? place.image.thumb : place.image?.file;

  const altText =
    lang === "kn"
      ? place.image?.alt_kn || place.name_kn
      : place.image?.alt_en || place.name_en;

  const sizeDimensions = {
    sm: { width: 120, height: 90 },
    md: { width: 400, height: 260 },
    hero: { width: 1200, height: 600 },
  }[size];

  if (imageSrc && !imgError) {
    return (
      <div className={`relative overflow-hidden w-full h-full ${className}`}>
        <Image
          src={imageSrc}
          alt={altText}
          width={sizeDimensions.width}
          height={sizeDimensions.height}
          preload={preload}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden w-full h-full ${className}`}>
      {renderFallbackScene()}
    </div>
  );
}
