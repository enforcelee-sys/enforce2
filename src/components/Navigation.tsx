"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "강화", icon: "⚔️" },
  { href: "/hunt", label: "사냥", icon: "🌲" },
  { href: "/daily", label: "출첵", icon: "📅" },
  { href: "/battle", label: "배틀", icon: "⚡" },
  { href: "/profile", label: "MY", icon: "👤" },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-800 z-50 safe-area-pb">
      <ul className="flex justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={`flex flex-col items-center py-2 transition-all ${
                  isActive
                    ? "text-yellow-400 scale-105"
                    : "text-gray-500 active:scale-95"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-[10px] mt-0.5 font-medium">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
