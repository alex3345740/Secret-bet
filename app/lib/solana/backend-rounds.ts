"use client";

import { AnchorProvider, BN, type Idl, Program } from "@coral-xyz/anchor";
import type { WalletContextState } from "@solana/wallet-adapter-react";
import {
  Connection,
  PublicKey,
  SystemProgram,
  type Transaction
} from "@solana/web3.js";
import { hexToBytes } from "@/lib/crypto";
import type { RouletteBetType } from "@/lib/game/roulette";
import { resolveUsdcMint, SOL_ASSET_MINT, uiAmountToAtomic } from "@/lib/solana/assets";
import plinkoIdl from "@/lib/idl/hidden_bet_plinko.json";
import rouletteIdl from "@/lib/idl/hidden_bet_roulette.json";
import slotsIdl from "@/lib/idl/hidden_bet_slots.json";
import { PROGRAM_IDS, MAGICBLOCK_TEE_RPC } from "@/lib/solana/constants";
import { readPerAuthSession, isPerAuthSessionValid } from "@/lib/per-auth";
import { sha256Hex } from "@/lib/crypto";
import type { AssetSymbol } from "@/lib/types";

const roundIdNow = (): number => Date.now() * 1000 + Math.floor(Math.random() * 1000);

export const makeOnChainRoundId = roundIdNow;

type AnchorWallet = {
  publicKey: PublicKey;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
};

type SubmitBaseArgs = {
  connection: Connection;
  wallet: WalletContextState;
  roundId: number;
  asset: AssetSymbol;
  betCommitmentHash: string;
  privatePayloadHash: string;
};

type PlinkoSubmitArgs = SubmitBaseArgs & {
  wager: number;
  rows: 8 | 12 | 16;
  riskLevel: 0 | 1 | 2;
};

type RouletteSubmitArgs = SubmitBaseArgs & {
  bets: Array<{ type: RouletteBetType; value: number; stake: number }>;
};

type SlotsSubmitArgs = SubmitBaseArgs & {
  wager: number;
  paylines: 1 | 5 | 10 | 20;
};

type SubmitResult = {
  roundPda: string;
  createSignature: string;
  lockSignature: string;
};

const ROULETTE_TYPE_MAP: Record<RouletteBetType, number> = {
  straight: 0,
  color: 1,
  parity: 2,
  range: 3,
  dozen: 4
};

const ensureWallet = (wallet: WalletContextState): AnchorWallet => {
  if (!wallet.publicKey || !wallet.signTransaction) {
    throw new Error("Connect a wallet that supports transaction signing.");
  }

  return {
    publicKey: wallet.publicKey,
    signTransaction: wallet.signTransaction,
    signAllTransactions:
      wallet.signAllTransactions ??
      (async (transactions: Transaction[]) =>
        Promise.all(transactions.map((transaction) => wallet.signTransaction!(transaction))))
  };
};

const makeProvider = (connection: Connection, wallet: WalletContextState): AnchorProvider =>
  new AnchorProvider(resolvePrivateConnection(connection), ensureWallet(wallet), {
    commitment: "confirmed",
    preflightCommitment: "confirmed"
  });

const resolvePrivateConnection = (fallbackConnection: Connection): Connection => {
  const session = readPerAuthSession();
  if (session && isPerAuthSessionValid(session)) {
    return new Connection(session.endpoint, "confirmed");
  }

  const fallbackEndpoint = MAGICBLOCK_TEE_RPC.trim();
  if (fallbackEndpoint.length > 0) {
    return new Connection(fallbackEndpoint, "confirmed");
  }

  return fallbackConnection;
};

const toLe8 = (value: BN): Buffer => value.toArrayLike(Buffer, "le", 8);

const toBytes32 = (hex: string): number[] => {
  const normalized = hex.startsWith("0x") ? hex.slice(2) : hex;
  const bytes = hexToBytes(normalized);
  if (bytes.length !== 32) {
    throw new Error("Expected a 32-byte hex value.");
  }
  return Array.from(bytes);
};

const toCommitmentBytes = async (payload: unknown): Promise<number[]> =>
  toBytes32(await sha256Hex(typeof payload === "string" ? payload : JSON.stringify(payload)));

const resolveAssetMint = (asset: AssetSymbol): PublicKey => {
  if (asset === "SOL") {
    return SOL_ASSET_MINT;
  }
  const mint = resolveUsdcMint();
  if (!mint) {
    throw new Error("USDC mint is not configured. Set NEXT_PUBLIC_USDC_MINT.");
  }
  return mint;
};

const toAmount = (asset: AssetSymbol, uiAmount: number): BN => {
  const atomic = uiAmountToAtomic(asset, uiAmount);
  if (atomic <= 0n) {
    throw new Error("Wager must be greater than zero.");
  }
  return new BN(atomic.toString());
};

export const submitPlinkoRound = async (args: PlinkoSubmitArgs): Promise<SubmitResult> => {
  const provider = makeProvider(args.connection, args.wallet);
  const program = new Program(plinkoIdl as Idl, provider);
  const player = provider.wallet.publicKey;
  const roundId = new BN(args.roundId);
  const assetMint = resolveAssetMint(args.asset);
  const wagerAtomic = toAmount(args.asset, args.wager).toString();
  const configCommitment = await toCommitmentBytes({
    game: "plinko",
    roundId: args.roundId,
    assetMint: assetMint.toBase58(),
    wagerAtomic,
    rows: args.rows,
    riskLevel: args.riskLevel
  });
  const round = PublicKey.findProgramAddressSync(
    [Buffer.from("plinko_round"), player.toBuffer(), toLe8(roundId)],
    PROGRAM_IDS.plinko
  )[0];

  const createSignature = await program.methods
    .createRoundPlinko({
      roundId,
      configCommitment
    })
    .accounts({
      player,
      round,
      systemProgram: SystemProgram.programId
    })
    .rpc();

  const lockSignature = await program.methods
    .placePrivateBetPlinko({
      betCommitment: toBytes32(args.betCommitmentHash),
      privatePayloadHash: toBytes32(args.privatePayloadHash)
    })
    .accounts({
      player,
      round
    })
    .rpc();

  return {
    roundPda: round.toBase58(),
    createSignature,
    lockSignature
  };
};

export const submitRouletteRound = async (args: RouletteSubmitArgs): Promise<SubmitResult> => {
  if (args.bets.length === 0) {
    throw new Error("Add at least one roulette bet before spinning.");
  }

  const provider = makeProvider(args.connection, args.wallet);
  const program = new Program(rouletteIdl as Idl, provider);
  const player = provider.wallet.publicKey;
  const roundId = new BN(args.roundId);
  const assetMint = resolveAssetMint(args.asset);
  const normalizedBets = args.bets.map((bet) => ({
    betType: ROULETTE_TYPE_MAP[bet.type],
    value: Math.max(0, Math.min(255, Math.floor(bet.value))),
    stakeAtomic: toAmount(args.asset, bet.stake).toString()
  }));
  if (normalizedBets.length > 255) {
    throw new Error("Roulette supports up to 255 bets per round.");
  }
  const totalStakeAtomic = normalizedBets.reduce((sum, bet) => sum + BigInt(bet.stakeAtomic), 0n).toString();
  const configCommitment = await toCommitmentBytes({
    game: "roulette",
    roundId: args.roundId,
    assetMint: assetMint.toBase58(),
    totalStakeAtomic,
    betCount: normalizedBets.length
  });
  const boardCommitment = await toCommitmentBytes({
    game: "roulette-board",
    bets: normalizedBets
  });
  const round = PublicKey.findProgramAddressSync(
    [Buffer.from("roulette_round"), player.toBuffer(), toLe8(roundId)],
    PROGRAM_IDS.roulette
  )[0];

  const createSignature = await program.methods
    .createRoundRoulette({
      roundId,
      configCommitment
    })
    .accounts({
      player,
      round,
      systemProgram: SystemProgram.programId
    })
    .rpc();

  const lockSignature = await program.methods
    .placePrivateBetRoulette({
      betCommitment: toBytes32(args.betCommitmentHash),
      privatePayloadHash: toBytes32(args.privatePayloadHash),
      boardCommitment
    })
    .accounts({
      player,
      round
    })
    .rpc();

  return {
    roundPda: round.toBase58(),
    createSignature,
    lockSignature
  };
};

export const submitSlotsRound = async (args: SlotsSubmitArgs): Promise<SubmitResult> => {
  const provider = makeProvider(args.connection, args.wallet);
  const program = new Program(slotsIdl as Idl, provider);
  const player = provider.wallet.publicKey;
  const roundId = new BN(args.roundId);
  const assetMint = resolveAssetMint(args.asset);
  const wagerAtomic = toAmount(args.asset, args.wager).toString();
  const configCommitment = await toCommitmentBytes({
    game: "slots",
    roundId: args.roundId,
    assetMint: assetMint.toBase58(),
    wagerAtomic,
    paylines: args.paylines
  });
  const reelCommitment = await toCommitmentBytes({
    game: "slots-reels",
    columns: 5,
    rows: 3,
    paylines: args.paylines
  });
  const round = PublicKey.findProgramAddressSync(
    [Buffer.from("slots_round"), player.toBuffer(), toLe8(roundId)],
    PROGRAM_IDS.slots
  )[0];

  const createSignature = await program.methods
    .createRoundSlots({
      roundId,
      configCommitment
    })
    .accounts({
      player,
      round,
      systemProgram: SystemProgram.programId
    })
    .rpc();

  const lockSignature = await program.methods
    .placePrivateBetSlots({
      betCommitment: toBytes32(args.betCommitmentHash),
      privatePayloadHash: toBytes32(args.privatePayloadHash),
      reelCommitment
    })
    .accounts({
      player,
      round
    })
    .rpc();

  return {
    roundPda: round.toBase58(),
    createSignature,
    lockSignature
  };
};
