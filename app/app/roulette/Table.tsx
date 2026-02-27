"use client";

import type { RouletteBet, RouletteBetType } from "@/lib/game/roulette";

type TableProps = {
  bets: RouletteBet[];
  addBet: (type: RouletteBetType, value: number) => void;
};

const RED_NUMBERS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
const ROWS = [
  [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
  [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
  [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34]
];

export function Table({ bets, addBet }: TableProps) {
  const getBetAmount = (type: RouletteBetType, value: number) =>
    bets.filter((b) => b.type === type && b.value === value).reduce((sum, b) => sum + b.stake, 0);

  const renderChip = (amount: number) => {
    if (amount <= 0) return null;
    return (
      <div className="absolute z-10 inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-7 h-7 rounded-full bg-brand-purple border-2 border-dashed border-white text-white text-[9px] font-black flex items-center justify-center shadow-lg">
          {amount >= 1 ? amount.toFixed(0) : amount.toFixed(1)}
        </div>
      </div>
    );
  };

  const renderCell = (
    label: string,
    type: RouletteBetType,
    value: number,
    bgClass: string,
    textClass = "text-gray-50",
    extraClass = ""
  ) => {
    const amount = getBetAmount(type, value);
    return (
      <div
        onClick={() => addBet(type, value)}
        className={`relative flex items-center justify-center font-bold text-sm cursor-pointer border border-gray-600 select-none hover:brightness-110 transition-all active:brightness-90 ${bgClass} ${textClass} ${extraClass}`}
      >
        {label}
        {renderChip(amount)}
      </div>
    );
  };

  return (
    <div className="overflow-x-auto w-full">
      <div
        className="grid gap-0.5 min-w-[640px] rounded-lg overflow-hidden border border-gray-700 bg-gray-900 p-2"
        style={{
          display: "grid",
          gridTemplateColumns: "52px repeat(12, 1fr) 52px",
          gridTemplateRows: "repeat(5, 44px)",
          gap: "2px",
        }}
      >
        {/* Zero - spans all 3 number rows */}
        <div style={{ gridRow: "1 / 4", gridColumn: "1 / 2" }}>
          {renderCell("0", "straight", 0, "bg-green-700", "text-white", "rounded-l")}
        </div>

        {/* Numbers 1-36 in 3 rows */}
        {ROWS.map((row, rowIndex) =>
          row.map((num, colIndex) => (
            <div key={num} style={{ gridRow: `${rowIndex + 1}`, gridColumn: `${colIndex + 2}` }}>
              {renderCell(
                num.toString(),
                "straight",
                num,
                RED_NUMBERS.has(num) ? "bg-[#c0392b] hover:bg-[#e74c3c]" : "bg-[#2d2d4a] hover:bg-[#3d3d5a]",
                "text-white"
              )}
            </div>
          ))
        )}

        {/* 2:1 buttons - right column */}
        <div style={{ gridRow: "1", gridColumn: "14" }}>
          {renderCell("2:1", "straight", -1, "bg-gray-700 hover:bg-gray-600", "text-gray-200", "rounded-r")}
        </div>
        <div style={{ gridRow: "2", gridColumn: "14" }}>
          {renderCell("2:1", "straight", -2, "bg-gray-700 hover:bg-gray-600", "text-gray-200")}
        </div>
        <div style={{ gridRow: "3", gridColumn: "14" }}>
          {renderCell("2:1", "straight", -3, "bg-gray-700 hover:bg-gray-600", "text-gray-200")}
        </div>

        {/* Dozens row */}
        <div style={{ gridRow: "4", gridColumn: "1 / 2" }}><div className="bg-gray-800 h-full" /></div>
        <div style={{ gridRow: "4", gridColumn: "2 / 6" }}>
          {renderCell("1st 12", "dozen", 0, "bg-gray-700 hover:bg-gray-600", "text-gray-100")}
        </div>
        <div style={{ gridRow: "4", gridColumn: "6 / 10" }}>
          {renderCell("2nd 12", "dozen", 1, "bg-gray-700 hover:bg-gray-600", "text-gray-100")}
        </div>
        <div style={{ gridRow: "4", gridColumn: "10 / 14" }}>
          {renderCell("3rd 12", "dozen", 2, "bg-gray-700 hover:bg-gray-600", "text-gray-100")}
        </div>
        <div style={{ gridRow: "4", gridColumn: "14" }}><div className="bg-gray-800 h-full" /></div>

        {/* Bottom bets row */}
        <div style={{ gridRow: "5", gridColumn: "1 / 2" }}><div className="bg-gray-800 h-full" /></div>
        <div style={{ gridRow: "5", gridColumn: "2 / 4" }}>
          {renderCell("1-18", "range", 0, "bg-gray-700 hover:bg-gray-600", "text-gray-100")}
        </div>
        <div style={{ gridRow: "5", gridColumn: "4 / 6" }}>
          {renderCell("Even", "parity", 0, "bg-gray-700 hover:bg-gray-600", "text-gray-100")}
        </div>
        <div style={{ gridRow: "5", gridColumn: "6 / 8" }}>
          {renderCell("", "color", 0, "bg-[#c0392b] hover:bg-[#e74c3c]")}
        </div>
        <div style={{ gridRow: "5", gridColumn: "8 / 10" }}>
          {renderCell("", "color", 1, "bg-[#2d2d4a] hover:bg-[#3d3d5a]")}
        </div>
        <div style={{ gridRow: "5", gridColumn: "10 / 12" }}>
          {renderCell("Odd", "parity", 1, "bg-gray-700 hover:bg-gray-600", "text-gray-100")}
        </div>
        <div style={{ gridRow: "5", gridColumn: "12 / 14" }}>
          {renderCell("19-36", "range", 1, "bg-gray-700 hover:bg-gray-600", "text-gray-100")}
        </div>
        <div style={{ gridRow: "5", gridColumn: "14" }}><div className="bg-gray-800 h-full" /></div>
      </div>
    </div>
  );
}
