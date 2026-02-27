export type GameType = "plinko" | "roulette" | "slots";
export type AssetSymbol = "SOL" | "USDC";

export type TxLifecycleState =
  | "disconnected"
  | "initializing"
  | "pending"
  | "settled"
  | "failed";

export interface FairnessProofView {
  requestHash: string;
  randomnessHash: string;
  clientSeed: string;
  revealedRandomness: string;
  callbackSignerRef: string;
}

export interface SettlementView {
  roundId: string;
  game: GameType;
  wager: number;
  payout: number;
  net: number;
  settledAt: number;
}

export interface RoundStatus {
  roundId: string;
  game: GameType;
  status:
    | "Created"
    | "BetLocked"
    | "RandomnessPending"
    | "RandomnessDelivered"
    | "Resolved"
    | "Settled"
    | "Failed";
}

export interface RoundRecord {
  settlement: SettlementView;
  fairness: FairnessProofView;
  details: Record<string, string | number | boolean>;
}

export interface BetInput {
  game: GameType;
  asset: AssetSymbol;
  wager: number;
  params: Record<string, string | number | boolean>;
}

export interface GameConfig {
  game: GameType;
  minWager: number;
  maxWager: number;
  timeoutMs: number;
}

