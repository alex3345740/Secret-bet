"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import {
  House,
  Gamepad2,
  ChevronUp,
  ChevronDown,
  Layers,
  TrendingUp,
  Club,
  Orbit,
  CircleDot,
  Hexagon,
  Square,
  CircleDashed,
  Bomb,
  CircleDollarSign,
  Activity,
  Dices,
  HandCoins,
  GalleryVerticalEnd,
  Box
} from "lucide-react";
import { useState } from "react";

const GAME_ITEMS = [
  { href: "/slots", label: "Slots", icon: Club },
  { href: "/plinko", label: "Plinko", icon: Orbit },
  { href: "/roulette", label: "Roulette", icon: CircleDollarSign },
];

export function MainNav() {
  const pathname = usePathname();
  const [gamesOpen, setGamesOpen] = useState(true);

  return (
    <div className="flex flex-col gap-1 w-full px-2">
      <Link
        href="/"
        className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${pathname === "/" ? "text-white" : "text-gray-400 hover:text-gray-200"
          }`}
      >
        <House size={18} />
        <span className="font-semibold text-[15px]">Home</span>
      </Link>

      <div className="mt-2">
        <button
          onClick={() => setGamesOpen(!gamesOpen)}
          className="flex items-center justify-between w-full px-3 py-2.5 rounded-md text-gray-400 hover:text-gray-200 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Gamepad2 size={18} />
            <span className="font-semibold text-[15px]">Games</span>
          </div>
          {gamesOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {gamesOpen && (
          <div className="flex flex-col mt-1 space-y-0.5">
            {GAME_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2 rounded-md transition-all ${active
                    ? "bg-gray-700 text-white relative before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-6 before:w-1 before:bg-brand-purple before:rounded-r-md"
                    : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                    }`}
                >
                  <div className="flex items-center gap-3 ml-2">
                    <Icon size={16} className={active ? "text-gray-300" : "opacity-60"} />
                    <span className={`text-[14px] ${active ? "font-semibold" : ""}`}>
                      {item.label}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

