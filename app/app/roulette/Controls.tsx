import { ControlPanel } from "@/components/layout/ControlPanel";
import type { AssetSymbol } from "@/lib/types";

type ControlsProps = {
    asset: AssetSymbol;
    setAsset: (a: AssetSymbol) => void;
    betStake: number;
    setBetStake: (w: number) => void;
    spin: () => void;
    canSpin: boolean;
    spinning: boolean;
    totalStake: number;
    availableBalance: number;
    connected: boolean;
    hasUsdcMint: boolean;
    isDemo: boolean;
    setIsDemo: (val: boolean) => void;
};

const CHIP_VALUES = [0.1, 1, 5, 20, 100, 500];

const CHIP_STYLES: Record<number, { bg: string; border: string; text: string }> = {
    0.1: { bg: "#1f2937", border: "#9ca3af", text: "#f9fafb" },
    1: { bg: "#2c2c4e", border: "#6366f1", text: "#e0e7ff" },
    5: { bg: "#7f1d1d", border: "#ef4444", text: "#fee2e2" },
    20: { bg: "#14532d", border: "#22c55e", text: "#dcfce7" },
    100: { bg: "#713f12", border: "#eab308", text: "#fef9c3" },
    500: { bg: "#312e81", border: "#818cf8", text: "#e0e7ff" },
};

export function Controls({
    asset, setAsset, betStake, setBetStake, spin, canSpin, spinning, totalStake, availableBalance, connected, hasUsdcMint, isDemo, setIsDemo
}: ControlsProps) {
    const potWin = "0.00"; // For roulette, pot win varies by bet types placed, displaying max potential isn't straightforward here.

    return (
        <ControlPanel
            asset={asset}
            wager={betStake}
            setWager={setBetStake}
            play={spin}
            canPlay={canSpin}
            playing={spinning}
            potWin={potWin}
            buttonLabel={spinning ? "Spinning..." : (isDemo || canSpin) ? `Spin (${totalStake.toFixed(2)} ${asset})` : "Connect to Play"}
            isDemo={isDemo}
            setIsDemo={setIsDemo}
        >
            {/* Asset Selector */}
            <div className="flex flex-col gap-2 mt-2">
                <label className="text-gray-400 text-xs font-semibold">Asset</label>
                <div className="relative">
                    <select
                        value={asset}
                        onChange={(e) => setAsset(e.target.value as AssetSymbol)}
                        disabled={spinning}
                        className="w-full h-[46px] bg-gray-900 border border-gray-700 rounded-md px-4 text-white font-bold appearance-none outline-none focus:border-brand-purple transition-colors disabled:opacity-50"
                    >
                        <option value="SOL">SOL</option>
                        <option value="USDC" disabled={!hasUsdcMint}>USDC</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                    </div>
                </div>
            </div>

            {/* Chip Selector */}
            <div className="flex flex-col gap-2 mt-2">
                <span className="text-gray-400 font-semibold text-xs">Select Chip Value</span>
                <div className="grid grid-cols-3 gap-3">
                    {CHIP_VALUES.map((val) => {
                        const style = CHIP_STYLES[val];
                        const isActive = betStake === val;
                        return (
                            <button
                                key={val}
                                onClick={() => setBetStake(val)}
                                disabled={spinning}
                                style={{
                                    background: style.bg,
                                    border: `2px ${isActive ? "solid" : "dashed"} ${style.border}`,
                                    color: style.text,
                                    boxShadow: isActive ? `0 0 12px ${style.border}44` : "none",
                                }}
                                className={`aspect-square rounded-full flex items-center justify-center font-black text-sm transition-all hover:brightness-125 hover:scale-105 disabled:opacity-50 ${isActive ? 'scale-110' : ''}`}
                            >
                                {val >= 1000 ? `${val / 1000}k` : val}
                            </button>
                        );
                    })}
                </div>
                {/* Total Wager Indicator for Table */}
                <div className="flex justify-between items-center text-xs font-semibold bg-gray-900 border border-gray-700 rounded-md px-3 py-2 mt-2">
                    <span className="text-gray-500">Total Wager on Table</span>
                    <span className="text-brand-purple-light">{totalStake.toFixed(4)} {asset}</span>
                </div>
            </div>
        </ControlPanel>
    );
}
