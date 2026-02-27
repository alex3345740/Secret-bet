import { trackTelemetryEvent } from "@/lib/telemetry";

export const trackPlinkoRoundStarted = (roundId: string, wager: number, rows: number, riskLevel: number): void => {
  trackTelemetryEvent({
    name: "round_started",
    game: "plinko",
    roundId,
    wager,
    metadata: {
      rows,
      riskLevel
    }
  });
};

export const trackPlinkoRandomnessRequested = (roundId: string, requestHash: string): void => {
  trackTelemetryEvent({
    name: "randomness_requested",
    game: "plinko",
    roundId,
    metadata: {
      requestHash
    }
  });
};

export const trackPlinkoRoundSettled = (
  roundId: string,
  wager: number,
  payout: number,
  finalBin: number,
  multiplierBps: number
): void => {
  trackTelemetryEvent({
    name: "round_settled",
    game: "plinko",
    roundId,
    wager,
    payout,
    metadata: {
      finalBin,
      multiplierBps
    }
  });
};

export const trackPlinkoRoundFailed = (roundId: string, reason: string): void => {
  trackTelemetryEvent({
    name: "round_failed",
    game: "plinko",
    roundId,
    metadata: {
      reason
    }
  });
};
