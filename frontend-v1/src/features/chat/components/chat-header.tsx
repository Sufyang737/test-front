import { Chat } from '../hooks/use-chats'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { DotsVerticalIcon, Cross2Icon } from '@radix-ui/react-icons'
import { cn } from '@/lib/utils'

interface ChatHeaderProps {
  chat: Chat
  onClose?: () => void
  className?: string
}

export function ChatHeader({ chat, onClose, className }: ChatHeaderProps) {
  return (
    <div className={cn(
      "flex items-center justify-between gap-4 p-3 bg-background border-b",
      className
    )}>
      {/* Info del chat */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Avatar className="h-10 w-10">
          <AvatarFallback>
            {chat.name?.[0]?.toUpperCase() || '?'}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <h2 className="font-medium truncate">
            {chat.name || 'Sin nombre'}
          </h2>
          {chat.lastMessage && (
            <p className="text-sm text-muted-foreground truncate">
              {chat.lastMessage}
            </p>
          )}
        </div>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon">
          <DotsVerticalIcon className="h-4 w-4" />
        </Button>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <Cross2Icon className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
} 