import { useChats, type Chat } from '../hooks/use-chats'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Archive, ArchiveRestore } from 'lucide-react'

export function ChatList() {
  const { 
    chats, 
    activeChat, 
    selectChat, 
    toggleArchiveChat,
    loadingChats 
  } = useChats()

  // Separar chats archivados y no archivados
  const activeChats = chats.filter(chat => !chat.isArchived)
  const archivedChats = chats.filter(chat => chat.isArchived)

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
    <ScrollArea className="flex-1">
      {/* Chats activos */}
      <div className="space-y-1 p-2">
        {activeChats.map(chat => (
          <ChatItem
            key={chat.id}
            chat={chat}
            isActive={activeChat?.id === chat.id}
            onClick={() => selectChat(chat)}
            onArchive={() => toggleArchiveChat(chat.id, true)}
          />
        ))}
      </div>

      {/* Chats archivados */}
      {archivedChats.length > 0 && (
        <>
          <div className="px-4 py-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Archivados ({archivedChats.length})
            </h3>
          </div>
          <div className="space-y-1 p-2">
            {archivedChats.map(chat => (
              <ChatItem
                key={chat.id}
                chat={chat}
                isActive={activeChat?.id === chat.id}
                onClick={() => selectChat(chat)}
                onArchive={() => toggleArchiveChat(chat.id, false)}
                isArchived
              />
            ))}
          </div>
        </>
      )}
    </ScrollArea>
  )
}

interface ChatItemProps {
  chat: Chat
  isActive?: boolean
  isArchived?: boolean
  onClick: () => void
  onArchive: () => void
}

function ChatItem({ chat, isActive, isArchived, onClick, onArchive }: ChatItemProps) {
  // Obtener el nombre para mostrar y el fallback del avatar de manera segura
  const displayName = chat.contact?.name || chat.number || 'Sin nombre'
  const avatarFallback = displayName.charAt(0).toUpperCase()

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg cursor-pointer relative group",
        "transition-colors duration-200",
        isActive
          ? "bg-accent"
          : "hover:bg-accent/50"
      )}
      onClick={onClick}
    >
      {/* Avatar */}
      <Avatar className="h-12 w-12">
        <AvatarImage src={chat.contact?.avatar} />
        <AvatarFallback>
          {avatarFallback}
        </AvatarFallback>
      </Avatar>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-medium truncate">
            {displayName}
          </h3>
          {chat.lastMessage?.timestamp && (
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {format(new Date(chat.lastMessage.timestamp), 'HH:mm', { locale: es })}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {/* Último mensaje */}
          <p className="truncate">
            {chat.lastMessage?.content || 'No hay mensajes'}
          </p>

          {/* Contador de mensajes no leídos */}
          {chat.unreadCount > 0 && (
            <span className="flex-shrink-0 px-2 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded-full">
              {chat.unreadCount}
            </span>
          )}
        </div>
      </div>

      {/* Botón de archivar/desarchivar */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => {
          e.stopPropagation()
          onArchive()
        }}
      >
        {isArchived ? (
          <ArchiveRestore className="h-4 w-4" />
        ) : (
          <Archive className="h-4 w-4" />
        )}
      </Button>
    </div>
  )
} 