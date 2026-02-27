import type { GameType } from "@/lib/types";

export type TelemetryEventName =
  | "round_started"
  | "randomness_requested"
  | "round_settled"
  | "round_failed";

export interface TelemetryEvent {
  id: string;
  name: TelemetryEventName;
  game: GameType;
  roundId: string;
  timestampMs: number;
  wager?: number;
  payout?: number;
  wallet?: string;
  metadata?: Record<string, string | number | boolean>;
}

const TELEMETRY_STORAGE_KEY = "hidden-bet-telemetry-events";
const MAX_TELEMETRY_EVENTS = 500;

const nextEventId = (): string =>
  `${Date.now()}-${Math.floor(Math.random() * 1_000_000).toString().padStart(6, "0")}`;

const canUseStorage = (): boolean => typeof window !== "undefined";

const parseStored = (input: string): TelemetryEvent[] => {
  try {
    const parsed = JSON.parse(input) as TelemetryEvent[];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(
      (event) =>
        typeof event?.id === "string" &&
        typeof event?.name === "string" &&
        typeof event?.game === "string" &&
        typeof event?.roundId === "string" &&
        typeof event?.timestampMs === "number"
    );
  } catch {
    return [];
  }
};

export const readTelemetryEvents = (): TelemetryEvent[] => {
  if (!canUseStorage()) {
    return [];
  }
  const raw = window.localStorage.getItem(TELEMETRY_STORAGE_KEY);
  if (!raw) {
    return [];
  }
  return parseStored(raw);
};

export const clearTelemetryEvents = (): void => {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.removeItem(TELEMETRY_STORAGE_KEY);
};

export const trackTelemetryEvent = (
  event: Omit<TelemetryEvent, "id" | "timestampMs">
): TelemetryEvent => {
  const payload: TelemetryEvent = {
    ...event,
    id: nextEventId(),
    timestampMs: Date.now()
  };

  if (canUseStorage()) {
    const next = [payload, ...readTelemetryEvents()].slice(0, MAX_TELEMETRY_EVENTS);
    window.localStorage.setItem(TELEMETRY_STORAGE_KEY, JSON.stringify(next));
  }

  if (typeof console !== "undefined") {
    console.debug("[hidden-bet:telemetry]", payload);
  }

  return payload;
};
