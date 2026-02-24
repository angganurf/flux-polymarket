import { WS_MARKET_URL } from "@/lib/utils/constants";

type ConnectionStatus = "connecting" | "connected" | "disconnected";
type MessageHandler = (messages: unknown[]) => void;
type StatusHandler = (status: ConnectionStatus) => void;

export class MarketSocket {
  private ws: WebSocket | null = null;
  private assetIds: Set<string> = new Set();
  private onMessage: MessageHandler;
  private onStatusChange: StatusHandler;
  private reconnectAttempts = 0;
  private maxReconnectDelay = 30000;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private isDestroyed = false;

  constructor(onMessage: MessageHandler, onStatusChange: StatusHandler) {
    this.onMessage = onMessage;
    this.onStatusChange = onStatusChange;
  }

  connect() {
    if (this.isDestroyed) return;
    this.cleanup();
    this.onStatusChange("connecting");

    try {
      this.ws = new WebSocket(WS_MARKET_URL);
    } catch {
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.onStatusChange("connected");
      this.startPing();
      if (this.assetIds.size > 0) {
        this.sendSubscription(Array.from(this.assetIds));
      }
    };

    this.ws.onmessage = (event) => {
      const data = event.data;
      if (data === "PONG") return;
      try {
        const parsed = JSON.parse(data);
        const messages = Array.isArray(parsed) ? parsed : [parsed];
        this.onMessage(messages);
      } catch {
        // ignore non-JSON messages
      }
    };

    this.ws.onclose = () => {
      this.onStatusChange("disconnected");
      this.stopPing();
      if (!this.isDestroyed) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  subscribe(assetIds: string[]) {
    const newIds = assetIds.filter((id) => !this.assetIds.has(id));
    if (newIds.length === 0) return;
    newIds.forEach((id) => this.assetIds.add(id));
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.sendSubscription(newIds);
    }
  }

  unsubscribe(assetIds: string[]) {
    assetIds.forEach((id) => this.assetIds.delete(id));
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          assets_ids: assetIds,
          operation: "unsubscribe",
        })
      );
    }
  }

  destroy() {
    this.isDestroyed = true;
    this.cleanup();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.assetIds.clear();
  }

  private sendSubscription(assetIds: string[]) {
    if (this.ws?.readyState !== WebSocket.OPEN) return;
    this.ws.send(
      JSON.stringify({
        assets_ids: assetIds,
        type: "market",
        custom_feature_enabled: true,
      })
    );
  }

  private startPing() {
    this.stopPing();
    this.pingTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send("PING");
      }
    }, 10000);
  }

  private stopPing() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private scheduleReconnect() {
    if (this.isDestroyed) return;
    const delay = Math.min(
      1000 * Math.pow(2, this.reconnectAttempts),
      this.maxReconnectDelay
    );
    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => this.connect(), delay);
  }

  private cleanup() {
    this.stopPing();
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      if (
        this.ws.readyState === WebSocket.OPEN ||
        this.ws.readyState === WebSocket.CONNECTING
      ) {
        this.ws.close();
      }
      this.ws = null;
    }
  }
}
