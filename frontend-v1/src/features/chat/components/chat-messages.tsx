import { useEffect, useRef } from 'react'
import { Message } from '../hooks/use-chats'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useInView } from 'react-intersection-observer'

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
  }, [inView, hasMoreMessages, isFetchingMoreMessages])

  // Scroll al último mensaje cuando se envía uno nuevo
  useEffect(() => {
    if (!loadingMessages && !isFetchingMoreMessages) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages.length, loadingMessages, isFetchingMoreMessages])

  if (loadingMessages) {
    return (
      <div className="flex-1 flex items-center justify-center bg-chat-pattern">
        <div className="animate-pulse space-y-4">
          <div className="h-12 w-64 bg-white/80 rounded-lg" />
          <div className="h-12 w-48 bg-white/80 rounded-lg" />
          <div className="h-12 w-56 bg-white/80 rounded-lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-chat-pattern">
      {/* Indicador de carga de más mensajes */}
      {isFetchingMoreMessages && (
        <div className="flex justify-center py-2">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent" />
        </div>
      )}

      {/* Elemento de observación para infinite scroll */}
      {hasMoreMessages && <div ref={loadMoreRef} className="h-px" />}

      {/* Mensajes */}
      <div className="space-y-2">
        {messages.map((message, index) => {
          const isUser = message.sender.type === 'user'
          const showTimestamp = index === 0 || 
            new Date(message.timestamp).getTime() - new Date(messages[index - 1].timestamp).getTime() > 5 * 60 * 1000

          return (
            <div key={message.id} className="space-y-1">
              {/* Timestamp */}
              {showTimestamp && (
                <div className="flex justify-center my-4">
                  <span className="text-xs text-gray-500 bg-white/90 px-3 py-1 rounded-full shadow-sm">
                    {format(new Date(message.timestamp), 'PPp', { locale: es })}
                  </span>
                </div>
              )}

              {/* Mensaje */}
              <div
                className={cn(
                  'flex items-end gap-2',
                  isUser ? 'justify-end' : 'justify-start'
                )}
              >
                {/* Burbuja del mensaje */}
                <div
                  className={cn(
                    'relative max-w-[75%] rounded-lg px-3 py-2 shadow-md',
                    isUser 
                      ? 'bg-blue-500 text-white rounded-br-none' 
                      : 'bg-white rounded-bl-none'
                  )}
                >
                  {/* Nombre del remitente */}
                  {!isUser && message.sender.name && (
                    <div className={cn(
                      "text-xs font-medium mb-1",
                      isUser ? 'text-blue-100' : 'text-blue-500'
                    )}>
                      {message.sender.name}
                    </div>
                  )}

                  {/* Contenido del mensaje */}
                  <div className="break-words text-[15px]">
                    {message.content}
                  </div>

                  {/* Vista previa de medios */}
                  {message.hasMedia && message.mediaUrl && (
                    <div className="mt-2 rounded-lg overflow-hidden">
                      {message.mediaType?.startsWith('image/') ? (
                        <img
                          src={message.mediaUrl}
                          alt="Media"
                          className="max-w-full h-auto rounded-lg"
                          loading="lazy"
                        />
                      ) : message.mediaType?.startsWith('video/') ? (
                        <video
                          src={message.mediaUrl}
                          controls
                          className="max-w-full h-auto rounded-lg"
                        />
                      ) : (
                        <a
                          href={message.mediaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            "flex items-center gap-2 text-sm",
                            isUser ? "text-blue-100 hover:text-white" : "text-blue-500 hover:text-blue-600"
                          )}
                        >
                          📎 Ver archivo adjunto
                        </a>
                      )}
                    </div>
                  )}

                  {/* Metadata del mensaje */}
                  <div className={cn(
                    "flex items-center justify-end gap-1 mt-1",
                    isUser ? "text-blue-100" : "text-gray-400"
                  )}>
                    <span className="text-[11px]">
                      {format(new Date(message.timestamp), 'HH:mm')}
                    </span>
                    {isUser && (
                      <span className="text-[11px]">
                        {message.status === 'sent' && '✓'}
                        {message.status === 'delivered' && '✓✓'}
                        {message.status === 'read' && (
                          <span className="text-blue-200">✓✓</span>
                        )}
                      </span>
                    )}
                  </div>

                  {/* Triángulo decorativo */}
                  <div
                    className={cn(
                      "absolute bottom-0 w-4 h-4 overflow-hidden",
                      isUser ? "-right-2" : "-left-2"
                    )}
                  >
                    <div
                      className={cn(
                        "absolute w-2 h-2 transform rotate-45 translate-x-1 translate-y-1",
                        isUser ? "bg-blue-500" : "bg-white"
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Elemento para scroll automático */}
      <div ref={messagesEndRef} />
    </div>
  )
} 