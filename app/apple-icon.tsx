import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(180deg, #faf2e1 0%, #f0e5cf 100%)"
        }}
      >
        <div
          style={{
            width: 116,
            height: 116,
            borderRadius: 9999,
            background: "#d12c2c",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
            boxShadow: "0 4px 12px rgba(138, 31, 36, 0.28)"
          }}
        >
          <div
            style={{
              fontSize: 48,
              fontWeight: 900,
              color: "#fbf5e8",
              lineHeight: 1,
              letterSpacing: "-0.02em"
            }}
          >
            Y&amp;J
          </div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 800,
              color: "#fbf5e8",
              letterSpacing: "0.22em",
              opacity: 0.85
            }}
          >
            福岡
          </div>
        </div>
      </div>
    ),
    size
  );
}
