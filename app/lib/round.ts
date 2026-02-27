import { bytesToHex, randomBytes, sha256Hex } from "@/lib/crypto";
import type { FairnessProofView, GameType, RoundRecord } from "@/lib/types";

export const makeRoundId = (game: GameType): string =>
  `${game}-${Date.now()}-${Math.floor(Math.random() * 10_000)}`;

export const buildFairnessTrace = async (
  roundId: string,
  game: GameType
): Promise<{ randomness: Uint8Array; fairness: FairnessProofView }> => {
  const clientSeed = bytesToHex(randomBytes(16));
  const randomness = randomBytes(32);
  const revealedRandomness = bytesToHex(randomness);

  const requestHash = await sha256Hex(`${game}:${roundId}:${clientSeed}`);
  const randomnessHash = await sha256Hex(revealedRandomness);

  return {
    randomness,
    fairness: {
      requestHash,
      randomnessHash,
      clientSeed,
      revealedRandomness,
      callbackSignerRef: "ephemeral_vrf_sdk::consts::VRF_PROGRAM_IDENTITY"
    }
  };
};

export const roundToRecord = (
  roundId: string,
  game: GameType,
  wager: number,
  payout: number,
  fairness: FairnessProofView,
  details: RoundRecord["details"]
): RoundRecord => {
  const settledAt = Date.now();
  return {
    settlement: {
      roundId,
      game,
      wager,
      payout,
      net: payout - wager,
      settledAt
    },
    fairness,
    details
  };
};

