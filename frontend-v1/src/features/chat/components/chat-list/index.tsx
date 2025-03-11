'use client'

import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

interface Chat {
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

interface ChatListProps {
  chats?: Chat[]
  activeChat?: string | null
  onChatSelect: (chatId: string) => void
}

export function ChatList({ chats = [], activeChat, onChatSelect }: ChatListProps) {
  if (chats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
        <MessageSquare className="h-12 w-12 text-muted-foreground" />
        <div>
          <h3 className="font-semibold">No hay chats</h3>
          <p className="text-sm text-muted-foreground">
            Los chats aparecerán aquí cuando tengas nuevos mensajes
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2 p-2">
      {chats.map((chat) => (
        <button
          key={chat.id}
          onClick={() => onChatSelect(chat.id)}
          className={cn(
            "w-full flex items-center gap-3 p-3 rounded-lg transition-colors",
            "hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-1",
            "focus-visible:ring-ring text-left",
            activeChat === chat.id && "bg-muted"
          )}
        >
          <Avatar className="h-12 w-12 flex-shrink-0">
            <AvatarImage src={chat.contact.avatar} />
            <AvatarFallback>
              {chat.contact.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium truncate">
                {chat.contact.name}
              </span>
              <span className="text-xs text-muted-foreground flex-shrink-0">
                {format(new Date(chat.lastMessage.timestamp), 'HH:mm')}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-muted-foreground truncate">
                {chat.lastMessage.content}
              </span>
              {chat.unreadCount > 0 && (
                <Badge variant="default" className="flex-shrink-0">
                  {chat.unreadCount}
                </Badge>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  )
} 