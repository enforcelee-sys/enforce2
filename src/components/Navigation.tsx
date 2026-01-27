"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "강화", icon: "⚔️" },
  { href: "/hunt", label: "사냥", icon: "🌲" },
  { href: "/inventory", label: "인벤", icon: "🎒" },
  { href: "/daily", label: "출첵", icon: "📅" },
  { href: "/shop", label: "상점", icon: "🛒" },
  { href: "/battle", label: "배틀", icon: "⚡" },
  { href: "/profile", label: "프로필", icon: "👤" },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 z-50 md:relative md:border-t-0 md:border-b">
      <div className="max-w-4xl mx-auto">
        <ul className="flex justify-around md:justify-center md:gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex flex-col items-center py-2 px-3 md:flex-row md:gap-2 md:py-3 md:px-4 transition-colors ${
                    isActive
                      ? "text-yellow-400"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  <span className="text-xl md:text-base">{item.icon}</span>
                  <span className="text-xs md:text-sm">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
