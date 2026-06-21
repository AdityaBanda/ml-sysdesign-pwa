"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, Trophy, User } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/learn", label: "Learn", icon: GraduationCap },
  { href: "/leaderboard", label: "League", icon: Trophy },
  { href: "/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="sticky bottom-0 z-30 backdrop-blur bg-duo-bg/80 border-t border-duo-border">
      <div className="max-w-2xl mx-auto flex">
        {links.map((l) => {
          const Icon = l.icon;
          const active = pathname === l.href || pathname.startsWith(l.href + "/");
          return (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 py-3 text-xs",
                active ? "text-duo-green" : "text-duo-gray hover:text-white",
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{l.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
