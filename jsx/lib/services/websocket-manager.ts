import { WebsocketMessage } from '../models/websocket';

type MessageHandler = (message: WebsocketMessage<any>) => void;
type ConnectionStateHandler = (state: { isConnected: boolean; error?: string }) => void;

export interface StoredMessage {
  id: string;
  type: string;
  content: string;
  timestamp: Date;
  metadata?: any;
}

export interface SessionMessages {
  [sessionKey: string]: StoredMessage[];
}

class WebSocketManager {
  private static instance: WebSocketManager;
  private ws: WebSocket | null = null;
  private messageHandlers: Set<MessageHandler> = new Set();
  private connectionStateHandlers: Set<ConnectionStateHandler> = new Set();
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private url: string | null = null;
  private isIntentionalDisconnect = false;
  private sessionMessages: SessionMessages = {};
  private currentSessionKey: string | null = null;

  private constructor() {}

  static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  connect(url: string) {
    this.url = url;
    this.isIntentionalDisconnect = false;
    
    // If already connected to the same URL, just notify handlers
    if (this.ws?.readyState === WebSocket.OPEN && this.url === url) {
      console.log("WebSocket already connected to", url);
      this.notifyConnectionState({ isConnected: true });
      return;
    }
    
    // If connecting, wait for it to complete
    if (this.ws?.readyState === WebSocket.CONNECTING) {
      console.log("WebSocket already connecting, skipping...");
      return;
    }

    console.log("Creating singleton WebSocket connection...");
    this.createConnection();
  }

  private createConnection() {
    if (!this.url) return;

    try {
      this.ws = new WebSocket(this.url);
      
      this.ws.onopen = () => {
        console.log("WebSocket connected");
        this.reconnectAttempts = 0;
        this.notifyConnectionState({ isConnected: true });
      };

      this.ws.onmessage = (event) => {
        try {
          console.log('[WebSocket] Received raw:', event.data);
          const message = JSON.parse(event.data);
          console.log('[WebSocket] Parsed message:', message);
          this.notifyMessageHandlers(message);
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      };

      this.ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        this.notifyConnectionState({ isConnected: false, error: "Connection error" });
      };

      this.ws.onclose = () => {
        console.log("WebSocket closed");
        this.ws = null;
        this.notifyConnectionState({ isConnected: false });
        
        if (!this.isIntentionalDisconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      };
    } catch (error) {
      console.error("Failed to create WebSocket:", error);
      this.notifyConnectionState({ 
        isConnected: false, 
        error: error instanceof Error ? error.message : "Failed to connect" 
      });
    }
  }

  private scheduleReconnect() {
    this.reconnectAttempts++;
    const delay = Math.min(3000 * Math.pow(2, this.reconnectAttempts), 60000);
    
    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    this.reconnectTimer = setTimeout(() => {
      this.createConnection();
    }, delay);
  }

  disconnect() {
    this.isIntentionalDisconnect = true;
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(message: any) {
    console.log('[WebSocket] Attempting to send:', message);
    if (this.ws?.readyState === WebSocket.OPEN) {
      const jsonMessage = JSON.stringify(message);
      console.log('[WebSocket] Sending JSON:', jsonMessage);
      this.ws.send(jsonMessage);
    } else {
      console.warn("WebSocket not connected, cannot send message. ReadyState:", this.ws?.readyState);
    }
  }

  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => {
      this.messageHandlers.delete(handler);
    };
  }

  onConnectionStateChange(handler: ConnectionStateHandler): () => void {
    this.connectionStateHandlers.add(handler);
    // Immediately notify the current state
    handler({ isConnected: this.ws?.readyState === WebSocket.OPEN });
    return () => {
      this.connectionStateHandlers.delete(handler);
    };
  }

  private notifyMessageHandlers(message: WebsocketMessage<any>) {
    this.messageHandlers.forEach(handler => {
      try {
        handler(message);
      } catch (error) {
        console.error("Error in message handler:", error);
      }
    });
  }

  private notifyConnectionState(state: { isConnected: boolean; error?: string }) {
    this.connectionStateHandlers.forEach(handler => {
      try {
        handler(state);
      } catch (error) {
        console.error("Error in connection state handler:", error);
      }
    });
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  setCurrentSession(sessionKey: string) {
    this.currentSessionKey = sessionKey;
    if (!this.sessionMessages[sessionKey]) {
      this.sessionMessages[sessionKey] = [];
    }
  }

  addMessage(message: StoredMessage) {
    if (!this.currentSessionKey) return;
    
    if (!this.sessionMessages[this.currentSessionKey]) {
      this.sessionMessages[this.currentSessionKey] = [];
    }
    
    this.sessionMessages[this.currentSessionKey].push(message);
  }

  getSessionMessages(sessionKey: string): StoredMessage[] {
    return this.sessionMessages[sessionKey] || [];
  }

  clearSessionMessages(sessionKey: string) {
    if (this.sessionMessages[sessionKey]) {
      this.sessionMessages[sessionKey] = [];
    }
  }
}

export const wsManager = WebSocketManager.getInstance();