import { PublicKey } from "@solana/web3.js";

export const SOLANA_CLUSTER = process.env.NEXT_PUBLIC_SOLANA_CLUSTER ?? "localnet";
export const MAGICBLOCK_ROUTER_RPC =
  process.env.NEXT_PUBLIC_MAGICBLOCK_ROUTER_RPC ?? "http://127.0.0.1:7799";
export const MAGICBLOCK_ROUTER_WS =
  process.env.NEXT_PUBLIC_MAGICBLOCK_ROUTER_WS ?? "ws://127.0.0.1:7800";
export const MAGICBLOCK_PER_RPC =
  process.env.NEXT_PUBLIC_MAGICBLOCK_PER_RPC ?? "http://127.0.0.1:7799";
export const MAGICBLOCK_PER_AUTH_MODE =
  process.env.NEXT_PUBLIC_MAGICBLOCK_PER_AUTH_MODE ?? "local";
export const MAGICBLOCK_TEE_RPC =
  process.env.NEXT_PUBLIC_MAGICBLOCK_TEE_RPC ?? "http://127.0.0.1:7799";

export const PROGRAM_IDS = {
  core: new PublicKey("2DVDuGDWRMhwvSPcyCWz5sAft2T1Dt1tgQio6cUgNDVh"),
  plinko: new PublicKey("Ao5MS1NuDFYxfMoSmYrY6iSpJ343t35j1XnbKiaSEzs"),
  roulette: new PublicKey("iFTY1vz8n1c24Sb9EWXkvzYJFsSH7yvdaYYsbE5MGcD"),
  slots: new PublicKey("4bJWKYAfAjuQDCHxxn57bXfq44jawFUwc7W16zKYgUXj")
} as const;
