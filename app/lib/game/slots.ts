export interface SlotsInput {
  wager: number;
  activeLines: 1 | 5 | 10 | 20;
  randomness: Uint8Array;
}

export interface SlotsResult {
  grid: number[];
  reelStops: number[];
  winMask: number[];
  payout: number;
}

const STRIPS: number[][] = [
  [0, 1, 2, 3, 4, 5, 6, 7, 1, 2, 0, 3, 5, 7, 4, 2, 1, 6, 3, 0],
  [2, 3, 4, 1, 0, 7, 6, 5, 1, 2, 4, 3, 5, 6, 0, 7, 1, 3, 2, 4],
  [4, 3, 2, 1, 0, 7, 6, 5, 0, 1, 3, 2, 4, 6, 7, 5, 1, 2, 3, 4],
  [6, 5, 4, 3, 2, 1, 0, 7, 3, 4, 2, 1, 0, 6, 5, 7, 2, 3, 4, 1],
  [7, 6, 5, 4, 3, 2, 1, 0, 4, 5, 3, 2, 1, 7, 6, 0, 3, 4, 5, 2]
];

export const LINES: number[][] = [
  [1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0],
  [2, 2, 2, 2, 2],
  [0, 1, 2, 1, 0],
  [2, 1, 0, 1, 2],
  [0, 0, 1, 0, 0],
  [2, 2, 1, 2, 2],
  [1, 0, 1, 2, 1],
  [1, 2, 1, 0, 1],
  [0, 1, 1, 1, 0],
  [2, 1, 1, 1, 2],
  [1, 1, 0, 1, 1],
  [1, 1, 2, 1, 1],
  [0, 2, 0, 2, 0],
  [2, 0, 2, 0, 2],
  [0, 2, 1, 2, 0],
  [2, 0, 1, 0, 2],
  [1, 0, 0, 0, 1],
  [1, 2, 2, 2, 1],
  [0, 1, 0, 1, 0]
];

export const runSlots = (input: SlotsInput): SlotsResult => {
  const reelStops = Array.from({ length: 5 }, (_, reel) => input.randomness[reel] % 20);
  const grid = Array.from({ length: 15 }, () => 0);

  for (let reel = 0; reel < 5; reel += 1) {
    const strip = STRIPS[reel];
    for (let row = 0; row < 3; row += 1) {
      const symbol = strip[(reelStops[reel] + row) % 20];
      grid[row * 5 + reel] = symbol;
    }
  }

  const activeLines = input.activeLines;
  const lineBet = Math.max(1, Math.floor(input.wager / activeLines));
  const winMask = Array.from({ length: 20 }, () => 0);
  let payout = 0;

  for (let i = 0; i < activeLines; i += 1) {
    const line = LINES[i];
    const symbols = line.map((row, reel) => grid[row * 5 + reel]);
    const base = symbols[0];
    let matches = 1;
    for (let reel = 1; reel < 5; reel += 1) {
      if (symbols[reel] === base) matches += 1;
      else break;
    }

    if (matches >= 3) {
      winMask[i] = 1;
      payout += lineBet * lineMultiplier(base, matches);
    }
  }

  return {
    grid,
    reelStops,
    winMask,
    payout
  };
};

const lineMultiplier = (symbol: number, matches: number): number => {
  const base = symbol + 1;
  if (matches === 5) return base * 20;
  if (matches === 4) return base * 5;
  if (matches === 3) return base * 2;
  return 0;
};

