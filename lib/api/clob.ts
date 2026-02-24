import { CLOB_API_URL } from "@/lib/utils/constants";
import type { ClobOrderBook, ClobPriceHistory } from "./types";

export async function fetchOrderBook(tokenId: string): Promise<ClobOrderBook> {
  const res = await fetch(`${CLOB_API_URL}/book?token_id=${tokenId}`);
  if (!res.ok) throw new Error(`CLOB API error: ${res.status}`);
  return res.json();
}

export async function fetchPriceHistory(
  tokenId: string,
  interval: string = "max",
  fidelity: number = 60
): Promise<ClobPriceHistory> {
  const params = new URLSearchParams({
    market: tokenId,
    interval,
    fidelity: String(fidelity),
  });
  const res = await fetch(`${CLOB_API_URL}/prices-history?${params}`);
  if (!res.ok) throw new Error(`CLOB API error: ${res.status}`);
  return res.json();
}

export async function fetchMidpoint(tokenId: string): Promise<{ mid: number }> {
  const res = await fetch(`${CLOB_API_URL}/midpoint?token_id=${tokenId}`);
  if (!res.ok) throw new Error(`CLOB API error: ${res.status}`);
  return res.json();
}

export async function fetchSpread(tokenId: string): Promise<{ spread: number }> {
  const res = await fetch(`${CLOB_API_URL}/spread?token_id=${tokenId}`);
  if (!res.ok) throw new Error(`CLOB API error: ${res.status}`);
  return res.json();
}
