import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface WebSocketMessage {
  event: string;
  session: string;
  payload: {
    id: string;
    from: string;
    to: string;
    body: string;
    timestamp: number;
    fromMe: boolean;
    status: 'sent' | 'delivered' | 'read';
  };
}

export function useWebSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const WAHA_API_URL = process.env.NEXT_PUBLIC_WAHA_API_URL;
    if (!WAHA_API_URL) {
      console.error('WAHA_API_URL no está definida');
      return;
    }

    const newSocket = io(WAHA_API_URL, {
      transports: ['websocket'],
      autoConnect: true
    });

    newSocket.on('connect', () => {
      console.log('WebSocket conectado');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('WebSocket desconectado');
      setConnected(false);
    });

    newSocket.on('error', (error) => {
      console.error('Error en WebSocket:', error);
      setConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  return { socket, connected };
} 