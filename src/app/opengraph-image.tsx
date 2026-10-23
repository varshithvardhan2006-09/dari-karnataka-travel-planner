import { ImageResponse } from "next/og";

export const alt = "Dari (ದಾರಿ) - AI Travel Planner for Karnataka";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 80px",
          backgroundColor: "#8E1F2F", // Karnataka Crimson
          color: "#ffffff",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Subtle decorative background border pattern */}
        <div
          style={{
            position: "absolute",
            top: 24,
            left: 24,
            right: 24,
            bottom: 24,
            border: "2px solid rgba(242, 183, 5, 0.3)",
            borderRadius: 24,
            display: "flex",
          }}
        />

        {/* Top Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              fontSize: 56,
              fontWeight: 900,
              color: "#F2B705", // Karnataka Gold
              letterSpacing: "-0.02em",
            }}
          >
            ದಾರಿ
          </div>
          <div
            style={{
              fontSize: 52,
              fontWeight: 800,
              color: "#FFFFFF",
              letterSpacing: "-0.02em",
            }}
          >
            Dari
          </div>
          <div
            style={{
              marginLeft: 20,
              padding: "6px 16px",
              borderRadius: 12,
              backgroundColor: "rgba(255, 255, 255, 0.15)",
              color: "#F2B705",
              fontSize: 18,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Problem Statement 06
          </div>
        </div>

        {/* Main Content */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              fontSize: 54,
              fontWeight: 800,
              lineHeight: 1.15,
              color: "#FFFFFF",
              maxWidth: 950,
            }}
          >
            Plan Karnataka your way.
          </div>
          <div
            style={{
              fontSize: 26,
              color: "rgba(255, 255, 255, 0.85)",
              lineHeight: 1.4,
              maxWidth: 880,
            }}
          >
            Personalized itineraries built only from real places, with Leaflet map routes and native Kannada audio phrases for every stop.
          </div>
        </div>

        {/* Bottom Feature Badges */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 20px",
              borderRadius: 12,
              backgroundColor: "#F2B705",
              color: "#14202B",
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            Real Places Only
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 20px",
              borderRadius: 12,
              backgroundColor: "rgba(255, 255, 255, 0.15)",
              color: "#FFFFFF",
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            Kannada First-Class (kn-IN)
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 20px",
              borderRadius: 12,
              backgroundColor: "rgba(255, 255, 255, 0.15)",
              color: "#FFFFFF",
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            Works 100% Offline from AI
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
