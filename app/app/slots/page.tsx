"use client";

import { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { runSlots } from "@/lib/game/slots";
import { buildFairnessTrace, makeRoundId, roundToRecord } from "@/lib/round";
import { sha256Hex } from "@/lib/crypto";
import { Controls } from "./Controls";
import { Reels } from "./Reels";
import { GameLayout } from "@/components/layout/GameLayout";
import { useCasinoStore } from "@/lib/store";
import type { AssetSymbol } from "@/lib/types";
import { useWalletAssetBalances } from "@/lib/solana/wallet-balances";
import {
  makeOnChainRoundId,
  submitSlotsRound
} from "@/lib/solana/backend-rounds";
import {
  trackSlotsRandomnessRequested,
  trackSlotsRoundFailed,
  trackSlotsRoundSettled,
  trackSlotsRoundStarted
} from "@/slots/telemetry";

const SYMBOLS = ["A", "B", "C", "D", "E", "F", "G", "H"];

const makePlaceholderGrid = (): number[] =>
  Array.from({ length: 15 }, (_, index) => (index * 3 + 1) % SYMBOLS.length);

export default function SlotsPage() {
  const addRound = useCasinoStore((s) => s.addRound);
  const setTxState = useCasinoStore((s) => s.setTxState);
  const { connection } = useConnection();
  const wallet = useWallet();
  const { connected, sol, usdc, refresh, hasUsdcMint } = useWalletAssetBalances();

  const [asset, setAsset] = useState<AssetSymbol>("SOL");
  const [wager, setWager] = useState(0.05);
  const [paylines, setPaylines] = useState<1 | 5 | 10 | 20>(20);
  const [grid, setGrid] = useState<number[]>(() => makePlaceholderGrid());
  const [winMask, setWinMask] = useState<number[]>(Array.from({ length: 20 }, () => 0));
  const [spinning, setSpinning] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [status, setStatus] = useState("Ready to spin.");

  useEffect(() => {
    if (!spinning) return;
    const timer = setInterval(() => {
      setGrid(makePlaceholderGrid());
    }, 90);
    return () => clearInterval(timer);
  }, [spinning]);

  const availableBalance = asset === "SOL" ? sol : usdc;
  const canSpin =
    !spinning &&
    wager > 0 &&
    (isDemo || (connected && availableBalance >= wager && (asset === "SOL" || hasUsdcMint)));

  const spin = async () => {
    if (!canSpin) return;
    if (isDemo) {
      setSpinning(true);
      setStatus("Spinning in Demo Mode...");
      const mockRandomness = new Uint8Array(Array.from({ length: 32 }, () => Math.floor(Math.random() * 256)));
      setTimeout(() => {
        const result = runSlots({ wager, activeLines: paylines, randomness: mockRandomness });
        const wins = result.winMask.filter(Boolean).length;
        setGrid(result.grid);
        setWinMask(result.winMask);
        setStatus(`Demo Spin settled. ${wins} winning lines.`);
        setSpinning(false);
      }, 1600);
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

    setTxState("pending");
    setSpinning(true);
    setStatus("Submitting private round...");

    const roundId = makeRoundId("slots");
    const chainRoundId = makeOnChainRoundId();
    trackSlotsRoundStarted(roundId, wager, paylines);

    try {
      const { randomness, fairness } = await buildFairnessTrace(roundId, "slots");
      const betCommitmentHash = await sha256Hex(
        `${roundId}:${chainRoundId}:${asset}:${wager}:${paylines}:${fairness.requestHash}`
      );
      const privatePayloadHash = await sha256Hex(
        JSON.stringify({
          roundId,
          chainRoundId,
          asset,
          wager,
          paylines
        })
      );

      const chainSubmission = await submitSlotsRound({
        connection,
        wallet,
        roundId: chainRoundId,
        asset,
        wager,
        paylines,
        betCommitmentHash,
        privatePayloadHash
      });

      trackSlotsRandomnessRequested(roundId, fairness.requestHash);
      const result = runSlots({ wager, activeLines: paylines, randomness });
      await new Promise((resolve) => setTimeout(resolve, 1600));

      const wins = result.winMask.filter(Boolean).length;
      setGrid(result.grid);
      setWinMask(result.winMask);
      await refresh();
      addRound(
        roundToRecord(roundId, "slots", wager, result.payout, fairness, {
          chainRoundId,
          chainRoundPda: chainSubmission.roundPda,
          createTx: chainSubmission.createSignature,
          lockTx: chainSubmission.lockSignature,
          paylines,
          wins
        })
      );
      trackSlotsRoundSettled(roundId, wager, result.payout, wins, paylines);

      setStatus(`Spin settled. ${wins} winning lines. Payout ${result.payout.toFixed(4)} ${asset}.`);
      setTxState("settled");
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown slots failure";
      trackSlotsRoundFailed(roundId, reason);
      setTxState("failed");
      setStatus(`Spin failed: ${reason}`);
    } finally {
      setSpinning(false);
    }
  };

  return (
    <GameLayout
      gameName="Slots"
      controls={
        <Controls
          asset={asset}
          setAsset={setAsset}
          wager={wager}
          setWager={setWager}
          paylines={paylines}
          setPaylines={setPaylines}
          spin={spin}
          canSpin={canSpin}
          spinning={spinning}
          availableBalance={availableBalance}
          connected={connected}
          hasUsdcMint={hasUsdcMint || false}
          isDemo={isDemo}
          setIsDemo={setIsDemo}
        />
      }
    >
      <div className="flex flex-1 flex-col items-center justify-center p-6 w-full h-full relative z-20">

        {/* Decorative elements for Slots */}
        <div className="absolute top-10 flex flex-col items-center text-center opacity-40 mix-blend-screen pointer-events-none">
          <div className="h-1 w-32 bg-gradient-to-r from-transparent via-brand-pink to-transparent" />
        </div>

        <Reels
          grid={grid}
          paylines={paylines}
          spinning={spinning}
          winMask={winMask}
        />

        {/* Floating status */}
        <div className="absolute top-4 right-4 z-20">
          <div aria-live="polite" className="bg-black/40 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/5 text-gray-300 font-bold shadow-lg">
            {status}
          </div>
        </div>
      </div>
    </GameLayout>
  );
}
