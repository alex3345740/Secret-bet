export type RouletteBetType = "straight" | "color" | "parity" | "range" | "dozen";

export interface RouletteBet {
  type: RouletteBetType;
  value: number;
  stake: number;
}

export interface RouletteResult {
  winningPocket: number;
  payout: number;
}

const RED = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);

export const evaluateRoulette = (
  winningPocket: number,
  bets: RouletteBet[]
): RouletteResult => {
  const payout = bets.reduce((total, bet) => total + evaluateBet(winningPocket, bet), 0);
  return { winningPocket, payout };
};

const evaluateBet = (winningPocket: number, bet: RouletteBet): number => {
  switch (bet.type) {
    case "straight":
      return bet.value === winningPocket ? bet.stake * 36 : 0;
    case "color":
      if (winningPocket === 0) return 0;
      return (RED.has(winningPocket) === (bet.value === 0)) ? bet.stake * 2 : 0;
    case "parity":
      if (winningPocket === 0) return 0;
      return ((winningPocket % 2 === 0) === (bet.value === 0)) ? bet.stake * 2 : 0;
    case "range":
      return (bet.value === 0 && winningPocket >= 1 && winningPocket <= 18) ||
        (bet.value === 1 && winningPocket >= 19 && winningPocket <= 36)
        ? bet.stake * 2
        : 0;
    case "dozen":
      return (bet.value === 0 && winningPocket >= 1 && winningPocket <= 12) ||
        (bet.value === 1 && winningPocket >= 13 && winningPocket <= 24) ||
        (bet.value === 2 && winningPocket >= 25 && winningPocket <= 36)
        ? bet.stake * 3
        : 0;
    default:
      return 0;
  }
};

