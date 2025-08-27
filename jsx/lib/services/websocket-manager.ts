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
      // WebSocket already connected
      this.notifyConnectionState({ isConnected: true });
      return;
    }
    
    // If connecting, wait for it to complete
    if (this.ws?.readyState === WebSocket.CONNECTING) {
      // WebSocket already connecting, skipping
      return;
    }

    // Creating singleton WebSocket connection
    this.createConnection();
  }

  private createConnection() {
    if (!this.url) return;

    try {
      this.ws = new WebSocket(this.url);
      
      this.ws.onopen = () => {
        // WebSocket connected
        this.reconnectAttempts = 0;
        this.notifyConnectionState({ isConnected: true });
      };

      this.ws.onmessage = (event) => {
        try {
          // WebSocket message received
          const message = JSON.parse(event.data);
          // WebSocket message parsed
          this.notifyMessageHandlers(message);
        } catch (error) {
          // Failed to parse WebSocket message
        }
      };

      this.ws.onerror = () => {
        // WebSocket error occurred
        this.notifyConnectionState({ isConnected: false, error: "Connection error" });
      };

      this.ws.onclose = () => {
        // WebSocket closed
        this.ws = null;
        this.notifyConnectionState({ isConnected: false });
        
        // Always reconnect unless intentionally disconnected
        if (!this.isIntentionalDisconnect) {
          this.scheduleReconnect();
        }
      };
    } catch (error) {
      // Failed to create WebSocket
      this.notifyConnectionState({ 
        isConnected: false, 
        error: error instanceof Error ? error.message : "Failed to connect" 
      });
    }
  }

  private scheduleReconnect() {
    this.reconnectAttempts++;
    
    // Exponential backoff with jitter to prevent thundering herd
    const baseDelay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 30000);
    const jitter = Math.random() * 0.3 * baseDelay; // 0-30% jitter
    const delay = Math.floor(baseDelay + jitter);
    
    // Scheduling reconnect attempt
    
    this.reconnectTimer = setTimeout(() => {
      // Reconnect attempt in progress
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
    // Attempting to send WebSocket message
    if (this.ws?.readyState === WebSocket.OPEN) {
      const jsonMessage = JSON.stringify(message);
      // Sending WebSocket message
      this.ws.send(jsonMessage);
    } else {
      // WebSocket not connected, cannot send message
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
        // Error in message handler
      }
    });
  }

  private notifyConnectionState(state: { isConnected: boolean; error?: string }) {
    this.connectionStateHandlers.forEach(handler => {
      try {
        handler(state);
      } catch (error) {
        // Error in connection state handler
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