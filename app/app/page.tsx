"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, Club, Orbit, CircleDollarSign } from "lucide-react";

const GAMES = [
  {
    path: "/slots",
    title: "Slots",
    description: "5x3 Neon Reels with line control and high volatility.",
    icon: Club,
    color: "from-[#ff2d55] to-[#c74c73]",
    shadow: "shadow-[0_0_30px_rgba(255,45,85,0.4)]",
    bg: "bg-[#1e0a13]"
  },
  {
    path: "/plinko",
    title: "Plinko",
    description: "Physics-based drops into precise multiplier bins.",
    icon: Orbit,
    color: "from-[#9032f5] to-[#5a1c99]",
    shadow: "shadow-[0_0_30px_rgba(144,50,245,0.4)]",
    bg: "bg-[#130a1e]",
    popular: true
  },
  {
    path: "/roulette",
    title: "Roulette",
    description: "Classic European board with verifiable fairness on Solana.",
    icon: CircleDollarSign,
    color: "from-[#00e676] to-[#008a46]",
    shadow: "shadow-[0_0_30px_rgba(0,230,118,0.4)]",
    bg: "bg-[#05180f]"
  }
];

export default function LobbyPage() {
  return (
    <div className="flex flex-col gap-12 w-full max-w-[1200px] mx-auto pb-12">
      {/* Hero Section */}
      <section className="relative w-full h-[400px] md:h-[500px] rounded-3xl overflow-hidden flex items-center justify-center border border-white/5 shadow-2xl">
        {/* Animated Background Mesh */}
        <div className="absolute inset-0 bg-[#0c0914] z-0" />
        <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_0%,rgba(144,50,245,0.25)_0%,rgba(0,0,0,0)_60%)] pointer-events-none" />
        <div className="absolute inset-0 z-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay" />

        {/* Floating Particles (CSS Animation simulated) */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[20%] left-[10%] w-64 h-64 bg-[#ff2d55] rounded-full mix-blend-screen filter blur-[100px] opacity-20 animate-pulse" />
          <div className="absolute top-[40%] right-[10%] w-80 h-80 bg-[#00e676] rounded-full mix-blend-screen filter blur-[120px] opacity-10 animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-6 backdrop-blur-sm">
            <Sparkles size={14} className="text-[#ff2d55]" />
            <span className="text-xs font-bold uppercase tracking-wider text-gray-300">Welcome to the secret world</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight drop-shadow-xl uppercase">
            Secret <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#9032f5] to-[#ff2d55]">Bet</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl font-medium leading-relaxed">
            The most advanced frontend playground for verifiable crypto casino games. Experience dynamic animations, premium UI, and unparalleled smoothness.
          </p>
          <div className="flex gap-4">
            <a href="#games" className="px-8 py-3 rounded-xl bg-white text-black font-bold text-sm tracking-wide hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)]">
              Explore Games
            </a>
            <button className="px-8 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-bold text-sm tracking-wide hover:bg-white/20 transition-colors backdrop-blur-md">
              View Fairness
            </button>
          </div>
        </div>
      </section>

      {/* Featured Games Grid */}
      <section id="games" className="flex flex-col gap-6 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-white uppercase tracking-wider flex items-center gap-3">
            <div className="w-1.5 h-8 bg-brand-purple rounded-full"></div>
            Featured Games
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {GAMES.map((game, i) => {
            const Icon = game.icon;
            return (
              <Link
                href={game.path}
                key={game.title}
                className={`group relative overflow-hidden rounded-2xl border border-white/10 ${game.bg} p-8 flex flex-col items-start gap-4 transition-all duration-300 hover:-translate-y-2 hover:border-white/20 ${game.shadow}`}
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${game.color} rounded-full filter blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity duration-500`} />

                {game.popular && (
                  <div className="absolute top-4 right-4 bg-brand-purple text-white text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded shadow-lg">
                    HOT
                  </div>
                )}

                <div className={`p-4 rounded-xl bg-gradient-to-br ${game.color} shadow-xl mb-4 text-white transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                  <Icon size={32} strokeWidth={2.5} />
                </div>

                <h3 className="text-2xl font-bold text-white uppercase tracking-wide">{game.title}</h3>
                <p className="text-gray-400 text-sm font-medium leading-relaxed">
                  {game.description}
                </p>

                <div className="mt-auto pt-4 flex items-center gap-2 text-white font-bold text-sm group-hover:text-brand-purple-light transition-colors">
                  Play Now <ArrowRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Removed Live Bets Section */}

    </div>
  );
}
