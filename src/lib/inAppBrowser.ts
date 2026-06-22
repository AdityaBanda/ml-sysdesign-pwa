/**
 * Detect whether the current browser is an in-app webview that Google OAuth
 * will refuse (e.g. LinkedIn, Instagram, Facebook, X, WhatsApp, etc.).
 * Returns the human-readable app name if detected, otherwise null.
 */
export function detectInAppBrowser(userAgent: string): string | null {
  const ua = userAgent.toLowerCase();

  // Order matters: most specific first, since several apps include "version/safari"
  // in their UA string.
  const checks: Array<{ name: string; test: (ua: string) => boolean }> = [
    { name: "LinkedIn", test: (s) => s.includes("linkedinapp") || s.includes("linkedin") },
    { name: "Instagram", test: (s) => s.includes("instagram") },
    { name: "Facebook", test: (s) => s.includes("fban") || s.includes("fbav") || s.includes("fb_iab") },
    { name: "X / Twitter", test: (s) => s.includes("twitter") },
    { name: "WhatsApp", test: (s) => s.includes("whatsapp") },
    { name: "Snapchat", test: (s) => s.includes("snapchat") },
    { name: "TikTok", test: (s) => s.includes("musical_ly") || s.includes("bytedance") || s.includes("tiktok") },
    { name: "Line", test: (s) => s.includes(" line/") },
    { name: "Telegram", test: (s) => s.includes("telegram") },
    { name: "WeChat", test: (s) => s.includes("micromessenger") },
    { name: "Pinterest", test: (s) => s.includes("pinterest") },
    { name: "Reddit", test: (s) => s.includes("reddit") },
    { name: "Slack", test: (s) => s.includes("slack") },
    { name: "Discord", test: (s) => s.includes("discord") },
  ];

  for (const c of checks) {
    if (c.test(ua)) return c.name;
  }
  return null;
}
