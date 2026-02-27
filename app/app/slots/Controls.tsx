import { ControlPanel } from "@/components/layout/ControlPanel";
import type { AssetSymbol } from "@/lib/types";

type ControlsProps = {
    asset: AssetSymbol;
    setAsset: (a: AssetSymbol) => void;
    wager: number;
    setWager: (w: number) => void;
    paylines: 1 | 5 | 10 | 20;
    setPaylines: (v: 1 | 5 | 10 | 20) => void;
    spin: () => void;
    canSpin: boolean;
    spinning: boolean;
    availableBalance: number;
    connected: boolean;
    hasUsdcMint: boolean;
    isDemo: boolean;
    setIsDemo: (val: boolean) => void;
};

const PAYLINES_OPTIONS: Array<{ value: 1 | 5 | 10 | 20; label: string }> = [
    { value: 1, label: "1 Line" },
    { value: 5, label: "5 Lines" },
    { value: 10, label: "10 Lines" },
    { value: 20, label: "20 Lines (Max)" },
];

export function Controls({
    asset, setAsset, wager, setWager, paylines, setPaylines,
    spin, canSpin, spinning, availableBalance, connected, hasUsdcMint, isDemo, setIsDemo
}: ControlsProps) {
    const potWin = (wager * (asset === "SOL" ? 150 : 1) * 20 * paylines).toFixed(2); // Mock potential win based on lines.

    return (
        <ControlPanel
            asset={asset}
            wager={wager}
            setWager={setWager}
            play={spin}
            canPlay={canSpin}
            playing={spinning}
            potWin={potWin}
            buttonLabel={spinning ? "Spinning..." : (isDemo || canSpin) ? "Spin" : "Connect to Play"}
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

            {/* Paylines */}
            <div className="flex flex-col gap-2 mt-2">
                <label className="text-gray-400 text-xs font-semibold">Paylines</label>
                <div className="grid grid-cols-2 gap-2">
                    {PAYLINES_OPTIONS.map(({ value, label }) => (
                        <button
                            key={value}
                            onClick={() => setPaylines(value)}
                            disabled={spinning}
                            className={`rounded-md py-2.5 px-3 text-xs font-bold transition-all border ${paylines === value
                                ? "bg-gray-800 border-brand-purple text-brand-purple-light shadow-[inset_0_0_10px_rgba(144,50,245,0.2)]"
                                : "bg-gray-900 border-gray-700 text-gray-400 hover:text-white"
                                } disabled:opacity-50`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>
        </ControlPanel>
    );
}
