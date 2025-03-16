import { useChats } from '../hooks/use-chats'
import { ChatHeader } from './chat-header'
import { ChatMessages } from './chat-messages'
import { ChatInput } from './chat-input'

export function Chat() {
  const {
    activeChat,
    messages,
    loadingMessages,
    hasMoreMessages,
    loadMoreMessages,
    isFetchingMoreMessages,
    sendMessage
  } = useChats()

  const handleSendMessage = async (content: string, file?: File) => {
    await sendMessage(content);
  };

  if (!activeChat) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <p className="text-muted-foreground">
          Selecciona un chat para comenzar
        </p>
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
        onSendMessage={handleSendMessage}
        disabled={loadingMessages}
      />
    </div>
  )
} 