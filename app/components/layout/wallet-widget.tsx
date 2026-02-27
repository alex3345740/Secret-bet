"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useCasinoStore } from "@/lib/store";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Wallet } from "lucide-react";

const WalletButtonClientOnly = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

export function WalletWidget() {
  const { connected } = useWallet();
  const setTxState = useCasinoStore((s) => s.setTxState);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTxState(connected ? "settled" : "disconnected");
  }, [connected, setTxState]);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex items-center">
      {mounted ? (
        <div className="[&>button]:!bg-brand-mixed-gradient [&>button]:!h-[42px] [&>button]:!px-5 [&>button]:!rounded-xl [&>button]:!font-semibold [&>button]:!text-white [&>button:hover]:!shadow-[0_0_20px_rgba(144,50,245,0.4)] [&>button]:!border-0 [&>button]:!transition-all [&>button]:!text-sm">
          <WalletButtonClientOnly />
        </div>
      ) : (
        <button type="button" className="cursor-pointer border-0 leading-none relative flex font-semibold text-white bg-brand-mixed-gradient hover:shadow-[0_0_20px_rgba(144,50,245,0.4)] h-[42px] rounded-xl items-center justify-center px-5 transition-all text-sm" disabled>
          <div className="flex items-center justify-center gap-2">
            <Wallet size={16} />
            <div>Select Wallet</div>
          </div>
        </button>
      )}
    </div>
  );
}
