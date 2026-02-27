export interface PlinkoInput {
  wager: number;
  rows: 8 | 12 | 16;
  riskLevel: 0 | 1 | 2;
  randomness: Uint8Array;
}

export interface PlinkoResult {
  path: number[];
  finalBin: number;
  multiplierBps: number;
  payout: number;
}

const TABLES: Record<string, number[]> = {
  "8-0": [20, 40, 80, 140, 200, 140, 80, 40, 20],
  "8-1": [10, 30, 70, 160, 260, 160, 70, 30, 10],
  "8-2": [5, 10, 40, 140, 420, 140, 40, 10, 5],
  "12-0": [10, 20, 30, 50, 80, 120, 160, 120, 80, 50, 30, 20, 10],
  "12-1": [5, 10, 20, 40, 80, 160, 260, 160, 80, 40, 20, 10, 5],
  "12-2": [2, 5, 10, 20, 70, 180, 460, 180, 70, 20, 10, 5, 2],
  "16-0": [5, 10, 15, 20, 30, 50, 80, 120, 160, 120, 80, 50, 30, 20, 15, 10, 5],
  "16-1": [2, 5, 10, 15, 25, 50, 90, 150, 240, 150, 90, 50, 25, 15, 10, 5, 2],
  "16-2": [1, 2, 5, 10, 15, 30, 80, 170, 520, 170, 80, 30, 15, 10, 5, 2, 1]
};

export const runPlinko = (input: PlinkoInput): PlinkoResult => {
  const path = Array.from({ length: input.rows }, (_, i) => input.randomness[i] & 1);
  const finalBin = path.reduce((sum, step) => sum + step, 0);
  const table = TABLES[`${input.rows}-${input.riskLevel}`];
  const multiplierBps = table[finalBin] ?? 0;
  const payout = Math.floor((input.wager * multiplierBps) / 10_000);

  return {
    path,
    finalBin,
    multiplierBps,
    payout
  };
};

