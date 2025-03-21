import { useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface Message {
  id: string;
  from: string;
  to: string;
  body: string;
  fromMe: boolean;
  timestamp: number;
  hasMedia?: boolean;
  media?: {
    url: string;
    mimetype: string;
    filename?: string;
    error?: string | null;
  } | null;
}

export function useWebSocket(onNewMessage?: (message: Message) => void) {
  useEffect(() => {
    const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
    console.log('🔌 Conectando al WebSocket:', SOCKET_URL);
    
    const socket = io(SOCKET_URL);

    socket.on('connect', () => {
      console.log('🔌 Conectado al WebSocket');
    });

    socket.on('disconnect', () => {
      console.log('🔌 Desconectado del WebSocket');
    });

    // Escuchar eventos de mensajes nuevos
    socket.on('message.new', (message: Message) => {
      console.log('📩 Nuevo mensaje recibido por WebSocket:', message);
      if (onNewMessage) {
        onNewMessage(message);
      }
    });

    // Escuchar cualquier mensaje (incluyendo los enviados)
    socket.on('message.any', (message: Message) => {
      console.log('📨 Mensaje enviado/recibido:', message);
      if (onNewMessage && message.fromMe) {
        onNewMessage(message);
      }
    });

    // Escuchar confirmaciones de mensajes
    socket.on('message.ack', (data) => {
      console.log('✅ Confirmación de mensaje:', data);
    });

    // Escuchar reacciones a mensajes
    socket.on('message.reaction', (data) => {
      console.log('😀 Reacción a mensaje:', data);
    });

    // Escuchar actualizaciones de presencia
    socket.on('presence.update', (data) => {
      console.log('👤 Actualización de presencia:', data);
    });

    return () => {
      console.log('🔌 Desconectando WebSocket...');
      socket.disconnect();
    };
  }, [onNewMessage]);
} 