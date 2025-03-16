'use client'

import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { MessageSquare, MoreVertical, MailPlus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Chat } from '@/features/chat/store/chat-store'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Check, CheckCheck, Search } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from '@/components/ui/button'

interface ChatListProps {
  chats: Chat[]
  activeChat?: string
  onChatSelect: (chatId: string) => void
  loading?: boolean
  onSearch?: (query: string) => void
  onMarkAsUnread?: (chatId: string) => void
}

export function ChatList({ 
  chats, 
  activeChat, 
  onChatSelect, 
  loading, 
  onSearch,
  onMarkAsUnread 
}: ChatListProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Search bar */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar chat..."
            className="pl-9"
            onChange={(e) => onSearch?.(e.target.value)}
          />
        </div>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          // Loading skeletons
          <div className="space-y-4 p-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-[140px]" />
                  <Skeleton className="h-3 w-[200px]" />
                </div>
                <Skeleton className="h-3 w-8" />
              </div>
            ))}
          </div>
        ) : chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center text-muted-foreground">
            <p>No hay chats disponibles</p>
          </div>
        ) : (
          <div className="space-y-0.5 p-2">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group",
                  activeChat === chat.id && "bg-muted"
                )}
              >
                {/* Chat button */}
                <button
                  onClick={() => onChatSelect(chat.id)}
                  className="flex-1 flex items-center gap-3 min-w-0"
                >
                  {/* Avatar */}
                  <div className="relative">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                      {chat.contact.avatar ? (
                        <img 
                          src={chat.contact.avatar} 
                          alt={chat.contact.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-lg text-muted-foreground">
                          {chat.contact.name[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                    {chat.unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-[11px] font-medium text-primary-foreground flex items-center justify-center">
                        {chat.unreadCount}
                      </div>
                    )}
                  </div>

                  {/* Chat info */}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between">
                      <p className="font-medium truncate">{chat.contact.name}</p>
                      <span className="text-[11px] text-muted-foreground">
                        {format(new Date(chat.lastMessage.timestamp), 'HH:mm')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      {chat.lastMessage.status === 'read' ? (
                        <CheckCheck className="h-4 w-4 text-primary" />
                      ) : chat.lastMessage.status === 'delivered' ? (
                        <Check className="h-4 w-4" />
                      ) : null}
                      <span className="truncate">{chat.lastMessage.content}</span>
                    </div>
                  </div>
                </button>

                {/* Actions dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">Abrir menú</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onMarkAsUnread?.(chat.id)}>
                      <MailPlus className="mr-2 h-4 w-4" />
                      <span>Marcar como no leído</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 