import { useChats } from '../hooks/use-chats'
import { ChatHeader } from './chat-header'
import { ChatMessages } from './chat-messages'
import { ChatInput } from './chat-input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

export function Chat() {
  const {
    activeChat,
    messages,
    loadingMessages,
    hasMoreMessages,
    loadMoreMessages,
    isFetchingMoreMessages,
    sendMessage,
    error
  } = useChats()

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!activeChat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-chat-pattern">
        <div className="text-center space-y-2 p-4 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm">
          <h2 className="text-xl font-medium">
            Selecciona un chat para comenzar
          </h2>
          <p className="text-muted-foreground">
            Elige un chat de la lista para ver los mensajes
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <ChatHeader chat={activeChat} />
      
      <ChatMessages
        messages={messages}
        loadingMessages={loadingMessages}
        hasMoreMessages={hasMoreMessages}
        loadMoreMessages={loadMoreMessages}
        isFetchingMoreMessages={isFetchingMoreMessages}
      />
      
      <ChatInput
        onSendMessage={sendMessage}
        disabled={loadingMessages}
      />
    </div>
  )
} 