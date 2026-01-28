"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const mainNavItems = [
  { href: "/", label: "강화", icon: "⚔️" },
  { href: "/hunt", label: "사냥", icon: "🌲" },
  { href: "/daily", label: "출첵", icon: "📅" },
  { href: "/battle", label: "배틀", icon: "⚡" },
];

const moreItems = [
  { href: "/inventory", label: "인벤토리", icon: "🎒" },
  { href: "/shop", label: "상점", icon: "🛒" },
  { href: "/profile", label: "프로필", icon: "👤" },
];

export default function Navigation() {
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);

  const isMoreActive = moreItems.some(item => pathname === item.href);

  return (
    <>
      {/* 더보기 메뉴 */}
      {showMore && (
        <div className="fixed inset-0 z-40" onClick={() => setShowMore(false)}>
          <div className="absolute bottom-14 right-2 bg-gray-800 rounded-2xl p-2 shadow-xl border border-gray-700" onClick={e => e.stopPropagation()}>
            {moreItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setShowMore(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl ${
                  pathname === item.href ? "bg-yellow-500/20 text-yellow-400" : "text-gray-300 active:bg-gray-700"
                }`}
              >
                <span>{item.icon}</span>
                <span className="text-sm">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-800 z-50 safe-area-pb">
        <ul className="flex justify-around max-w-lg mx-auto">
          {mainNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  className={`flex flex-col items-center py-2 transition-all ${
                    isActive ? "text-yellow-400" : "text-gray-500 active:scale-95"
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-[10px] mt-0.5 font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
          <li className="flex-1">
            <button
              onClick={() => setShowMore(!showMore)}
              className={`w-full flex flex-col items-center py-2 transition-all ${
                isMoreActive || showMore ? "text-yellow-400" : "text-gray-500 active:scale-95"
              }`}
            >
              <span className="text-lg">•••</span>
              <span className="text-[10px] mt-0.5 font-medium">더보기</span>
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}
