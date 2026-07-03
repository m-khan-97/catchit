import { ImageResponse } from "next/og";

export const alt = "CatchIt — catch it before it's gone";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#0F100C",
          color: "#EDECE2",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 40 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "#26271E",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                border: "4px solid #C7F04A",
                position: "relative",
                display: "flex",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  width: 24,
                  height: 4,
                  background: "#C7F04A",
                }}
              />
            </div>
          </div>
          <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: -1 }}>CatchIt</div>
        </div>
        <div style={{ fontSize: 68, fontWeight: 700, letterSpacing: -2, lineHeight: 1.05, display: "flex" }}>
          Catch it before it&apos;s gone.
        </div>
        <div style={{ fontSize: 30, color: "#9C9A8A", marginTop: 28, maxWidth: 900, display: "flex" }}>
          Hackathons, free credits, scholarships, and conference &amp; journal CFPs — surfaced
          while there&apos;s still time to act.
        </div>
      </div>
    ),
    { ...size }
  );
}
