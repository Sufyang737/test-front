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
  phone: string;
  lastMessage?: string;
  timestamp?: string;
}

interface Message {
  id: string;
  body: string;
  timestamp: number;
  fromMe: boolean;
  from?: string;
  to?: string;
}

export default function ChatsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { userId } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (userId) {
      loadContacts();
    }
  }, [userId]);

  useEffect(() => {
    if (selectedContact) {
      loadMessages(selectedContact.id);
    }
  }, [selectedContact]);

  const loadContacts = async () => {
    if (!userId) {
      console.error('❌ No hay userId disponible');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔄 Iniciando carga de contactos...');
      const response = await fetch('/api/contacts', {
        headers: {
          'x-clerk-user-id': userId
        }
      });
      console.log('📥 Estado de la respuesta:', response.status);
      
      if (!response.ok) {
        throw new Error(`Error al cargar contactos: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📦 Datos recibidos:', data);
      
      if (Array.isArray(data)) {
        setContacts(data);
      } else {
        console.error('❌ Los datos recibidos no son un array:', data);
        throw new Error('Formato de datos inválido');
      }
    } catch (error) {
      console.error('❌ Error al cargar contactos:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al cargar contactos',
        variant: 'destructive',
      });
      setContacts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (contactId: string, pageNum = 1, append = false) => {
    if (!userId) {
      console.error('❌ No hay userId disponible');
      return;
    }

    setIsLoadingMessages(true);
    try {
      console.log('🔄 Cargando mensajes para:', contactId, 'página:', pageNum);
      const response = await fetch(`/api/messages/${contactId}?page=${pageNum}`, {
        headers: {
          'x-clerk-user-id': userId
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error al cargar mensajes: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📦 Mensajes recibidos:', data);
      
      if (Array.isArray(data.messages)) {
        // Ordenar mensajes por timestamp (más recientes abajo)
        const sortedMessages = data.messages.sort((a, b) => a.timestamp - b.timestamp);
        
        if (append) {
          setMessages(prev => [...sortedMessages, ...prev]);
        } else {
          setMessages(sortedMessages);
        }
        
        setHasMore(data.hasMore || false);
      } else {
        console.error('❌ Los datos recibidos no son un array:', data);
        setMessages([]);
        throw new Error('Formato de datos inválido');
      }
    } catch (error) {
      console.error('❌ Error al cargar mensajes:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudieron cargar los mensajes",
        variant: "destructive"
      });
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    if (target.scrollTop === 0 && hasMore && !isLoadingMessages) {
      setPage(prev => {
        const newPage = prev + 1;
        if (selectedContact) {
          loadMessages(selectedContact.id, newPage, true);
        }
        return newPage;
      });
    }
  }, [hasMore, isLoadingMessages, selectedContact]);

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
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al enviar el mensaje');
      }

      const data = await response.json();
      setMessages(prev => [...prev, {
        id: data.key.id,
        body: messageInput,
        timestamp: Date.now(),
        fromMe: true
      }]);
      
      setMessageInput('');
    } catch (error) {
      console.error('❌ Error al enviar mensaje:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo enviar el mensaje",
        variant: "destructive"
      });
    }
  };

  // Manejar nuevos mensajes desde WebSocket
  const handleNewMessage = useCallback((message: Message) => {
    if (selectedContact && 
        (message.from === selectedContact.id || message.to === selectedContact.id)) {
      setMessages(prev => [...prev, {
        id: message.id,
        body: message.body,
        timestamp: message.timestamp,
        fromMe: message.fromMe
      }]);
    }
  }, [selectedContact]);

  // Usar el hook de WebSocket
  useWebSocket(handleNewMessage);

  return (
    <div className="flex h-screen">
      {/* Lista de contactos */}
      <div className="w-1/3 border-r">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Contactos</h2>
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
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-lg">{contact.name[0]}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">
                      {contact.name !== contact.id ? contact.name : contact.phone}
                    </h3>
                    <p className="text-sm text-gray-500">{contact.lastMessage || 'No hay mensajes'}</p>
                    {contact.timestamp && (
                      <p className="text-xs text-gray-400">
                        {new Date(contact.timestamp).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="p-4 text-center text-gray-500">
              No hay contactos disponibles
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
            <ScrollArea className="flex-1" onScroll={handleScroll}>
              {isLoadingMessages && hasMore && (
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