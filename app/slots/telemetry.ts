import { trackTelemetryEvent } from "@/lib/telemetry";

export const trackSlotsRoundStarted = (roundId: string, wager: number, activeLines: number): void => {
  trackTelemetryEvent({
    name: "round_started",
    game: "slots",
    roundId,
    wager,
    metadata: {
      activeLines
    }
  });
};

export const trackSlotsRandomnessRequested = (roundId: string, requestHash: string): void => {
  trackTelemetryEvent({
    name: "randomness_requested",
    game: "slots",
    roundId,
    metadata: {
      requestHash
    }
  });
};

export const trackSlotsRoundSettled = (
  roundId: string,
  wager: number,
  payout: number,
  wins: number,
  activeLines: number
): void => {
  trackTelemetryEvent({
    name: "round_settled",
    game: "slots",
    roundId,
    wager,
    payout,
    metadata: {
      wins,
      activeLines
    }
  });
};

export const trackSlotsRoundFailed = (roundId: string, reason: string): void => {
  trackTelemetryEvent({
    name: "round_failed",
    game: "slots",
    roundId,
    metadata: {
      reason
    }
  });
};
