'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Send, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@clerk/nextjs';
import { useWebSocket } from '@/hooks/use-websocket';

interface Contact {
  id: string;
  name: string;
  picture?: string | null;
  lastMessage?: {
    body: string;
    timestamp: number;
    fromMe: boolean;
    hasMedia: boolean;
    from: string;
  } | null;
}

interface Message {
  id: string;
  body: string;
  timestamp: number;
  fromMe: boolean;
  from?: string;
  to?: string;
}

const POLLING_INTERVAL = 5000; // Aumentado a 5 segundos
const MESSAGE_LIMIT = 50; // Límite de mensajes a cargar

export default function ChatsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { userId } = useAuth();

  // Referencia para controlar el polling
  const pollingRef = useRef<{
    chats: NodeJS.Timeout | null;
    messages: NodeJS.Timeout | null;
  }>({
    chats: null,
    messages: null,
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Detener el polling
  const stopPolling = useCallback((type?: 'chats' | 'messages') => {
    if (!type || type === 'chats') {
      if (pollingRef.current.chats) {
        clearInterval(pollingRef.current.chats);
        pollingRef.current.chats = null;
      }
    }
    if (!type || type === 'messages') {
      if (pollingRef.current.messages) {
        clearInterval(pollingRef.current.messages);
        pollingRef.current.messages = null;
      }
    }
  }, []);

  const loadContacts = async () => {
    setIsLoading(true);
    try {
      console.log('🔄 Cargando chats...');
      const response = await fetch('/api/chats/overview');
      
      if (!response.ok) {
        throw new Error(`Error al cargar chats: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📦 Chats recibidos:', data);
      
      if (data.status === 'ok' && Array.isArray(data.chats)) {
        setContacts(data.chats);
      } else {
        console.error('❌ Formato de respuesta inválido:', data);
        throw new Error('Formato de datos inválido');
      }
    } catch (error) {
      console.error('❌ Error al cargar chats:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al cargar chats',
        variant: 'destructive',
      });
      setContacts([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para iniciar el polling de chats
  const startChatsPolling = useCallback(() => {
    if (pollingRef.current.chats) return;
    
    const pollChats = async () => {
      try {
        const lastUpdate = localStorage.getItem('lastChatsUpdate') || '0';
        const response = await fetch(`/api/chats/overview?since=${lastUpdate}`);
        if (!response.ok) throw new Error(`Error al cargar chats: ${response.statusText}`);
        
        const data = await response.json();
        if (data.status === 'ok' && Array.isArray(data.chats)) {
          setContacts(prevContacts => {
            // Actualizar solo si hay cambios y mantener un máximo de chats
            const updatedChats = [...prevContacts];
            data.chats.forEach(newChat => {
              const index = updatedChats.findIndex(c => c.id === newChat.id);
              if (index !== -1) {
                updatedChats[index] = newChat;
              } else {
                updatedChats.unshift(newChat);
              }
            });
            localStorage.setItem('lastChatsUpdate', Date.now().toString());
            return updatedChats.slice(0, 50); // Limitar a 50 chats
          });
        }
      } catch (error) {
        console.error('❌ Error en polling de chats:', error);
      }
    };

    pollChats(); // Primera ejecución
    pollingRef.current.chats = setInterval(pollChats, POLLING_INTERVAL);
  }, []);

  const loadMessages = async (contactId: string) => {
    try {
      setIsLoadingMessages(true);
      console.log('🔄 Cargando mensajes para:', contactId);
      
      const response = await fetch(`/api/messages/${contactId}`);
      const data = await response.json();
      
      console.log('📥 Respuesta de mensajes:', data);
      
      if (data.status === 'ok' && Array.isArray(data.messages)) {
        setMessages(data.messages);
        scrollToBottom();
      } else {
        console.error('❌ Formato de respuesta inválido:', data);
        toast({
          title: "Error",
          description: "Formato de respuesta inválido",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('❌ Error cargando mensajes:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los mensajes",
        variant: "destructive"
      });
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Función para iniciar el polling de mensajes
  const startMessagesPolling = useCallback((contactId: string) => {
    if (pollingRef.current.messages) return;
    
    const pollMessages = async () => {
      try {
        const lastMessageId = messages[messages.length - 1]?.id;
        const url = new URL(`/api/messages/${contactId}`, window.location.origin);
        if (lastMessageId) {
          url.searchParams.append('after', lastMessageId);
        }
        url.searchParams.append('limit', MESSAGE_LIMIT.toString());
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Error al cargar mensajes');
        
        const data = await response.json();
        if (data.status === 'ok' && Array.isArray(data.messages)) {
          setMessages(prevMessages => {
            // Solo agregar mensajes nuevos que no existan
            const currentIds = new Set(prevMessages.map(m => m.id));
            const newMessages = data.messages.filter(msg => !currentIds.has(msg.id));
            
            if (newMessages.length > 0) {
              console.log(`🔄 ${newMessages.length} nuevos mensajes detectados`);
              const updatedMessages = [...prevMessages, ...newMessages];
              // Mantener solo los últimos MESSAGE_LIMIT mensajes
              const limitedMessages = updatedMessages.slice(-MESSAGE_LIMIT);
              return limitedMessages;
            }
            return prevMessages;
          });
        }
      } catch (error) {
        console.error('❌ Error en polling de mensajes:', error);
      }
    };

    pollMessages(); // Primera ejecución
    pollingRef.current.messages = setInterval(pollMessages, POLLING_INTERVAL);
  }, []);

  // Efectos
  useEffect(() => {
    if (userId) {
      loadContacts().then(() => {
        startChatsPolling();
      });
    }
    return () => stopPolling();
  }, [userId, startChatsPolling, stopPolling]);

  useEffect(() => {
    if (selectedContact) {
      // Detener polling anterior si existe
      stopPolling('messages');
      
      // Cargar mensajes iniciales y comenzar polling
      loadMessages(selectedContact.id).then(() => {
        startMessagesPolling(selectedContact.id);
      });
    } else {
      stopPolling('messages');
      setMessages([]);
    }
    
    // Cleanup al desmontar
    return () => stopPolling('messages');
  }, [selectedContact, startMessagesPolling, stopPolling]);

  // Mover scrollToBottom a un efecto separado con debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      scrollToBottom();
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [messages]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const isAtBottom = target.scrollHeight - target.scrollTop === target.clientHeight;
    if (isAtBottom) {
      scrollToBottom();
    }
  }, []);

  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedContact || !userId) return;

    try {
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-clerk-user-id': userId
        },
        body: JSON.stringify({
          contactId: selectedContact.id,
          message: messageInput
        }),
      });

      if (!response.ok) {
        throw new Error('Error al enviar el mensaje');
      }

      await loadMessages(selectedContact.id);
      setMessageInput('');
    } catch (error) {
      console.error('❌ Error al enviar mensaje:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje",
        variant: "destructive"
      });
    }
  };

  // Optimizar la función de actualización de contactos
  const updateContactWithLastMessage = useCallback((contactId: string, lastMessage: string, timestamp: number, fromMe: boolean = false) => {
    setContacts(prevContacts => {
      const contactIndex = prevContacts.findIndex(c => c.id === contactId);
      if (contactIndex === -1) return prevContacts;

      const updatedContacts = [...prevContacts];
      const updatedContact = {
        ...updatedContacts[contactIndex],
        lastMessage: {
          body: lastMessage,
          timestamp: timestamp,
          fromMe: fromMe,
          hasMedia: false,
          from: fromMe ? userId : contactId
        }
      };

      // Remover y añadir al principio
      updatedContacts.splice(contactIndex, 1);
      updatedContacts.unshift(updatedContact);
      
      return updatedContacts;
    });
  }, [userId]);

  // Manejar mensajes nuevos desde WebSocket
  const handleNewMessage = useCallback((message: Message) => {
    console.log('📩 Nuevo mensaje recibido:', message);
    
    // Determinar el ID del contacto basado en si el mensaje es enviado o recibido
    const contactId = message.fromMe ? message.to : message.from;
    
    // Actualizar la lista de contactos con el último mensaje
    if (contactId) {
      updateContactWithLastMessage(
        contactId,
        message.body,
        message.timestamp,
        message.fromMe
      );

      // Actualizar mensajes si es el chat actual
      if (selectedContact && (
        (message.fromMe && message.to === selectedContact.id) || 
        (!message.fromMe && message.from === selectedContact.id)
      )) {
        setMessages(prevMessages => {
          // Verificar si el mensaje ya existe
          const messageExists = prevMessages.some(m => m.id === message.id);
          if (messageExists) {
            return prevMessages;
          }
          return [...prevMessages, message];
        });
        scrollToBottom();
      }
    }
  }, [selectedContact, updateContactWithLastMessage]);

  // Usar el hook de WebSocket
  useWebSocket(handleNewMessage);

  return (
    <div className="flex h-screen">
      {/* Lista de contactos */}
      <div className="w-1/3 border-r">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Chats</h2>
        </div>
        <ScrollArea className="h-[calc(100vh-5rem)]">
          {isLoading ? (
            // Placeholders de carga
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="m-2 p-4">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </Card>
            ))
          ) : contacts.length > 0 ? (
            contacts.map((contact) => (
              <Card
                key={contact.id}
                className={`m-2 p-4 cursor-pointer hover:bg-gray-100 ${
                  selectedContact?.id === contact.id ? 'bg-gray-100' : ''
                }`}
                onClick={() => setSelectedContact(contact)}
              >
                <div className="flex items-center space-x-3">
                  {contact.picture ? (
                    <img 
                      src={contact.picture} 
                      alt={contact.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-lg">{contact.name[0]}</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-medium">{contact.name}</h3>
                    {contact.lastMessage && (
                      <>
                        <p className="text-sm text-gray-500">{contact.lastMessage.body}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(contact.lastMessage.timestamp).toLocaleString()}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="p-4 text-center text-gray-500">
              No hay chats disponibles
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Área de chat */}
      <div className="flex-1">
        {selectedContact ? (
          <div className="h-full flex flex-col">
            <div className="p-4 border-b flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-lg">{selectedContact.name[0]}</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold">
                  {selectedContact.name !== selectedContact.id ? selectedContact.name : selectedContact.phone}
                </h2>
                <p className="text-sm text-gray-500">{selectedContact.phone}</p>
              </div>
            </div>
            <ScrollArea 
              className="flex-1" 
              onScroll={handleScroll}
            >
              {isLoadingMessages && (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              )}
              <div className="space-y-4 p-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.fromMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] p-3 rounded-lg ${
                        message.fromMe
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <div>{message.body}</div>
                      <div className="text-xs opacity-70">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!messageInput.trim() || isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            Selecciona un contacto para comenzar a chatear
          </div>
        )}
      </div>
    </div>
  );
} 