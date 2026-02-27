const toHex = (buffer: Uint8Array): string =>
  Array.from(buffer)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

const fromHex = (hex: string): Uint8Array =>
  new Uint8Array(
    hex.match(/.{1,2}/g)?.map((pair) => Number.parseInt(pair, 16)) ?? []
  );

export const randomBytes = (length = 32): Uint8Array => {
  const bytes = new Uint8Array(length);
  const provider = globalThis.crypto;
  if (provider && "getRandomValues" in provider) {
    provider.getRandomValues(bytes);
    return bytes;
  }
  throw new Error("No secure random provider available");
};

export const sha256Hex = async (value: string): Promise<string> => {
  const provider = globalThis.crypto;
  if (provider && "subtle" in provider) {
    const data = new TextEncoder().encode(value);
    const digest = await provider.subtle.digest("SHA-256", data);
    return toHex(new Uint8Array(digest));
  }
  throw new Error("No secure digest provider available");
};

export const bytesToHex = toHex;
export const hexToBytes = fromHex;
