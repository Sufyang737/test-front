import { useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface Message {
  id: string;
  from: string;
  to: string;
  body: string;
  fromMe: boolean;
  timestamp: number;
}

export function useWebSocket(onNewMessage?: (message: Message) => void) {
  useEffect(() => {
    const socket = io('http://localhost:3001');

    socket.on('connect', () => {
      console.log('🔌 Conectado al WebSocket');
    });

    socket.on('disconnect', () => {
      console.log('🔌 Desconectado del WebSocket');
    });

    socket.on('message.new', (message: Message) => {
      console.log('📩 Nuevo mensaje recibido por WebSocket:', message);
      if (onNewMessage) {
        onNewMessage(message);
      }
    });

    socket.on('message.ack', (data) => {
      console.log('✅ Confirmación de mensaje:', data);
    });

    socket.on('message.reaction', (data) => {
      console.log('😀 Reacción a mensaje:', data);
    });

    socket.on('presence.update', (data) => {
      console.log('👤 Actualización de presencia:', data);
    });

    return () => {
      socket.disconnect();
    };
  }, [onNewMessage]);
} 