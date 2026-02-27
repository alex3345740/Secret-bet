"use client";

import { useMemo, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { evaluateRoulette, type RouletteBet, type RouletteBetType } from "@/lib/game/roulette";
import { buildFairnessTrace, makeRoundId, roundToRecord } from "@/lib/round";
import { sha256Hex } from "@/lib/crypto";
import { Wheel } from "./Wheel";
import { Table } from "./Table";
import { Controls } from "./Controls";
import { GameLayout } from "@/components/layout/GameLayout";
import { useCasinoStore } from "@/lib/store";
import type { AssetSymbol } from "@/lib/types";
import { useWalletAssetBalances } from "@/lib/solana/wallet-balances";
import {
  makeOnChainRoundId,
  submitRouletteRound
} from "@/lib/solana/backend-rounds";
import {
  trackRouletteRandomnessRequested,
  trackRouletteRoundFailed,
  trackRouletteRoundSettled,
  trackRouletteRoundStarted
} from "@/roulette/telemetry";

const BET_TYPE_OPTIONS: Array<{ value: RouletteBetType; label: string; hint: string }> = [
  { value: "straight", label: "Straight", hint: "0-36" },
  { value: "color", label: "Color", hint: "0 Red / 1 Black" },
  { value: "parity", label: "Parity", hint: "0 Even / 1 Odd" },
  { value: "range", label: "Range", hint: "0 Low / 1 High" },
  { value: "dozen", label: "Dozen", hint: "0,1,2" }
];

export default function RoulettePage() {
  const addRound = useCasinoStore((s) => s.addRound);
  const setTxState = useCasinoStore((s) => s.setTxState);
  const { connection } = useConnection();
  const wallet = useWallet();
  const { connected, sol, usdc, refresh, hasUsdcMint } = useWalletAssetBalances();

  const [asset, setAsset] = useState<AssetSymbol>("SOL");
  const [betType, setBetType] = useState<RouletteBetType>("straight");
  const [betValue, setBetValue] = useState(7);
  const [betStake, setBetStake] = useState(0.01);
  const [bets, setBets] = useState<RouletteBet[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [wheelTurns, setWheelTurns] = useState(0);
  const [lastPocket, setLastPocket] = useState<number | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [status, setStatus] = useState("Build your board and spin.");

  const totalStake = useMemo(() => bets.reduce((sum, b) => sum + b.stake, 0), [bets]);
  const availableBalance = asset === "SOL" ? sol : usdc;
  const canSpin =
    !spinning &&
    bets.length > 0 &&
    (isDemo || (connected && availableBalance >= totalStake && (asset === "SOL" || hasUsdcMint)));

  const addBet = () => {
    if (betStake <= 0) return;
    setBets((prev) => [...prev, { type: betType, value: betValue, stake: betStake }].slice(0, 10));
  };

  const spin = async () => {
    if (!canSpin) return;
    if (isDemo) {
      setSpinning(true);
      setStatus("Spinning wheel in Demo Mode...");
      const mockRandomness = new Uint8Array(Array.from({ length: 32 }, () => Math.floor(Math.random() * 256)));
      const winningPocket = mockRandomness[0] % 37;
      const result = evaluateRoulette(winningPocket, bets);
      const wheelNumbers = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
      const targetIndex = wheelNumbers.indexOf(winningPocket);
      // Subtracting 0.5 centers the pointer on the slice instead of its leading edge
      setWheelTurns((prev) => Math.floor(prev) + 6 + (37 - targetIndex - 0.5) / 37);
      await new Promise((resolve) => setTimeout(resolve, 5000));
      setLastPocket(winningPocket);
      setStatus(`Demo Pocket ${winningPocket} resolved.`);
      setSpinning(false);
      return;
    }
    if (!wallet.publicKey) {
      setStatus("Connect wallet before spinning.");
      setTxState("failed");
      return;
    }
    if (asset === "USDC" && !hasUsdcMint) {
      setStatus("USDC mint is not configured. Set NEXT_PUBLIC_USDC_MINT.");
      setTxState("failed");
      return;
    }

    setSpinning(true);
    setTxState("pending");
    setStatus("Submitting private round...");

    const roundId = makeRoundId("roulette");
    const chainRoundId = makeOnChainRoundId();
    trackRouletteRoundStarted(roundId, totalStake, bets.length);

    try {
      const { randomness, fairness } = await buildFairnessTrace(roundId, "roulette");
      const betCommitmentHash = await sha256Hex(
        `${roundId}:${chainRoundId}:${asset}:${fairness.requestHash}:${bets.length}:${totalStake}`
      );
      const privatePayloadHash = await sha256Hex(
        JSON.stringify({
          roundId,
          chainRoundId,
          asset,
          bets
        })
      );

      const chainSubmission = await submitRouletteRound({
        connection,
        wallet,
        roundId: chainRoundId,
        asset,
        bets,
        betCommitmentHash,
        privatePayloadHash
      });

      trackRouletteRandomnessRequested(roundId, fairness.requestHash);
      const winningPocket = randomness[0] % 37;
      const result = evaluateRoulette(winningPocket, bets);

      setStatus("Spinning wheel...");
      const wheelNumbers = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
      const targetIndex = wheelNumbers.indexOf(winningPocket);
      setWheelTurns((prev) => Math.floor(prev) + 6 + (37 - targetIndex - 0.5) / 37);
      await new Promise((resolve) => setTimeout(resolve, 5000));
      setLastPocket(winningPocket);

      await refresh();
      addRound(
        roundToRecord(roundId, "roulette", totalStake, result.payout, fairness, {
          chainRoundId,
          chainRoundPda: chainSubmission.roundPda,
          createTx: chainSubmission.createSignature,
          lockTx: chainSubmission.lockSignature,
          winningPocket,
          bets: bets.length
        })
      );
      trackRouletteRoundSettled(roundId, totalStake, result.payout, winningPocket, bets.length);

      setStatus(`Pocket ${winningPocket} resolved. Payout ${result.payout.toFixed(4)} ${asset}.`);
      setTxState("settled");
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown roulette failure";
      trackRouletteRoundFailed(roundId, reason);
      setTxState("failed");
      setStatus(`Spin failed: ${reason}`);
    } finally {
      setSpinning(false);
    }
  };

  return (
    <GameLayout
      gameName="Roulette"
      controls={
        <Controls
          asset={asset}
          setAsset={setAsset}
          betStake={betStake}
          setBetStake={setBetStake}
          spin={spin}
          canSpin={canSpin}
          spinning={spinning}
          totalStake={totalStake}
          availableBalance={availableBalance}
          connected={connected}
          hasUsdcMint={hasUsdcMint || false}
          isDemo={isDemo}
          setIsDemo={setIsDemo}
        />
      }
    >
      <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6 w-full h-full pb-16">
        <Wheel wheelTurns={wheelTurns} lastPocket={lastPocket} />

        <div className="w-full max-w-[800px] mt-4 relative z-20">
          <Table
            bets={bets}
            addBet={(type, value) => {
              if (betStake <= 0) return;
              setBets((prev) => [...prev, { type, value, stake: betStake }].slice(0, 10));
            }}
          />
        </div>

        {/* Floating Bet Slate and Status */}
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 items-end">
          <div aria-live="polite" className="bg-black/40 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/5 text-gray-300 font-bold shadow-lg">
            {status}
          </div>

          {bets.length > 0 && (
            <div className="bg-black/60 backdrop-blur-md rounded-lg border border-gray-700 p-3 shadow-xl max-w-[250px] w-full text-right transition-all">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-gray-300 font-bold text-xs uppercase">Your Bets ({bets.length})</h3>
                <button
                  onClick={() => setBets([])}
                  className="text-[10px] text-red-400 hover:text-red-300 font-bold transition-colors"
                >
                  Clear
                </button>
              </div>
              <div className="flex flex-col gap-1 max-h-[150px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700">
                {bets.map((bet, idx) => (
                  <div key={idx} className="flex justify-between items-center text-[10px] bg-white/5 px-2 py-1 rounded">
                    <span className="font-semibold capitalize text-gray-400">{bet.type} {bet.value}</span>
                    <span className="text-brand-purple font-bold">{bet.stake.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </GameLayout>
  );
}
