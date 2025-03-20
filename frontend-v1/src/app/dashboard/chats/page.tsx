'use client';

import { useEffect, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Send, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@clerk/nextjs';

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
}

export default function ChatsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { userId } = useAuth();

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

  const loadMessages = async (contactId: string) => {
    if (!userId) {
      console.error('❌ No hay userId disponible');
      return;
    }

    try {
      console.log('🔄 Cargando mensajes para:', contactId);
      const response = await fetch(`/api/messages/${contactId}`, {
        headers: {
          'x-clerk-user-id': userId
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error al cargar mensajes: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📦 Mensajes recibidos:', data);
      
      if (Array.isArray(data)) {
        setMessages(data);
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
    }
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedContact) return;

    try {
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contactId: selectedContact.id,
          message: messageInput
        }),
      });

      if (!response.ok) throw new Error('Error al enviar el mensaje');

      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        body: messageInput,
        timestamp: Date.now(),
        fromMe: true
      }]);
      
      setMessageInput('');
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje",
        variant: "destructive"
      });
    }
  };

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
                <h3 className="font-medium">{contact.name}</h3>
                <p className="text-sm text-gray-500">{contact.lastMessage || 'No hay mensajes'}</p>
                {contact.timestamp && (
                  <p className="text-xs text-gray-400">
                    {new Date(contact.timestamp).toLocaleString()}
                  </p>
                )}
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
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">{selectedContact.name}</h2>
              <p className="text-sm text-gray-500">{selectedContact.phone}</p>
            </div>
            <ScrollArea className="flex-1">
              <div className="space-y-4">
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