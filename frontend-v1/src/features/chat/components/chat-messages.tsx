import { useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Check, CheckCheck } from 'lucide-react'

interface Message {
  id: string
  content: string
  timestamp: string
  sender: {
    id: string
    type: 'user' | 'contact'
  }
  status: 'sent' | 'delivered' | 'read'
}

interface ChatMessagesProps {
  messages: Message[]
  userId: string
}

export function ChatMessages({ messages, userId }: ChatMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const lastMessageRef = useRef<HTMLDivElement>(null)

  // Function to scroll to bottom
  const scrollToBottom = () => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Group messages by date
  const groupedMessages = messages.reduce((groups: Record<string, Message[]>, message) => {
    const date = format(new Date(message.timestamp), 'yyyy-MM-dd')
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(message)
    return groups
  }, {})

  return (
    <ScrollArea ref={scrollRef} className="h-full">
      <div className="flex flex-col justify-end min-h-full">
        <div className="flex-1" />
        <div className="space-y-6 p-4">
          {Object.entries(groupedMessages).map(([date, dateMessages]) => (
            <div key={date} className="space-y-4">
              <div className="sticky top-0 z-10 flex justify-center">
                <div className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded-md">
                  {format(new Date(date), 'MMMM d, yyyy')}
                </div>
              </div>

              <div className="space-y-4">
                {dateMessages.map((message, index) => {
                  const isUser = message.sender.id === userId
                  const isLast = index === dateMessages.length - 1

                  return (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-2",
                        isUser ? "justify-end" : "justify-start"
                      )}
                      ref={isLast ? lastMessageRef : undefined}
                    >
                      <div
                        className={cn(
                          "rounded-lg px-3 py-2 max-w-[85%] break-words",
                          isUser
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}
                      >
                        <div className="whitespace-pre-wrap">{message.content}</div>
                        <div
                          className={cn(
                            "flex items-center gap-1 mt-1",
                            isUser
                              ? "text-primary-foreground/60 justify-end"
                              : "text-muted-foreground"
                          )}
                        >
                          <span className="text-[10px]">
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
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </ScrollArea>
  )
} 