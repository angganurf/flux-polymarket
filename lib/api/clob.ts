import type { ClobOrderBook, ClobPriceHistory } from "./types";
import { clobUrl } from "./fetch-helper";

export async function fetchOrderBook(tokenId: string): Promise<ClobOrderBook> {
  const res = await fetch(clobUrl("/book", `token_id=${tokenId}`));
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
  const res = await fetch(clobUrl("/prices-history", params.toString()));
  if (!res.ok) throw new Error(`CLOB API error: ${res.status}`);
  return res.json();
}

export async function fetchMidpoint(tokenId: string): Promise<{ mid: number }> {
  const res = await fetch(clobUrl("/midpoint", `token_id=${tokenId}`));
  if (!res.ok) throw new Error(`CLOB API error: ${res.status}`);
  return res.json();
}

export async function fetchSpread(tokenId: string): Promise<{ spread: number }> {
  const res = await fetch(clobUrl("/spread", `token_id=${tokenId}`));
  if (!res.ok) throw new Error(`CLOB API error: ${res.status}`);
  return res.json();
}
