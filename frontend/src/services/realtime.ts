/**
 * AQS Real-Time Event Stream Service
 * Connects to FastAPI SSE endpoint /api/v1/realtime/stream using Fetch API with ReadableStream.
 *
 * SECURITY GUARANTEE:
 * Transmits authentication credentials strictly via HTTP 'Authorization: Bearer <token>' header.
 * NEVER puts tokens in URL query strings, preventing exposure in browser history, URL logs, or proxies.
 */

import { API_BASE_URL, getActiveBearerToken } from './api';

export const REALTIME_STREAM_URL = `${API_BASE_URL}/realtime/stream`;

export interface RealtimeEventPayload {
  type: string;
  id?: string;
  data?: any;
  timestamp: string;
}

export type RealtimeEventHandler = (event: RealtimeEventPayload) => void;

class RealtimeStreamManager {
  private abortController: AbortController | null = null;
  private listeners: Set<RealtimeEventHandler> = new Set();
  private reconnectTimeout: number | null = null;
  private isConnected: boolean = false;

  public async connect(token?: string) {
    if (typeof window === 'undefined' || !window.fetch) return;
    if (this.abortController) return;

    this.abortController = new AbortController();
    const authToken = token || (await getActiveBearerToken());
    if (!authToken) {
      this.abortController = null;
      return;
    }

    try {
      // Connect to SSE stream strictly via HTTP Authorization Header (NO tokens in URLs)
      const response = await fetch(REALTIME_STREAM_URL, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Accept': 'text/event-stream',
        },
        signal: this.abortController.signal,
      });

      if (response.status === 401 || response.status === 403) {
        this.disconnect();
        return;
      }

      if (!response.ok || !response.body) {
        this.handleDisconnect(token);
        return;
      }

      this.isConnected = true;
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const blocks = buffer.split('\n\n');
        buffer = blocks.pop() || '';

        for (const block of blocks) {
          for (const line of block.split('\n')) {
            if (line.startsWith('data: ')) {
              try {
                const payload: RealtimeEventPayload = JSON.parse(line.slice(6));
                this.notifyListeners(payload);
              } catch {
                // Heartbeat ping or unformatted text
              }
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        this.handleDisconnect(token);
      }
    }
  }

  private handleDisconnect(token?: string) {
    this.isConnected = false;
    this.disconnect();
    if (!this.reconnectTimeout) {
      this.reconnectTimeout = window.setTimeout(() => {
        this.reconnectTimeout = null;
        this.connect(token);
      }, 5000);
    }
  }

  public disconnect() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.isConnected = false;
  }

  public subscribe(handler: RealtimeEventHandler): () => void {
    this.listeners.add(handler);
    return () => {
      this.listeners.delete(handler);
    };
  }

  private notifyListeners(event: RealtimeEventPayload) {
    this.listeners.forEach((handler) => {
      try {
        handler(event);
      } catch (err) {
        console.error('[AQS Realtime] Listener error:', err);
      }
    });
  }

  public get connected() {
    return this.isConnected;
  }
}

export const realtimeStream = new RealtimeStreamManager();
