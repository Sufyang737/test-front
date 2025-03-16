import { useChats, type Chat } from '../hooks/use-chats'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export function ChatList() {
  const { 
    chats, 
    activeChat, 
    selectChat,
    loading: loadingChats 
  } = useChats()

  if (loadingChats) {
    return (
      <div className="p-4 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-muted animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
              <div className="h-3 w-3/4 bg-muted animate-pulse rounded" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <ScrollArea className="h-screen">
      <div className="p-4 space-y-2">
        {chats.map(chat => (
          <ChatItem 
            key={chat.id}
            chat={chat}
            isActive={activeChat?.id === chat.id}
            onClick={() => selectChat(chat)}
          />
        ))}
      </div>
    </ScrollArea>
  )
}

interface ChatItemProps {
  chat: Chat
  isActive?: boolean
  onClick?: () => void
}

function ChatItem({ chat, isActive, onClick }: ChatItemProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-accent",
        isActive && "bg-accent"
      )}
      onClick={onClick}
    >
      <Avatar className="h-12 w-12">
        <AvatarFallback>
          {chat.name?.[0]?.toUpperCase() || '?'}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-medium truncate">
            {chat.name || 'Sin nombre'}
          </h3>
          {chat.timestamp && (
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {format(new Date(chat.timestamp), 'PP', { locale: es })}
            </span>
          )}
        </div>
        {chat.lastMessage && (
          <p className="text-sm text-muted-foreground truncate">
            {chat.lastMessage}
          </p>
        )}
      </div>
    </div>
  )
} 