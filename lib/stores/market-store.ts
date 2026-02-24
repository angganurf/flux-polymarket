import { create } from "zustand";

type ConnectionStatus = "connecting" | "connected" | "disconnected";

interface PriceTick {
  price: number;
  timestamp: number;
}

interface MarketPriceState {
  // Real-time prices keyed by asset_id (token ID)
  prices: Record<string, number>;
  // Recent ticks for sparkline (last 50)
  ticks: Record<string, PriceTick[]>;
  // WebSocket connection status
  connectionStatus: ConnectionStatus;
  // Actions
  updatePrice: (assetId: string, price: number) => void;
  setPrice: (tokenId: string, price: number) => void;
  setPrices: (prices: Record<string, number>) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  getPrice: (assetId: string) => number | undefined;
}

export const useMarketStore = create<MarketPriceState>((set, get) => ({
  prices: {},
  ticks: {},
  connectionStatus: "disconnected",

  updatePrice: (assetId, price) =>
    set((state) => {
      const existingTicks = state.ticks[assetId] ?? [];
      const newTick = { price, timestamp: Date.now() };
      // Keep last 50 ticks for sparkline
      const updatedTicks = [...existingTicks.slice(-49), newTick];
      return {
        prices: { ...state.prices, [assetId]: price },
        ticks: { ...state.ticks, [assetId]: updatedTicks },
      };
    }),

  setPrice: (tokenId, price) =>
    set((state) => ({ prices: { ...state.prices, [tokenId]: price } })),

  setPrices: (prices) => set({ prices }),

  setConnectionStatus: (status) => set({ connectionStatus: status }),

  getPrice: (assetId) => get().prices[assetId],
}));
