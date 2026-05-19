import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

// Hinomaru-inspired PWA icon — washi-paper cream background, red disc,
// "Y&J" + "福岡" stamped over. Stays in the center 70% for Android masking.
export default function Icon() {
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
        {/* hinomaru red disc */}
        <div
          style={{
            width: 320,
            height: 320,
            borderRadius: 9999,
            background: "#d12c2c",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            boxShadow: "0 12px 28px rgba(138, 31, 36, 0.28)"
          }}
        >
          <div
            style={{
              fontSize: 132,
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
              fontSize: 40,
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
