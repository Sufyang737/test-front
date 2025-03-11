'use client'

import { useEffect, useRef } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Check, CheckCheck } from 'lucide-react'
import { Message } from '@/features/chat/hooks/use-chats'

interface ChatMessagesProps {
  messages: Message[]
  userId: string
  onLoadMore?: () => void
}

export function ChatMessages({ messages, userId, onLoadMore }: ChatMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Scroll to bottom on new messages
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    // Set up infinite scroll
    if (onLoadMore && !observerRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            onLoadMore()
          }
        },
        { threshold: 0.1 }
      )

      if (loadMoreRef.current) {
        observerRef.current.observe(loadMoreRef.current)
      }
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [onLoadMore])

  return (
    <ScrollArea ref={scrollRef} className="h-[calc(100vh-14rem)]">
      {onLoadMore && <div ref={loadMoreRef} className="h-4" />}
      <div className="space-y-4">
        {messages.map((message, index) => {
          const isUser = message.sender.id === userId
          const showDate = index === 0 || 
            new Date(message.timestamp).toDateString() !== 
            new Date(messages[index - 1].timestamp).toDateString()

          return (
            <div key={message.id} className="space-y-2">
              {showDate && (
                <div className="flex justify-center">
                  <div className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">
                    {format(new Date(message.timestamp), "EEEE, d 'de' MMMM", { locale: es })}
                  </div>
                </div>
              )}
              
              <div className={cn(
                "flex gap-2",
                isUser ? "justify-end" : "justify-start"
              )}>
                <div className={cn(
                  "max-w-[75%] break-words rounded-2xl px-4 py-2",
                  isUser ? "bg-primary text-primary-foreground" : "bg-muted"
                )}>
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  <div className={cn(
                    "flex items-center gap-1 text-xs mt-1",
                    isUser ? "text-primary-foreground/70" : "text-muted-foreground"
                  )}>
                    <span>
                      {format(new Date(message.timestamp), 'HH:mm')}
                    </span>
                    {isUser && (
                      message.status === 'read' ? (
                        <CheckCheck className="h-3 w-3" />
                      ) : message.status === 'delivered' ? (
                        <Check className="h-3 w-3" />
                      ) : null
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </ScrollArea>
  )
} 