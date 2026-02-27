import type { GameConfig } from "@/lib/types";

export const GAME_CONFIGS: GameConfig[] = [
  { game: "plinko", minWager: 0.0001, maxWager: 25, timeoutMs: 45_000 },
  { game: "roulette", minWager: 0.0001, maxWager: 50, timeoutMs: 60_000 },
  { game: "slots", minWager: 0.0001, maxWager: 25, timeoutMs: 45_000 }
];

