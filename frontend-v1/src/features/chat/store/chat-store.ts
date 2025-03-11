import { create } from 'zustand'

export interface Chat {
  id: string
  contact: {
    id: string
    name: string
    phone: string
    avatar?: string
  }
  lastMessage: {
    content: string
    timestamp: string
    status: 'sent' | 'delivered' | 'read'
  }
  unreadCount: number
}

interface ChatState {
  chats: Chat[]
  activeChat: string | null
  loading: boolean
  error: string | null
  setChats: (chats: Chat[] | ((prev: Chat[]) => Chat[])) => void
  setActiveChat: (chatId: string | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useChatStore = create<ChatState>((set) => ({
  chats: [],
  activeChat: null,
  loading: false,
  error: null,
  setChats: (chats) => set((state) => ({ chats: typeof chats === 'function' ? chats(state.chats) : chats })),
  setActiveChat: (chatId) => set({ activeChat: chatId }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
})) 