import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export function BackLink({ href, label = "Back" }: { href: string; label?: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-sm text-duo-gray hover:text-white transition"
    >
      <ChevronLeft className="w-4 h-4" />
      {label}
    </Link>
  );
}
