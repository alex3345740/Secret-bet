"use client";

import { MainNav } from "@/components/layout/nav";
import { WalletWidget } from "@/components/layout/wallet-widget";
import { usePathname } from "next/navigation";
import { TxLifecycle } from "@/components/tx/tx-lifecycle";
import { Search, Menu, Sparkles, Twitter, MessageSquare, Layers, Globe, Settings } from "lucide-react";
import Link from "next/link";

const TITLES: Record<string, { title: string; subtitle: string }> = {
  "/": { title: "All Games", subtitle: "Private rounds, neon speed, and verifiable randomness on Solana." },
  "/plinko": { title: "Plinko", subtitle: "Drop into private bins with deterministic payout rails." },
  "/roulette": { title: "Roulette", subtitle: "Build your board, spin once, settle verifiably." },
  "/slots": { title: "Slots", subtitle: "5x3 reels, line control, and private round outcomes." },
  "/fairness": { title: "Fairness", subtitle: "Inspect request hashes and callback proofs per round." },
  "/history": { title: "History", subtitle: "Track settled rounds, wagers, payouts, and net deltas." },
  "/wallet": { title: "Wallet", subtitle: "Router/PER endpoints and program health overview." },
  "/admin/risk": { title: "Risk Dashboard", subtitle: "Monitor wager exposure, payout drift, and house-side volatility." }
};

type Props = {
  children: React.ReactNode;
};

export function AppShell({ children }: Props) {
  const pathname = usePathname();
  const heading = TITLES[pathname] ?? TITLES["/"];

  return (
    <div className="flex h-screen w-full bg-gray-900 overflow-hidden text-gray-50 text-sm font-normal">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-gray-900 flex-col pt-4 pb-0 h-full overflow-y-auto overflow-x-hidden border-r border-gray-800">
        <div className="px-4 pb-6">
          <Link href="/" className="flex items-center gap-2 cursor-pointer group">
            <div className="w-7 h-7 flex items-center justify-center rounded bg-brand-purple text-white shadow-[0_0_15px_rgba(149,80,238,0.5)]">
              <span className="font-bold transform text-sm">SB</span>
            </div>
            <div className="font-bold tracking-wider text-xl text-white group-hover:text-brand-purple transition-colors uppercase">Secret Bet</div>
          </Link>
        </div>

        <MainNav />

      </aside>

      <section className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Navbar */}
        <header className="flex justify-between items-center h-16 bg-gray-900 border-b border-gray-800 px-4 py-0 relative z-50">
          <div className="flex items-center gap-4 text-white">
            <button className="md:hidden flex h-6 w-6 items-center justify-center">
              <Menu size={20} />
            </button>
            <div className="md:hidden flex items-center gap-2">
              <Sparkles size={18} className="text-brand-purple" />
              <span className="font-bold tracking-wider text-xl text-white uppercase">Secret Bet</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button type="button" className="hidden md:flex text-gray-300 hover:text-gray-50 text-sm">
              Community
            </button>
            <WalletWidget />
          </div>
        </header>

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold text-gray-50 m-0 leading-tight">{heading.title}</h1>
                <p className="text-sm text-gray-400 mt-1">{heading.subtitle}</p>
              </div>
              <TxLifecycle />
            </div>
            {children}
          </div>
        </main>
      </section>
    </div>
  );
}
