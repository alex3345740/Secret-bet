"use client";

import { useCasinoStore } from "@/lib/store";

const LABEL: Record<string, string> = {
  disconnected: "Disconnected",
  initializing: "Initializing",
  pending: "Pending",
  settled: "Settled",
  failed: "Failed"
};

export function TxLifecycle() {
  const txState = useCasinoStore((s) => s.txState);
  const color =
    txState === "settled"
      ? "#7ef4b8"
      : txState === "pending"
        ? "#ffd06d"
        : txState === "failed"
          ? "#ff6c87"
          : "#9fb4c0";

  return (
    <span
      className="hb-chip"
      style={{
        borderColor: `${color}66`,
        color,
        background: `${color}1a`
      }}
    >
      TX: {LABEL[txState]}
    </span>
  );
}

