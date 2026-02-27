import { trackTelemetryEvent } from "@/lib/telemetry";

export const trackRouletteRoundStarted = (roundId: string, wager: number, betCount: number): void => {
  trackTelemetryEvent({
    name: "round_started",
    game: "roulette",
    roundId,
    wager,
    metadata: {
      betCount
    }
  });
};

export const trackRouletteRandomnessRequested = (roundId: string, requestHash: string): void => {
  trackTelemetryEvent({
    name: "randomness_requested",
    game: "roulette",
    roundId,
    metadata: {
      requestHash
    }
  });
};

export const trackRouletteRoundSettled = (
  roundId: string,
  wager: number,
  payout: number,
  winningPocket: number,
  betCount: number
): void => {
  trackTelemetryEvent({
    name: "round_settled",
    game: "roulette",
    roundId,
    wager,
    payout,
    metadata: {
      winningPocket,
      betCount
    }
  });
};

export const trackRouletteRoundFailed = (roundId: string, reason: string): void => {
  trackTelemetryEvent({
    name: "round_failed",
    game: "roulette",
    roundId,
    metadata: {
      reason
    }
  });
};
