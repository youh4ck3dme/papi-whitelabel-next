import type { Metadata, Viewport } from "next";
import "./globals.css";
import { brandConfig } from "@/config/brand";

export const metadata: Metadata = {
  title: {
    default: brandConfig.name,
    template: `%s | ${brandConfig.shortName}`,
  },
  description: brandConfig.description,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: brandConfig.shortName,
  },
};

export const viewport: Viewport = {
  themeColor: brandConfig.colors.gold,
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sk">
      <body>{children}</body>
    </html>
  );
}
