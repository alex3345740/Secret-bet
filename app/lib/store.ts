"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { RoundRecord, TxLifecycleState } from "@/lib/types";

interface CasinoState {
  txState: TxLifecycleState;
  rounds: RoundRecord[];
  setTxState: (state: TxLifecycleState) => void;
  addRound: (record: RoundRecord) => void;
}

export const useCasinoStore = create<CasinoState>()(
  persist(
    (set) => ({
      txState: "disconnected",
      rounds: [],
      setTxState: (txState) => set({ txState }),
      addRound: (record) =>
        set((state) => ({
          rounds: [record, ...state.rounds].slice(0, 80)
        }))
    }),
    {
      name: "hidden-bet-store"
    }
  )
);
