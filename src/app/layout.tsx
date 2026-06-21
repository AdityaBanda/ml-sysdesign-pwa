import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";
import { InstallPrompt } from "@/components/InstallPrompt";
import { FeedbackWidget } from "@/components/feedback/FeedbackWidget";
import { createClient } from "@/lib/supabase/server";

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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const sb = await createClient();
  const { data: u } = await sb.auth.getUser();
  return (
    <html lang="en">
      <body>
        {children}
        <InstallPrompt />
        {u.user && <FeedbackWidget />}
      </body>
    </html>
  );
}
