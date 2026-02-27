"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

type BoardProps = {
    rows: 8 | 12 | 16;
    riskLevel: 0 | 1 | 2;
    path: number[];
    revealedSteps: number;
};

const PAYOUTS: Record<number, Record<number, number[]>> = {
    8: {
        0: [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6],
        1: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
        2: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29],
    },
    12: {
        0: [10, 3, 1.6, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 1.6, 3, 10],
        1: [33, 11, 4, 2, 1.1, 0.6, 0.3, 0.6, 1.1, 2, 4, 11, 33],
        2: [170, 24, 8.1, 2, 0.7, 0.2, 0.2, 0.2, 0.7, 2, 8.1, 24, 170],
    },
    16: {
        0: [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.4, 1.4, 2, 9, 16],
        1: [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.4, 0.5, 1, 1.5, 3, 5, 10, 41, 110],
        2: [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000],
    },
};

function getMultiplierStyle(value: number, total: number, index: number): React.CSSProperties {
    const center = Math.floor(total / 2);
    const dist = Math.abs(index - center);
    const maxDist = center;
    const ratio = maxDist === 0 ? 0 : dist / maxDist;

    if (ratio > 0.85) return { background: "#e11d48", color: "#fff" };
    if (ratio > 0.70) return { background: "#f43f5e", color: "#fff" };
    if (ratio > 0.55) return { background: "#fb923c", color: "#000" };
    if (ratio > 0.40) return { background: "#fbbf24", color: "#000" };
    if (ratio > 0.25) return { background: "#fcd34d", color: "#000" };
    if (ratio > 0.10) return { background: "#fde047", color: "#000" };
    return { background: "#fef08a", color: "#000" };
}

/* ─── SVG Coordinate Helpers ──────────────────────────────────────── */

const SVG_W = 600;
const SVG_H = 460;
const BIN_H = 50;
const TOP_PAD = 30;

function grid(rows: number) {
    const cols = rows + 2; // widest row has rows+3 pegs, but spacing is between them
    const colSp = SVG_W / (cols + 2); // horizontal spacing
    const rowSp = (SVG_H - BIN_H - TOP_PAD - 10) / rows; // vertical spacing
    const pegR = rows === 16 ? 3 : rows === 12 ? 4 : 5;
    const ballR = pegR * 1.8;
    const cx = SVG_W / 2;
    return { colSp, rowSp, pegR, ballR, cx };
}

/** Centre-X of peg `j` (0-indexed) in row `r` (0-indexed, has r+3 pegs). */
function pegX(r: number, j: number, cx: number, colSp: number) {
    const pegsInRow = r + 3;
    return cx + (j - (pegsInRow - 1) / 2) * colSp;
}

function pegY(r: number, rowSp: number) {
    return TOP_PAD + r * rowSp;
}

/**
 * Ball position after `step` bounces.
 *  step=0 → above the board (start)
 *  step=k → sitting at row k-1 peg gap
 * The ball sits between pegs, not ON a peg.
 * After bouncing off peg in row `r`, path[r]=0 → ball goes left, path[r]=1 → ball goes right.
 * The ball's column relative to row r+1 pegs:
 *   colIndex starts at 1 (center of row 0's 3 pegs) → after step, colIndex += path[step]
 *   Ball X = pegX(row, colIndex, ...) but shifted by -colSp/2 to sit between two pegs of the *next* row
 *
 * Simpler approach: track peg column index.
 *   At row 0 (3 pegs), ball starts at the gap above peg index 1 (center).
 *   path[0] = 0 → ball lands between peg 0 and 1 of row 1 (4 pegs) → column 1
 *   path[0] = 1 → ball lands between peg 1 and 2 of row 1 (4 pegs) → column 2
 *   Generalizing: after step i, cumulative pathSum = sum(path[0..i-1]).
 *   Ball X at row i = cx + (pathSum - i/2) * colSp
 */
function ballPosition(step: number, path: number[], cx: number, colSp: number, rowSp: number) {
    if (step <= 0) return { x: cx, y: TOP_PAD - rowSp * 0.6 };
    const pathSum = path.slice(0, step).reduce((a, b) => a + b, 0);
    const x = cx + (pathSum - step / 2) * colSp;
    const y = TOP_PAD + (step - 0.5) * rowSp; // halfway between row step-1 and row step
    return { x, y };
}

export function Board({ rows, riskLevel, path, revealedSteps }: BoardProps) {
    const boardRows = useMemo(() => Array.from({ length: rows }, (_, i) => i), [rows]);
    const multipliers = PAYOUTS[rows][riskLevel];
    const { colSp, rowSp, pegR, ballR, cx } = useMemo(() => grid(rows), [rows]);

    const isDropping = path.length > 0;

    // Compute current ball position
    const ballPos = useMemo(
        () => ballPosition(revealedSteps, path, cx, colSp, rowSp),
        [revealedSteps, path, cx, colSp, rowSp]
    );

    // Compute which peg to highlight per row
    const highlightedPegs = useMemo(() => {
        if (path.length === 0) return new Map<string, boolean>();
        const map = new Map<string, boolean>();
        let colIdx = 1; // ball starts above peg[1] of row 0 (the center of 3 pegs)
        for (let r = 0; r < Math.min(revealedSteps, rows); r++) {
            // Before bouncing, the ball is near peg colIdx of row r
            map.set(`${r}-${colIdx}`, true);
            colIdx += path[r]; // 0=left, 1=right → shifts to next row's peg index
        }
        return map;
    }, [path, revealedSteps, rows]);

    // Bins Y position
    const binsY = TOP_PAD + rows * rowSp + 8;

    return (
        <div className="relative flex flex-col items-center w-full h-full min-h-[480px] bg-[#0a0b10] rounded-lg overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0f111a] via-[#0f111a] to-[#0a0b10] pointer-events-none" />

            {/* SVG Board */}
            <svg
                viewBox={`0 0 ${SVG_W} ${SVG_H}`}
                className="relative z-10 w-full h-auto max-h-full"
                style={{ maxWidth: SVG_W }}
            >
                {/* Pegs */}
                {boardRows.map((r) => {
                    const pegsInRow = r + 3;
                    return Array.from({ length: pegsInRow }).map((_, j) => {
                        const px = pegX(r, j, cx, colSp);
                        const py = pegY(r, rowSp);
                        const active = highlightedPegs.has(`${r}-${j}`);
                        return (
                            <circle
                                key={`p-${r}-${j}`}
                                cx={px}
                                cy={py}
                                r={pegR}
                                fill={active ? "#ffffff" : "#4a4e69"}
                                style={{
                                    filter: active
                                        ? "drop-shadow(0 0 6px rgba(255,255,255,0.9)) drop-shadow(0 0 12px rgba(124,58,237,0.7))"
                                        : "none",
                                    transition: "fill 120ms ease-out, filter 120ms ease-out",
                                }}
                            />
                        );
                    });
                })}

                {/* Ball */}
                {isDropping && (
                    <motion.circle
                        cx={ballPos.x}
                        cy={ballPos.y}
                        r={ballR}
                        fill="#ffd700"
                        initial={{ opacity: 0, r: 0 }}
                        animate={{
                            cx: ballPos.x,
                            cy: ballPos.y,
                            opacity: 1,
                            r: ballR,
                        }}
                        transition={{
                            type: "spring",
                            stiffness: 260,
                            damping: 20,
                            mass: 0.8,
                        }}
                        style={{
                            filter: "drop-shadow(0 0 6px #ffd700) drop-shadow(0 0 14px rgba(255,215,0,0.5))",
                        }}
                    />
                )}
            </svg>

            {/* Multiplier Bins — positioned below the SVG in the same flow */}
            <div
                className="relative z-10 flex items-end"
                style={{
                    gap: 3,
                    marginTop: -BIN_H + 4,
                    width: SVG_W,
                    maxWidth: "100%",
                    justifyContent: "center",
                }}
            >
                {multipliers.map((mult, idx) => {
                    const binW = colSp - 4;
                    const style = getMultiplierStyle(mult, multipliers.length, idx);
                    const isFinalBin =
                        revealedSteps === rows &&
                        idx === path.reduce((a, b) => a + b, 0);

                    return (
                        <motion.div
                            key={idx}
                            animate={isFinalBin ? { y: -6, scale: 1.08 } : { y: 0, scale: 1 }}
                            transition={{ type: "spring", stiffness: 300, damping: 15 }}
                            style={{
                                width: binW,
                                height: 44,
                                borderRadius: 6,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                transformOrigin: "bottom center",
                                ...style,
                            }}
                        >
                            <span
                                style={{
                                    fontSize: rows === 16 ? 9 : rows === 12 ? 10 : 12,
                                    fontWeight: 800,
                                    color: style.color,
                                    textShadow: "0 1px 2px rgba(0,0,0,0.5)",
                                }}
                            >
                                {mult}x
                            </span>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
