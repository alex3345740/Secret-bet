"use client";

import { useState } from "react";
import { Info, Maximize, Settings2, Volume2, ShieldCheck, Music } from "lucide-react";

interface ControlPanelProps {
    wager: number;
    setWager: (val: number) => void;
    asset: "SOL" | "USDC";
    play: () => void;
    canPlay: boolean;
    playing: boolean;
    potWin: string;
    buttonLabel?: string;
    isDemo?: boolean;
    setIsDemo?: (val: boolean) => void;
    children?: React.ReactNode;
}

export function ControlPanel({
    wager,
    setWager,
    asset,
    play,
    canPlay,
    playing,
    potWin,
    buttonLabel = "Connect to Play",
    isDemo = false,
    setIsDemo,
    children,
}: ControlPanelProps) {
    const [mode, setMode] = useState<"Manual" | "Auto">("Manual");

    return (
        <div className="flex flex-col h-full bg-[#1b182a] relative">
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 scrollbar-thin scrollbar-thumb-gray-700">

                {/* Header controls (Tabs & Demo Toggle) */}
                <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-1 bg-gray-900 p-1 rounded-lg">
                        <button
                            onClick={() => setMode("Manual")}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${mode === "Manual" ? "bg-gray-700 text-white shadow-md" : "text-gray-400 hover:text-gray-300"
                                }`}
                        >
                            Manual
                        </button>
                        <button
                            onClick={() => setMode("Auto")}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${mode === "Auto" ? "bg-gray-700 text-white shadow-md" : "text-gray-400 hover:text-gray-300"
                                }`}
                        >
                            Auto
                        </button>
                    </div>

                    {setIsDemo && (
                        <div className="flex items-center gap-2 bg-gray-900 p-1.5 rounded-lg border border-gray-800">
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${isDemo ? 'text-brand-pink drop-shadow-[0_0_5px_rgba(255,45,85,0.8)]' : 'text-gray-500'}`}>Demo</span>
                            <button
                                onClick={() => setIsDemo(!isDemo)}
                                disabled={playing}
                                className={`w-8 h-4 rounded-full relative transition-colors ${isDemo ? 'bg-brand-pink' : 'bg-gray-700'} disabled:opacity-50`}
                            >
                                <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform shadow-sm ${isDemo ? 'translate-x-4' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    )}
                </div>

                {/* Bet Amount Input */}
                <div className="flex flex-col gap-2">
                    <label className="text-gray-400 text-xs font-semibold">Bet Amount</label>
                    <div className="flex items-center bg-gray-900 border border-gray-700 focus-within:border-brand-purple rounded-md h-[46px] overflow-hidden transition-colors">
                        <div className="flex items-center justify-center w-10 text-brand-purple">
                            {/* Token Icon Placeholder */}
                            {asset === "SOL" ? "◎" : "$"}
                        </div>
                        <input
                            type="number"
                            value={wager}
                            onChange={(e) => setWager(Number(e.target.value))}
                            disabled={playing}
                            className="flex-1 bg-transparent text-white font-bold h-full outline-none w-full appearance-none"
                            step={0.1}
                            min={0}
                        />
                        <div className="flex items-center h-full border-l border-gray-700">
                            <button
                                onClick={() => setWager(Math.max(wager / 2, 0.01))}
                                disabled={playing}
                                className="px-3 h-full text-sm font-bold text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
                                title="Half bet"
                            >
                                1/2
                            </button>
                            <div className="w-[1px] h-4 bg-gray-700" />
                            <button
                                onClick={() => setWager(wager * 2)}
                                disabled={playing}
                                className="px-3 h-full text-sm font-bold text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
                                title="Double bet"
                            >
                                2x
                            </button>
                        </div>
                    </div>
                </div>

                {/* Custom Game Controls injected here (Sliders, Dropdowns, etc) */}
                {children}

            </div>

            {/* Bottom Sticky Action Area */}
            <div className="p-4 bg-gray-800 border-t border-gray-700 flex flex-col gap-4 mt-auto">
                <div className="flex flex-col gap-1 text-sm font-semibold">
                    <div className="flex justify-between items-center text-gray-400">
                        <span>Total Bet Amount:</span>
                        <span className="text-white flex items-center gap-1">
                            <span className="text-brand-purple text-xs">{asset === "SOL" ? "◎" : "$"}</span>
                            {(wager || 0).toFixed(8)}
                        </span>
                    </div>
                    <div className="flex justify-between items-center text-gray-400">
                        <span>Potential Win:</span>
                        <span className="text-white flex items-center gap-1">
                            <span className="text-brand-purple text-xs">{asset === "SOL" ? "◎" : "$"}</span>
                            {potWin}
                        </span>
                    </div>
                </div>

                <button
                    onClick={play}
                    disabled={!canPlay || playing}
                    className={`w-full py-4 rounded-lg font-bold text-[15px] uppercase tracking-wider transition-all duration-300 relative overflow-hidden group ${canPlay && !playing
                        ? "bg-gradient-to-r from-[#9032f5] to-[#db17af] text-white shadow-[0_4px_20px_rgba(149,80,238,0.4)] hover:shadow-[0_4px_25px_rgba(219,23,175,0.6)]"
                        : "bg-gray-700 text-gray-400 cursor-not-allowed border border-gray-600"
                        }`}
                >
                    {playing ? (
                        <div className="flex items-center justify-center gap-2">
                            <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                            Processing Bet...
                        </div>
                    ) : (
                        <span className="relative z-10 flex items-center justify-center gap-2">
                            {buttonLabel === "Connect to Play" && (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a8 8 0 0 1-9.27 7.84A7.5 7.5 0 0 1 2.22 13" /><path d="M22 11v2" /></svg>
                            )}
                            {buttonLabel}
                        </span>
                    )}
                    {canPlay && !playing && (
                        <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                    )}
                </button>
            </div>

            {/* Footer Utility Bar */}
            <div className="h-12 bg-[#140d24] border-t border-gray-700 flex items-center justify-between px-4">
                <div className="flex items-center gap-4 text-gray-400">
                    <button className="hover:text-white transition-colors"><Volume2 size={16} /></button>
                    <button className="hover:text-white transition-colors"><Music size={16} /></button>
                    <button className="hover:text-white transition-colors"><Settings2 size={16} /></button>
                    <button className="hover:text-white transition-colors"><Info size={16} /></button>
                    <button className="hover:text-white transition-colors"><Maximize size={16} /></button>
                </div>
                <button className="flex items-center justify-center gap-2 px-3 py-1 bg-gray-800 rounded text-gray-300 text-xs font-bold hover:bg-gray-700 hover:text-white transition-colors">
                    <ShieldCheck size={14} /> Fairness
                </button>
            </div>
        </div>
    );
}
