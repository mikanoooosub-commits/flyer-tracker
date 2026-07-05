"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { List, Map, School } from "lucide-react";

import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "地図", icon: Map, match: (p: string) => p === "/" },
  { href: "/list", label: "一覧", icon: List, match: (p: string) => p.startsWith("/list") },
  { href: "/schools", label: "小学校", icon: School, match: (p: string) => p.startsWith("/schools") },
] as const;

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-md items-stretch justify-around md:max-w-3xl">
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-bold transition-colors",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="size-5" />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
