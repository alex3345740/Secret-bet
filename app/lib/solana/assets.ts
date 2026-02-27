import { PublicKey, SystemProgram } from "@solana/web3.js";
import type { AssetSymbol } from "@/lib/types";
import { SOLANA_CLUSTER } from "@/lib/solana/constants";

const DEVNET_USDC_MINT = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
const SOL_FACTOR = 1_000_000_000;
const USDC_FACTOR = 1_000_000;

export const SOL_ASSET_MINT = SystemProgram.programId;

export const NEXT_PUBLIC_USDC_MINT =
  process.env.NEXT_PUBLIC_USDC_MINT?.trim() ||
  (SOLANA_CLUSTER === "devnet" ? DEVNET_USDC_MINT : "");

export const resolveUsdcMint = (): PublicKey | null => {
  if (!NEXT_PUBLIC_USDC_MINT) {
    return null;
  }
  try {
    return new PublicKey(NEXT_PUBLIC_USDC_MINT);
  } catch {
    return null;
  }
};

export const assetUiFactor = (asset: AssetSymbol): number =>
  asset === "SOL" ? SOL_FACTOR : USDC_FACTOR;

export const uiAmountToAtomic = (asset: AssetSymbol, uiAmount: number): bigint => {
  if (!Number.isFinite(uiAmount) || uiAmount <= 0) {
    return 0n;
  }
  return BigInt(Math.round(uiAmount * assetUiFactor(asset)));
};
