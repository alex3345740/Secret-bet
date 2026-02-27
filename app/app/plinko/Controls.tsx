import { ControlPanel } from "@/components/layout/ControlPanel";
import type { AssetSymbol } from "@/lib/types";

type ControlsProps = {
    asset: AssetSymbol;
    setAsset: (a: AssetSymbol) => void;
    wager: number;
    setWager: (w: number) => void;
    rows: 8 | 12 | 16;
    setRows: (r: 8 | 12 | 16) => void;
    riskLevel: 0 | 1 | 2;
    setRiskLevel: (r: 0 | 1 | 2) => void;
    play: () => void;
    canPlay: boolean;
    playing: boolean;
    hasUsdcMint: boolean;
    isDemo: boolean;
    setIsDemo: (val: boolean) => void;
};

export function Controls({
    asset, setAsset, wager, setWager, rows, setRows, riskLevel, setRiskLevel,
    play, canPlay, playing, hasUsdcMint, isDemo, setIsDemo
}: ControlsProps) {
    const potWin = (wager * (asset === "SOL" ? 150 : 1) * 1000).toFixed(6).replace(/\.?0+$/, "");

    return (
        <ControlPanel
            asset={asset}
            wager={wager}
            setWager={setWager}
            play={play}
            canPlay={canPlay}
            playing={playing}
            potWin={potWin}
            buttonLabel={playing ? "Dropping Ball..." : (isDemo || canPlay) ? "Drop Ball" : "Connect to Play"}
            isDemo={isDemo}
            setIsDemo={setIsDemo}
        >
            {/* Risk Level */}
            <div className="flex flex-col gap-2 mt-2">
                <label className="text-gray-400 text-xs font-semibold">Risk</label>
                <div className="relative">
                    <select
                        value={riskLevel}
                        onChange={(e) => setRiskLevel(Number(e.target.value) as 0 | 1 | 2)}
                        disabled={playing}
                        className="w-full h-[46px] bg-gray-900 border border-gray-700 rounded-md px-4 text-white font-bold appearance-none outline-none focus:border-brand-purple transition-colors disabled:opacity-50"
                    >
                        <option value={0}>Low</option>
                        <option value={1}>Medium</option>
                        <option value={2}>High</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                    </div>
                </div>
            </div>

            {/* Number of Rows */}
            <div className="flex flex-col gap-2 mt-2">
                <div className="flex justify-between items-center text-xs font-semibold">
                    <label className="text-gray-400">Number of Rows</label>
                    <span className="text-white">×{rows}</span>
                </div>
                <div className="bg-gray-900 border border-gray-700 rounded-md p-3">
                    <input
                        type="range"
                        min={8}
                        max={16}
                        step={4}
                        value={rows}
                        onChange={(e) => setRows(Number(e.target.value) as 8 | 12 | 16)}
                        disabled={playing}
                        className="w-full accent-brand-purple cursor-pointer disabled:opacity-50"
                    />
                    <div className="flex justify-between text-[10px] text-gray-500 font-bold mt-1 px-1">
                        <span>8</span>
                        <span>12</span>
                        <span>16</span>
                    </div>
                </div>
            </div>
        </ControlPanel>
    );
}
