"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { resolveUsdcMint } from "@/lib/solana/assets";

type WalletBalancesState = {
  connected: boolean;
  loading: boolean;
  sol: number;
  usdc: number;
  usdcMint: string | null;
  error: string | null;
};

const initialState: WalletBalancesState = {
  connected: false,
  loading: false,
  sol: 0,
  usdc: 0,
  usdcMint: null,
  error: null
};

export const useWalletAssetBalances = () => {
  const { connection } = useConnection();
  const { connected, publicKey } = useWallet();
  const [state, setState] = useState<WalletBalancesState>(initialState);
  const usdcMint = useMemo(() => resolveUsdcMint(), []);
  const walletAddress = publicKey?.toBase58() ?? null;

  const refresh = useCallback(async () => {
    if (!connected || !publicKey) {
      setState((prev) => ({
        ...prev,
        connected: false,
        loading: false,
        sol: 0,
        usdc: 0,
        usdcMint: usdcMint?.toBase58() ?? null,
        error: null
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      connected: true,
      loading: true,
      usdcMint: usdcMint?.toBase58() ?? null,
      error: null
    }));

    try {
      const lamports = await connection.getBalance(publicKey, "confirmed");
      let usdc = 0;

      if (usdcMint) {
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
          publicKey,
          { mint: usdcMint },
          "confirmed"
        );
        usdc = tokenAccounts.value.reduce((sum, item) => {
          const tokenAmount = item.account.data.parsed.info.tokenAmount;
          const value = Number(tokenAmount.uiAmountString ?? tokenAmount.uiAmount ?? 0);
          return sum + (Number.isFinite(value) ? value : 0);
        }, 0);
      }

      setState({
        connected: true,
        loading: false,
        sol: lamports / LAMPORTS_PER_SOL,
        usdc,
        usdcMint: usdcMint?.toBase58() ?? null,
        error: usdcMint ? null : "NEXT_PUBLIC_USDC_MINT is not configured."
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Failed to fetch wallet balances.";
      setState((prev) => ({
        ...prev,
        connected: true,
        loading: false,
        error: reason
      }));
    }
  }, [connected, connection, publicKey, usdcMint]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- refresh encapsulates async wallet RPC state synchronization
    void refresh();
  }, [refresh, walletAddress]);

  useEffect(() => {
    if (!connected || !publicKey) {
      return;
    }
    const timer = window.setInterval(() => {
      void refresh();
    }, 15_000);
    return () => window.clearInterval(timer);
  }, [connected, publicKey, refresh, walletAddress]);

  return {
    ...state,
    hasUsdcMint: Boolean(usdcMint),
    refresh
  };
};
