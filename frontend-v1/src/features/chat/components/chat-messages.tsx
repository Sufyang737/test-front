import { useEffect, useRef } from 'react'
import { Message } from '../hooks/use-chats'
import { ScrollArea } from '@/components/ui/scroll-area'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useInView } from 'react-intersection-observer'
import { cn } from '@/lib/utils'

interface ChatMessagesProps {
  messages: Message[]
  loadingMessages: boolean
  hasMoreMessages: boolean
  loadMoreMessages: () => Promise<void>
  isFetchingMoreMessages: boolean
}

export function ChatMessages({
  messages,
  loadingMessages,
  hasMoreMessages,
  loadMoreMessages,
  isFetchingMoreMessages
}: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.1,
    rootMargin: '100px 0px 0px 0px'
  })

  // Cargar más mensajes cuando el usuario scrollea hacia arriba
  useEffect(() => {
    if (inView && hasMoreMessages && !isFetchingMoreMessages) {
      loadMoreMessages()
    }
  }, [inView, hasMoreMessages, isFetchingMoreMessages, loadMoreMessages])

  // Scroll al último mensaje cuando se envía uno nuevo
  useEffect(() => {
    if (!loadingMessages && !isFetchingMoreMessages) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages.length, loadingMessages, isFetchingMoreMessages])

  if (loadingMessages) {
    return (
      <div className="flex-1 p-4 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className={cn(
              "flex gap-3",
              i % 2 === 0 && "justify-end"
            )}
          >
            <div className={cn(
              "rounded-lg p-4 max-w-[85%]",
              i % 2 === 0
                ? "bg-primary text-primary-foreground"
                : "bg-muted"
            )}>
              <div className="h-4 w-48 bg-current opacity-20 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <ScrollArea className="flex-1">
      <div className="flex flex-col-reverse p-4 space-y-reverse space-y-4">
        {/* Botón de cargar más */}
        {hasMoreMessages && (
          <div className="flex justify-center">
            <button
              className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
              onClick={() => loadMoreMessages()}
              disabled={isFetchingMoreMessages}
            >
              {isFetchingMoreMessages ? 'Cargando...' : 'Cargar más mensajes'}
            </button>
          </div>
        )}

        {/* Mensajes */}
        <div className="space-y-2">
          {messages.map((message, index) => {
            const isUser = message.type === 'user'
            const showTimestamp = index === 0 || 
              new Date(message.timestamp).getTime() - new Date(messages[index - 1].timestamp).getTime() > 5 * 60 * 1000

            return (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  isUser && "justify-end"
                )}
              >
                <div className={cn(
                  "rounded-lg p-4 max-w-[85%]",
                  isUser
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}>
                  <p className="whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                  {showTimestamp && (
                    <p className="text-xs mt-1 opacity-70">
                      {format(new Date(message.timestamp), 'HH:mm', { locale: es })}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </ScrollArea>
  )
} 