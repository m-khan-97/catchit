import { ImageResponse } from "next/og";

/**
 * Renders the same radar mark used in opengraph-image.tsx (circle + accent
 * ring + sweep line), scaled to fill a square canvas with generous padding
 * — reused for PWA icons, which need to survive being cropped to a circle
 * or rounded square (the maskable-icon "safe zone").
 */
export function radarIconResponse(size: number): ImageResponse {
  const outer = Math.round(size * 0.72);
  const ring = Math.round(size * 0.36);
  const border = Math.max(2, Math.round(size * 0.045));
  const sweep = Math.round(size * 0.27);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0F100C",
        }}
      >
        <div
          style={{
            width: outer,
            height: outer,
            borderRadius: "50%",
            background: "#26271E",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: ring,
              height: ring,
              borderRadius: "50%",
              border: `${border}px solid #C7F04A`,
              position: "relative",
              display: "flex",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: sweep,
                height: Math.max(2, Math.round(size * 0.018)),
                background: "#C7F04A",
              }}
            />
          </div>
        </div>
      </div>
    ),
    { width: size, height: size }
  );
}
