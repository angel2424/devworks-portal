import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PWAInit } from "@/components/pwa-init";

export const metadata: Metadata = {
  title: "DevWorks Studio",
  description: "Portal interno y de clientes — DevWorks Studio",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "DevWorks",
  },
};

export const viewport: Viewport = {
  themeColor: "#f59e0b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      style={
        {
          "--font-heading": "'Cal Sans', system-ui, sans-serif",
          "--font-body": "'DM Sans', system-ui, sans-serif",
        } as React.CSSProperties
      }
    >
      <body>
        <PWAInit />
        {children}
      </body>
    </html>
  );
}
