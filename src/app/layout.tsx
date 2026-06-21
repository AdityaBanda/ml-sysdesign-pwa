import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";
import { InstallPrompt } from "@/components/InstallPrompt";

export const metadata: Metadata = {
  title: "ML SysDesign — Learn ML System Design, gamified",
  description: "A Duolingo-style PWA for mastering ML system design step by step.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ML SysDesign",
  },
};

export const viewport: Viewport = {
  themeColor: "#58cc02",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <InstallPrompt />
      </body>
    </html>
  );
}
