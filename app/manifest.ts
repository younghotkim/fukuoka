import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Y&J Fukuoka — Trip Diary",
    short_name: "Y&J Fukuoka",
    description: "5.22–5.24 후쿠오카 우정여행 — 여정 · 준비 · 기록 · 회고",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f5ede0",
    theme_color: "#d12c2c",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png", purpose: "any" }
    ]
  };
}
