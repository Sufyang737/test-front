'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useToast } from '@/components/ui/use-toast';
import { getPocketBase, authPocketBase } from '@/lib/pocketbase';

export interface Message {
  id: string;
  content: string;
  type: 'user' | 'assistant';
  timestamp: string;
}

export interface Chat {
  id: string;
  name: string;
  lastMessage?: string;
  timestamp?: string;
}

export interface BotStatus {
  useBot: boolean;
}

export interface WhatsAppProfile {
  contact: {
    id: string;
    phone: string;
    name: string;
    picture?: string;
    about?: string;
    exists: boolean;
  };
  recentMessages: {
    id: string;
    content: string;
    timestamp: string;
    sender: {
      id: string;
      type: 'user' | 'contact';
    };
    status: 'sent' | 'delivered' | 'read';
  }[];
}

export interface UseChatsReturn {
  chats: Chat[];
  messages: Message[];
  activeChat: Chat | null;
  loading: boolean;
  loadingMessages: boolean;
  hasMoreMessages: boolean;
  isFetchingMoreMessages: boolean;
  clientId: string | null;
  sendMessage: (content: string) => Promise<Message>;
  loadMoreMessages: () => Promise<void>;
  selectChat: (chat: Chat) => void;
  getBotStatus: (chatId: string, clientId: string) => Promise<BotStatus>;
  toggleBot: (chatId: string, clientId: string, enabled: boolean) => Promise<boolean>;
  searchWhatsAppProfile: (phone: string) => Promise<WhatsAppProfile>;
}

export function useChats(): UseChatsReturn {
  const { toast } = useToast();
  const { userId } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isFetchingMoreMessages, setIsFetchingMoreMessages] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);

  const loadMoreMessages = useCallback(async () => {
    if (!activeChat || !hasMoreMessages || isFetchingMoreMessages) return;
    setIsFetchingMoreMessages(true);
    try {
      // TODO: Implement loading more messages
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setHasMoreMessages(false);
    } catch (error) {
      console.error('Error loading more messages:', error);
      toast({
        title: 'Error',
        description: 'Failed to load more messages',
        variant: 'destructive'
      });
    } finally {
      setIsFetchingMoreMessages(false);
    }
  }, [activeChat, hasMoreMessages, isFetchingMoreMessages, toast]);

  const selectChat = useCallback((chat: Chat) => {
    setActiveChat(chat);
    setMessages([
      {
        id: '1',
        content: 'Hello! How can I help you today?',
        type: 'assistant',
        timestamp: new Date().toISOString()
      }
    ]);
    setHasMoreMessages(true);
  }, []);

  const sendMessage = useCallback(async (content: string): Promise<Message> => {
    const message: Message = {
      id: Date.now().toString(),
      content,
      type: 'user',
      timestamp: new Date().toISOString()
    };

    setMessages((prev) => [...prev, message]);

    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: 'This is a mock response from the bot.',
      type: 'assistant',
      timestamp: new Date().toISOString()
    };

    setTimeout(() => {
      setMessages((prev) => [...prev, botMessage]);
    }, 1000);

    return message;
  }, []);

  const getBotStatus = useCallback(async (chatId: string, clientId: string): Promise<BotStatus> => {
    // TODO: Implement getting bot status
    return { useBot: false };
  }, []);

  const toggleBot = useCallback(async (chatId: string, clientId: string, enabled: boolean): Promise<boolean> => {
    // TODO: Implement toggling bot
    return true;
  }, []);

  const searchWhatsAppProfile = useCallback(async (phone: string): Promise<WhatsAppProfile> => {
    try {
      // Aquí implementarías la lógica real para buscar el perfil de WhatsApp
      // Por ahora retornamos datos de ejemplo
      return {
        contact: {
          id: phone + '@c.us',
          phone,
          name: 'Usuario de WhatsApp',
          exists: true
        },
        recentMessages: []
      };
    } catch (error) {
      console.error('Error searching WhatsApp profile:', error);
      throw error;
    }
  }, []);

  useEffect(() => {
    // TODO: Implement fetching chats
    setChats([
      {
        id: '1',
        name: 'Chat 1',
        lastMessage: 'Hello! How can I help you today?',
        timestamp: new Date().toISOString()
      }
    ]);
    setClientId('mock-client-id');
  }, []);

  return {
    chats,
    messages,
    activeChat,
    loading,
    loadingMessages,
    hasMoreMessages,
    isFetchingMoreMessages,
    clientId,
    sendMessage,
    loadMoreMessages,
    selectChat,
    getBotStatus,
    toggleBot,
    searchWhatsAppProfile
  };
}