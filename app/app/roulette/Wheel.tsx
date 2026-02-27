"use client";

type WheelProps = {
    wheelTurns: number;
    lastPocket: number | null;
};

const RED_NUMBERS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
const WHEEL_NUMBERS = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
const TOTAL = WHEEL_NUMBERS.length;

export function Wheel({ wheelTurns, lastPocket }: WheelProps) {
    const wheelSlices = WHEEL_NUMBERS.map((num, i) => {
        const isZero = num === 0;
        const isRed = !isZero && RED_NUMBERS.has(num);
        const color = isZero ? "#15803d" : isRed ? "#c0392b" : "#2c2c4e";
        const startAngle = (i * 360) / TOTAL;
        const endAngle = ((i + 1) * 360) / TOTAL;
        return `${color} ${startAngle.toFixed(2)}deg ${endAngle.toFixed(2)}deg`;
    });

    const gradient = `conic-gradient(${wheelSlices.join(", ")})`;

    return (
        <div className="flex flex-col items-center justify-center w-full h-full min-h-[380px] gap-6">
            <div className="relative" style={{ width: 320, height: 320 }}>

                {/* Outer bezel ring */}
                <div className="absolute inset-0 rounded-full"
                    style={{
                        background: "linear-gradient(135deg, #383958, #22213b)",
                        boxShadow: "0 0 0 8px #2e2d4d, 0 16px 48px rgba(0,0,0,0.7), 0 0 40px rgba(149,80,238,0.15)",
                    }}
                />

                {/* The Wheel with CSS conic gradient */}
                <div
                    className="absolute rounded-full overflow-hidden"
                    style={{
                        inset: 8,
                        background: gradient,
                        transform: `rotate(${wheelTurns * 360}deg)`,
                        transition: wheelTurns > 0 ? "transform 5s cubic-bezier(0.1, 0.85, 0.15, 1)" : "none",
                    }}
                >
                    {/* Segment numbers */}
                    {WHEEL_NUMBERS.map((num, i) => {
                        const angle = (i * 360) / TOTAL + (180 / TOTAL);
                        return (
                            <div
                                key={`num-${num}`}
                                style={{
                                    position: "absolute",
                                    left: "50%",
                                    top: 0,
                                    height: "50%",
                                    transformOrigin: "bottom center",
                                    transform: `translateX(-50%) rotate(${angle}deg)`,
                                    display: "flex",
                                    alignItems: "flex-start",
                                    paddingTop: 6,
                                    color: "#fff",
                                    fontWeight: 800,
                                    fontSize: 10,
                                    WebkitFontSmoothing: "antialiased",
                                    pointerEvents: "none",
                                    zIndex: 5,
                                    userSelect: "none",
                                }}
                            >
                                {num}
                            </div>
                        );
                    })}

                    {/* Dividers between pockets */}
                    {WHEEL_NUMBERS.map((_, i) => {
                        const angle = (i * 360) / TOTAL;
                        return (
                            <div
                                key={`div-${i}`}
                                style={{
                                    position: "absolute",
                                    left: "50%",
                                    top: 0,
                                    height: "50%",
                                    width: "1px",
                                    transformOrigin: "bottom center",
                                    transform: `translateX(-50%) rotate(${angle}deg)`,
                                    background: "rgba(255,255,255,0.15)",
                                    pointerEvents: "none",
                                }}
                            />
                        );
                    })}
                </div>

                {/* Inner hub */}
                <div
                    className="absolute rounded-full flex items-center justify-center z-20"
                    style={{
                        inset: "35%",
                        background: "radial-gradient(circle, #383958 0%, #22213b 100%)",
                        boxShadow: "0 0 0 4px #2e2d4d, 0 4px 16px rgba(0,0,0,0.6)",
                    }}
                >
                    <div
                        className="w-3 h-3 rounded-full"
                        style={{ background: "var(--brand-purple)", boxShadow: "0 0 12px var(--brand-purple)" }}
                    />
                </div>

                {/* Top pointer arrow */}
                <div
                    className="absolute z-30"
                    style={{
                        top: -2,
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: 0,
                        height: 0,
                        borderLeft: "8px solid transparent",
                        borderRight: "8px solid transparent",
                        borderTop: "20px solid var(--brand-purple)",
                        filter: "drop-shadow(0 0 6px var(--brand-purple))",
                    }}
                />
            </div>

            {/* Result badge */}
            <div className="flex items-center justify-center gap-3 px-6 py-3 rounded-lg bg-gray-800 border border-gray-700 min-w-[180px]">
                {lastPocket !== null && (
                    <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-lg border-2 border-white/20 shadow-lg"
                        style={{
                            background: lastPocket === 0 ? "#15803d" : RED_NUMBERS.has(lastPocket) ? "#c0392b" : "#2c2c4e",
                        }}
                    >
                        {lastPocket}
                    </div>
                )}
                <span className="text-gray-300 font-bold text-sm">
                    {lastPocket === null ? "Ready to spin" : `Result: ${lastPocket}`}
                </span>
            </div>
        </div>
    );
}
