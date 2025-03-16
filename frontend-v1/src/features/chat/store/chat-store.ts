import { create } from 'zustand'

export interface Contact {
  id: string
  name: string
  phone: string
  avatar?: string
}

export interface LastMessage {
  content: string
  timestamp: string
  status: 'sent' | 'delivered' | 'read'
}

export interface Chat {
  id: string
  contact: Contact
  lastMessage?: LastMessage
  unreadCount: number
  isArchived?: boolean
}

interface ChatStore {
  chats: Chat[]
  activeChat: Chat | null
  loading: boolean
  error: string | null
  setChats: (chats: Chat[] | ((prev: Chat[]) => Chat[])) => void
  setActiveChat: (chat: Chat | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  toggleArchiveChat: (chatId: string, archive: boolean) => void
  updateChat: (chatId: string, updates: Partial<Chat>) => void
}

export const useChatStore = create<ChatStore>((set) => ({
  chats: [],
  activeChat: null,
  loading: false,
  error: null,
  setChats: (chats) => set((state) => ({ 
    chats: typeof chats === 'function' ? chats(state.chats) : chats 
  })),
  setActiveChat: (chat) => set({ activeChat: chat }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  toggleArchiveChat: (chatId, archive) => set((state) => ({
    chats: state.chats.map(chat => 
      chat.id === chatId ? { ...chat, isArchived: archive } : chat
    )
  })),
  updateChat: (chatId, updates) => set((state) => ({
    chats: state.chats.map(chat =>
      chat.id === chatId ? { ...chat, ...updates } : chat
    ),
    activeChat: state.activeChat?.id === chatId 
      ? { ...state.activeChat, ...updates }
      : state.activeChat
  }))
})) 