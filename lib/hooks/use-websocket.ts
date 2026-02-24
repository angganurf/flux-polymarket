"use client";

import { useEffect, useRef } from "react";
import { MarketSocket } from "@/lib/websocket/market-socket";
import { useMarketStore } from "@/lib/stores/market-store";

export function useMarketWebSocket(assetIds: string[]) {
  const socketRef = useRef<MarketSocket | null>(null);
  const { updatePrice, setConnectionStatus, connectionStatus } =
    useMarketStore();

  useEffect(() => {
    if (assetIds.length === 0) return;

    const socket = new MarketSocket(
      (messages) => {
        for (const msg of messages) {
          const m = msg as Record<string, unknown>;
          if (
            (m.event_type === "price_change" ||
              m.event_type === "last_trade_price") &&
            typeof m.asset_id === "string" &&
            m.price != null
          ) {
            updatePrice(m.asset_id, parseFloat(m.price as string));
          }
        }
      },
      (status) => {
        setConnectionStatus(status);
      }
    );

    socket.connect();
    socket.subscribe(assetIds);
    socketRef.current = socket;

    return () => {
      socket.destroy();
      socketRef.current = null;
    };
  }, [assetIds.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  return { connectionStatus };
}
