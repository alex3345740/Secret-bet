"use client";

import { motion } from "framer-motion";
import { LINES } from "@/lib/game/slots";

type ReelsProps = {
    grid: number[];
    paylines: number;
    spinning: boolean;
    winMask: number[];
};

const SYMBOLS = ["🍒", "🍋", "🍉", "⭐", "🔔", "💎", "7️⃣", "🍀"];
const SYMBOL_COLORS = ["#f87171", "#fbbf24", "#34d399", "#fcd34d", "#a78bfa", "#6ee7b7", "#f43f5e", "#34d399"];
const SYMBOL_BG = ["#450a0a", "#451a03", "#064e3b", "#451a03", "#2e1065", "#064e3b", "#450a0a", "#064e3b"];

export function Reels({ grid, paylines, spinning, winMask }: ReelsProps) {
    const hasWin = winMask.some((w) => w > 0) && !spinning;
    const COLS = 5;
    const ROWS = 3;

    // Arrange the flat grid[15] into 5 columns x 3 rows
    const columns: number[][] = Array.from({ length: COLS }, (_, col) =>
        Array.from({ length: ROWS }, (_, row) => grid[row * COLS + col] ?? 0)
    );

    return (
        <div className="flex flex-col items-center w-full gap-4">
            {/* Win notification banner */}
            {hasWin && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-[560px] py-2 px-6 rounded-lg bg-green-900/60 border border-green-500/40 text-green-400 font-black text-center text-lg tracking-wide"
                    style={{ textShadow: "0 0 12px #34d399" }}
                >
                    🎉 WINNER!
                </motion.div>
            )}

            {/* Paylines label */}
            <div className="flex justify-between w-full max-w-[560px] text-sm text-gray-400 font-semibold px-1">
                <span>Paylines: <span className="text-brand-purple">{paylines}</span></span>
                <span>5 × 3 Reels</span>
            </div>

            {/* Slot Machine Frame */}
            <div
                className="relative rounded-xl overflow-hidden border-2 border-brand-purple/40 bg-gray-950 shadow-[0_0_30px_rgba(149,80,238,0.2)]"
                style={{ width: "100%", maxWidth: 560 }}
            >
                {/* Reel highlight line (center row indicator) */}
                <div className="absolute inset-x-0 z-10 pointer-events-none" style={{ top: "calc(33.3% + 2px)", height: "33.3%" }}>
                    <div className="h-full border-y border-brand-purple/30 bg-brand-purple/5" />
                </div>

                {/* 5 Columns */}
                <div className="grid" style={{ gridTemplateColumns: "repeat(5, 1fr)", gap: 2, padding: 2 }}>
                    {columns.map((colSyms, col) => (
                        <div
                            key={col}
                            className="flex flex-col rounded-lg overflow-hidden bg-gray-900"
                            style={{ gap: 2 }}
                        >
                            {colSyms.map((symId, row) => {
                                const color = SYMBOL_COLORS[symId % SYMBOL_COLORS.length];
                                const bg = SYMBOL_BG[symId % SYMBOL_BG.length];

                                // Check if this (col, row) intersects any winning line in the winMask
                                const isWinner = hasWin && winMask.some((isWin, lineIdx) => {
                                    if (!isWin) return false;
                                    const line = LINES[lineIdx];
                                    if (!line) return false;
                                    // Make sure we only highlight up to the streak length?
                                    // For simplicity, highlighting all symbols that are part of the winning line geometry
                                    return line[col] === row;
                                });

                                return (
                                    <motion.div
                                        key={`${col}-${row}`}
                                        animate={spinning ? { y: [0, -30, 30, 0] } : { y: [0, 15, -5, 0] }}
                                        transition={spinning
                                            ? { duration: 0.12, ease: "linear", repeat: Infinity, delay: col * 0.05 }
                                            : { duration: 0.4, ease: "backOut", delay: col * 0.1 }
                                        }
                                        className="flex items-center justify-center rounded"
                                        style={{
                                            height: 80,
                                            background: isWinner ? `${bg}cc` : "#0f0f1a",
                                            border: isWinner ? `1px solid ${color}66` : "1px solid #1e1e2f",
                                            boxShadow: isWinner ? `0 0 12px ${color}44` : "none",
                                            fontSize: "2rem",
                                            position: "relative",
                                            overflow: "hidden",
                                        }}
                                    >
                                        <span
                                            style={{
                                                filter: spinning ? `blur(4px) drop-shadow(0 4px 10px ${color}88)` : `drop-shadow(0 2px 4px ${color}33)`,
                                                transform: spinning ? "scaleY(1.4) scaleX(0.9)" : "scaleY(1) scaleX(1)",
                                                transition: "filter 0.2s ease-in, transform 0.2s ease-in",
                                                display: "block",
                                                lineHeight: 1,
                                            }}
                                        >
                                            {SYMBOLS[symId % SYMBOLS.length]}
                                        </span>

                                        {/* Glare effect */}
                                        <div
                                            className="absolute inset-0 pointer-events-none"
                                            style={{
                                                background: "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 60%)",
                                            }}
                                        />
                                    </motion.div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
