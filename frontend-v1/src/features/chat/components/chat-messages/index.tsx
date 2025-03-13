'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Check, CheckCheck, Loader2 } from 'lucide-react'
import { Message } from '@/features/chat/hooks/use-chats'
import { motion, AnimatePresence } from 'framer-motion'

interface ChatMessagesProps {
  messages: Message[]
  userId: string
  onLoadMore?: () => void
  loading?: boolean
}

export function ChatMessages({ messages, userId, onLoadMore, loading }: ChatMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const prevScrollHeight = useRef<number>(0)

  // Initial scroll to bottom
  useEffect(() => {
    if (isInitialLoad && scrollRef.current && messages.length > 0) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      setIsInitialLoad(false)
    }
  }, [messages, isInitialLoad])

  // Maintain scroll position when loading older messages
  useEffect(() => {
    if (scrollRef.current && !isInitialLoad) {
      const newScrollHeight = scrollRef.current.scrollHeight
      const heightDifference = newScrollHeight - prevScrollHeight.current
      if (heightDifference > 0 && loading) {
        scrollRef.current.scrollTop = heightDifference
      }
      prevScrollHeight.current = newScrollHeight
    }
  }, [messages, loading, isInitialLoad])

  // Set up infinite scroll for loading older messages
  useEffect(() => {
    if (onLoadMore && !observerRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && !loading) {
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
  }, [onLoadMore, loading])

  // Reverse messages array to show oldest first
  const reversedMessages = [...messages].reverse()

  return (
    <div className="h-full flex flex-col">
      <div 
        ref={scrollRef}
        className="overflow-y-auto flex-1"
      >
        {/* Messages container */}
        <div className="min-h-full">
          {/* Loading indicator */}
          {loading && (
            <div className="flex justify-center py-2">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Load more trigger */}
          {onLoadMore && <div ref={loadMoreRef} className="h-1" />}

          {/* Messages */}
          <div className="space-y-1 p-4">
            <AnimatePresence initial={false}>
              {reversedMessages.map((message, index) => {
                const isUser = message.sender.id === userId
                const showDate = index === 0 || 
                  new Date(message.timestamp).toDateString() !== 
                  new Date(reversedMessages[index - 1].timestamp).toDateString()

                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    {showDate && (
                      <div className="flex justify-center my-2">
                        <div className="bg-muted/30 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] text-muted-foreground">
                          {format(new Date(message.timestamp), "EEEE, d 'de' MMMM", { locale: es })}
                        </div>
                      </div>
                    )}
                    
                    <div className={cn(
                      "flex gap-1 items-end",
                      isUser ? "justify-end" : "justify-start"
                    )}>
                      <div className={cn(
                        "max-w-[85%] break-words rounded-lg px-3 py-2",
                        isUser 
                          ? "bg-primary text-primary-foreground rounded-tr-none" 
                          : "bg-muted rounded-tl-none"
                      )}>
                        <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                        <div className={cn(
                          "flex items-center gap-1 text-[10px]",
                          isUser ? "text-primary-foreground/70 justify-end" : "text-muted-foreground"
                        )}>
                          <span>
                            {format(new Date(message.timestamp), 'HH:mm')}
                          </span>
                          {isUser && (
                            <span className="flex items-center">
                              {message.status === 'read' ? (
                                <CheckCheck className="h-3 w-3" />
                              ) : message.status === 'delivered' ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                <Check className="h-3 w-3 opacity-50" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
} 