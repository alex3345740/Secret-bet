"use client";

import { useMemo, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { runPlinko } from "@/lib/game/plinko";
import { buildFairnessTrace, makeRoundId, roundToRecord } from "@/lib/round";
import { sha256Hex } from "@/lib/crypto";
import { Board } from "./Board";
import { Controls } from "./Controls";
import { GameLayout } from "@/components/layout/GameLayout";
import { useCasinoStore } from "@/lib/store";
import type { AssetSymbol } from "@/lib/types";
import { useWalletAssetBalances } from "@/lib/solana/wallet-balances";
import {
  makeOnChainRoundId,
  submitPlinkoRound
} from "@/lib/solana/backend-rounds";
import {
  trackPlinkoRandomnessRequested,
  trackPlinkoRoundFailed,
  trackPlinkoRoundSettled,
  trackPlinkoRoundStarted
} from "@/plinko/telemetry";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function PlinkoPage() {
  const addRound = useCasinoStore((s) => s.addRound);
  const setTxState = useCasinoStore((s) => s.setTxState);
  const { connection } = useConnection();
  const wallet = useWallet();
  const {
    connected,
    sol,
    usdc,
    refresh: refreshBalances,
    hasUsdcMint
  } = useWalletAssetBalances();

  const [asset, setAsset] = useState<AssetSymbol>("SOL");
  const [wager, setWager] = useState(0.05);
  const [rows, setRows] = useState<8 | 12 | 16>(12);
  const [riskLevel, setRiskLevel] = useState<0 | 1 | 2>(1);
  const [path, setPath] = useState<number[]>([]);
  const [revealedSteps, setRevealedSteps] = useState(0);
  const [resultLabel, setResultLabel] = useState("Ready");
  const [isDemo, setIsDemo] = useState(false);
  const [playing, setPlaying] = useState(false);

  const availableBalance = asset === "SOL" ? sol : usdc;
  const canPlay =
    !playing &&
    wager > 0 &&
    (isDemo || (connected && availableBalance >= wager && (asset === "SOL" || hasUsdcMint)));
  const boardRows = useMemo(() => Array.from({ length: rows }, (_, i) => i), [rows]);

  const play = async () => {
    if (!canPlay) return;
    if (isDemo) {
      setPlaying(true);
      setPath([]);
      setRevealedSteps(0);
      setResultLabel("Ball traversing board (Demo Mode)...");
      const mockRandomness = new Uint8Array(Array.from({ length: 32 }, () => Math.floor(Math.random() * 256)));
      const result = runPlinko({ wager, rows, riskLevel, randomness: mockRandomness });
      setPath(result.path);
      for (let i = 0; i < result.path.length; i += 1) {
        setRevealedSteps(i + 1);
        await sleep(150); // Synchronize with the 0.15s per-peg keyframe duration in Board.tsx
      }
      setResultLabel(`Demo Settled bin ${result.finalBin} at ${result.multiplierBps / 100}x.`);
      setPlaying(false);
      return;
    }
    if (!wallet.publicKey) {
      setResultLabel("Connect wallet before starting a round.");
      setTxState("failed");
      return;
    }
    if (asset === "USDC" && !hasUsdcMint) {
      setResultLabel("USDC mint is not configured. Set NEXT_PUBLIC_USDC_MINT.");
      setTxState("failed");
      return;
    }

    setPlaying(true);
    setTxState("pending");
    setPath([]);
    setRevealedSteps(0);
    setResultLabel("Submitting private round...");

    const roundId = makeRoundId("plinko");
    const chainRoundId = makeOnChainRoundId();
    trackPlinkoRoundStarted(roundId, wager, rows, riskLevel);

    try {
      const { randomness, fairness } = await buildFairnessTrace(roundId, "plinko");
      const betCommitmentHash = await sha256Hex(
        `${roundId}:${chainRoundId}:${asset}:${wager}:${rows}:${riskLevel}:${fairness.requestHash}`
      );
      const privatePayloadHash = await sha256Hex(
        JSON.stringify({
          roundId,
          chainRoundId,
          asset,
          wager,
          rows,
          riskLevel,
          clientSeed: fairness.clientSeed
        })
      );

      const chainSubmission = await submitPlinkoRound({
        connection,
        wallet,
        roundId: chainRoundId,
        asset,
        wager,
        rows,
        riskLevel,
        betCommitmentHash,
        privatePayloadHash
      });

      trackPlinkoRandomnessRequested(roundId, fairness.requestHash);
      const result = runPlinko({ wager, rows, riskLevel, randomness });

      setPath(result.path);
      setResultLabel("Ball traversing board...");
      for (let i = 0; i < result.path.length; i += 1) {
        setRevealedSteps(i + 1);
        await sleep(150);
      }

      await refreshBalances();
      addRound(
        roundToRecord(roundId, "plinko", wager, result.payout, fairness, {
          chainRoundId,
          chainRoundPda: chainSubmission.roundPda,
          createTx: chainSubmission.createSignature,
          lockTx: chainSubmission.lockSignature,
          rows,
          riskLevel,
          finalBin: result.finalBin,
          multiplierBps: result.multiplierBps
        })
      );
      trackPlinkoRoundSettled(roundId, wager, result.payout, result.finalBin, result.multiplierBps);

      setResultLabel(
        `Settled bin ${result.finalBin} at ${result.multiplierBps / 100}x. Payout ${result.payout.toFixed(4)} ${asset}.`
      );
      setTxState("settled");
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown plinko failure";
      trackPlinkoRoundFailed(roundId, reason);
      setTxState("failed");
      setResultLabel(`Round failed: ${reason}`);
    } finally {
      setPlaying(false);
    }
  };

  return (
    <GameLayout
      gameName="Plinko"
      controls={
        <Controls
          asset={asset}
          setAsset={setAsset}
          wager={wager}
          setWager={setWager}
          rows={rows}
          setRows={setRows}
          riskLevel={riskLevel}
          setRiskLevel={setRiskLevel}
          play={play}
          canPlay={canPlay}
          playing={playing}
          hasUsdcMint={hasUsdcMint || false}
          isDemo={isDemo}
          setIsDemo={setIsDemo}
        />
      }
    >
      <div className="flex flex-1 items-start justify-center p-6 w-full h-full">
        <Board
          rows={rows}
          riskLevel={riskLevel}
          path={path}
          revealedSteps={revealedSteps}
        />
      </div>

      {/* Absolute positioned result label for visual feedback */}
      <div className="absolute top-4 right-4 z-20">
        <div aria-live="polite" className="bg-black/40 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/5 text-gray-300 font-bold shadow-lg">
          {resultLabel}
        </div>
      </div>
    </GameLayout>
  );
}
