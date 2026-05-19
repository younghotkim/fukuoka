import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ConfirmProvider } from "./components/ConfirmProvider";
import { PinGate } from "./components/PinGate";
import { PwaRegister } from "./components/PwaRegister";

export const metadata: Metadata = {
  title: "Y&J Fukuoka · 博多 屋台 Trip Diary",
  description: "5.22-5.24 후쿠오카 우정여행 — 일정·준비·기록·회고",
  applicationName: "Y&J Fukuoka",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Y&J Fukuoka"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#d12c2c"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <PinGate>
          <ConfirmProvider>{children}</ConfirmProvider>
        </PinGate>
        <PwaRegister />
      </body>
    </html>
  );
}
