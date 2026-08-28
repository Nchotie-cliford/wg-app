"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Sparkles,
  PiggyBank,
  ShoppingBasket,
  CalendarDays,
} from "lucide-react";

const tabs = [
  { href: "/", label: "Home", icon: Home },
  { href: "/cleaning", label: "Cleaning", icon: Sparkles },
  { href: "/expenses", label: "Costs", icon: PiggyBank },
  { href: "/shopping", label: "Shopping", icon: ShoppingBasket },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 flex justify-center p-3">
      <div className="flex w-full max-w-md items-center justify-around rounded-full border-2 border-ink bg-white px-2 py-1.5 shadow-sticker">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 rounded-full px-3 py-1.5 transition-all active:scale-90 ${
                active ? "bg-sunny shadow-sticker-sm" : "hover:bg-cream"
              }`}
            >
              <Icon size={22} strokeWidth={2.5} />
              <span className="font-display text-[10px] font-bold">
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
