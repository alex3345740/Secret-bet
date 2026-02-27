import type { PublicKey } from "@solana/web3.js";
import { bytesToHex, randomBytes, sha256Hex } from "@/lib/crypto";
import {
  MAGICBLOCK_PER_AUTH_MODE,
  MAGICBLOCK_PER_RPC,
  MAGICBLOCK_TEE_RPC,
  SOLANA_CLUSTER
} from "@/lib/solana/constants";

const PER_AUTH_STORAGE_KEY = "hidden-bet-per-auth-session";
const DEFAULT_AUTH_TTL_MS = 15 * 60 * 1000;

export type PerAuthState = "idle" | "authorizing" | "authorized" | "expired" | "error";

export interface PerAuthSession {
  token: string;
  endpoint: string;
  wallet: string;
  challenge: string;
  signature: string;
  issuedAtMs: number;
  expiresAtMs: number;
  mode: string;
}

type RequestPerAuthSessionArgs = {
  publicKey: PublicKey;
  signMessage?: (message: Uint8Array) => Promise<Uint8Array>;
};

const now = (): number => Date.now();

const serialize = (session: PerAuthSession): string => JSON.stringify(session);

const deserialize = (input: string): PerAuthSession | null => {
  try {
    const parsed = JSON.parse(input) as Partial<PerAuthSession>;
    if (
      typeof parsed.token !== "string" ||
      typeof parsed.endpoint !== "string" ||
      typeof parsed.wallet !== "string" ||
      typeof parsed.challenge !== "string" ||
      typeof parsed.signature !== "string" ||
      typeof parsed.issuedAtMs !== "number" ||
      typeof parsed.expiresAtMs !== "number" ||
      typeof parsed.mode !== "string"
    ) {
      return null;
    }
    return parsed as PerAuthSession;
  } catch {
    return null;
  }
};

const encodeBase64 = (bytes: Uint8Array): string => {
  if (typeof window !== "undefined" && typeof window.btoa === "function") {
    let binary = "";
    for (const byte of bytes) {
      binary += String.fromCharCode(byte);
    }
    return window.btoa(binary);
  }

  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }

  throw new Error("No base64 encoder available");
};

export const buildPerAuthChallenge = (wallet: string): string =>
  [
    "Hidden Bet PER Authentication",
    `wallet=${wallet}`,
    `cluster=${SOLANA_CLUSTER}`,
    `mode=${MAGICBLOCK_PER_AUTH_MODE}`,
    `nonce=${bytesToHex(randomBytes(16))}`,
    `timestamp=${new Date().toISOString()}`
  ].join("\n");

export const buildPerTeeEndpoint = (token: string): string =>
  `${MAGICBLOCK_TEE_RPC}?token=${encodeURIComponent(token)}`;

export const readPerAuthSession = (): PerAuthSession | null => {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = window.sessionStorage.getItem(PER_AUTH_STORAGE_KEY);
  if (!raw) {
    return null;
  }
  return deserialize(raw);
};

export const writePerAuthSession = (session: PerAuthSession | null): void => {
  if (typeof window === "undefined") {
    return;
  }
  if (!session) {
    window.sessionStorage.removeItem(PER_AUTH_STORAGE_KEY);
    return;
  }
  window.sessionStorage.setItem(PER_AUTH_STORAGE_KEY, serialize(session));
};

export const clearPerAuthSession = (): void => writePerAuthSession(null);

export const isPerAuthSessionValid = (session: PerAuthSession | null): boolean =>
  Boolean(session && session.expiresAtMs > now());

const createDevSession = async (
  wallet: string,
  challenge: string,
  signature: string
): Promise<PerAuthSession> => {
  const tokenSeed = await sha256Hex(`${wallet}:${challenge}:${signature}:${MAGICBLOCK_PER_RPC}`);
  const issuedAtMs = now();
  const expiresAtMs = issuedAtMs + DEFAULT_AUTH_TTL_MS;
  const token = `dev_${tokenSeed}`;
  return {
    token,
    endpoint: buildPerTeeEndpoint(token),
    wallet,
    challenge,
    signature,
    issuedAtMs,
    expiresAtMs,
    mode: MAGICBLOCK_PER_AUTH_MODE
  };
};

const createRemoteSession = async (
  wallet: string,
  challenge: string,
  signature: string
): Promise<PerAuthSession> => {
  const authEndpoint = `${MAGICBLOCK_PER_RPC.replace(/\/$/, "")}/auth/login`;
  const response = await fetch(authEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      pubkey: wallet,
      challenge,
      signature,
      cluster: SOLANA_CLUSTER
    })
  });

  if (!response.ok) {
    throw new Error(`PER auth request failed (${response.status})`);
  }

  const payload = (await response.json()) as {
    token?: string;
    authToken?: string;
    expiresAtMs?: number;
    expiresAt?: string;
  };

  const token = payload.token ?? payload.authToken;
  if (!token) {
    throw new Error("PER auth response did not include a token");
  }

  const issuedAtMs = now();
  const expiresAtMs =
    payload.expiresAtMs ??
    (payload.expiresAt ? Number(new Date(payload.expiresAt).getTime()) : issuedAtMs + DEFAULT_AUTH_TTL_MS);

  return {
    token,
    endpoint: buildPerTeeEndpoint(token),
    wallet,
    challenge,
    signature,
    issuedAtMs,
    expiresAtMs,
    mode: MAGICBLOCK_PER_AUTH_MODE
  };
};

const fetchRemoteChallenge = async (wallet: string): Promise<string> => {
  const challengeEndpoint = `${MAGICBLOCK_PER_RPC.replace(
    /\/$/,
    ""
  )}/auth/challenge?pubkey=${encodeURIComponent(wallet)}`;
  const response = await fetch(challengeEndpoint);
  if (!response.ok) {
    throw new Error(`PER challenge request failed (${response.status})`);
  }
  const payload = (await response.json()) as {
    challenge?: string;
    nonce?: string;
    timestamp?: number;
  };
  if (typeof payload.challenge !== "string" || payload.challenge.length === 0) {
    throw new Error("PER challenge response did not include challenge text");
  }
  return payload.challenge;
};

export const requestPerAuthSession = async ({
  publicKey,
  signMessage
}: RequestPerAuthSessionArgs): Promise<PerAuthSession> => {
  if (!signMessage) {
    throw new Error("Wallet does not support signMessage for PER authentication");
  }

  const wallet = publicKey.toBase58();
  const mode = MAGICBLOCK_PER_AUTH_MODE.toLowerCase();
  const challenge =
    mode === "dev" || mode === "mock" || mode === "local"
      ? buildPerAuthChallenge(wallet)
      : await fetchRemoteChallenge(wallet);
  const signatureBytes = await signMessage(new TextEncoder().encode(challenge));
  const signature = encodeBase64(signatureBytes);

  const session =
    mode === "dev" || mode === "mock" || mode === "local"
      ? await createDevSession(wallet, challenge, signature)
      : await createRemoteSession(wallet, challenge, signature);

  writePerAuthSession(session);
  return session;
};
