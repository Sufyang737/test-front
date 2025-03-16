import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { ChatList } from './chat-list'
import { ChatMessages } from './chat-messages'
import { ChatInput } from './chat-input'
import { ConversationDetailsPanel } from './conversation-details-panel'
import { useChats } from '../hooks/use-chats'

export function ChatContainer() {
  const { userId } = useAuth()
  const { 
    chats, 
    activeChat, 
    loading,
    messages, 
    sendMessage, 
    selectChat,
    getBotStatus,
    toggleBot,
    loadingMessages,
    hasMoreMessages,
    loadMoreMessages,
    isFetchingMoreMessages
  } = useChats()
  const [showDetails, setShowDetails] = useState(false)
  const [botEnabled, setBotEnabled] = useState(false)

  useEffect(() => {
    if (activeChat) {
      setShowDetails(true)
    }
  }, [activeChat])

  const handleSendMessage = async (content: string, file?: File) => {
    await sendMessage(content);
  };

  if (!userId) {
    return <div>Please sign in to access the chat.</div>
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-1/4 border-r bg-white">
        <ChatList />
      </div>
      
      <div className={`flex-1 flex flex-col ${showDetails ? 'w-1/2' : 'w-3/4'}`}>
        {activeChat ? (
          <>
            <div className="flex-1 overflow-hidden">
              <ChatMessages 
                messages={messages}
                loadingMessages={loadingMessages}
                hasMoreMessages={hasMoreMessages}
                loadMoreMessages={loadMoreMessages}
                isFetchingMoreMessages={isFetchingMoreMessages}
              />
            </div>
            <div className="p-4 border-t bg-white">
              <ChatInput 
                onSendMessage={handleSendMessage}
                disabled={loading}
                botEnabled={botEnabled}
              />
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select a chat to start messaging
          </div>
        )}
      </div>

      {showDetails && activeChat && (
        <div className="w-1/4 border-l bg-white overflow-y-auto">
          <ConversationDetailsPanel
            botEnabled={botEnabled}
            onToggleBot={async () => {
              if (activeChat.id) {
                const success = await toggleBot(activeChat.id, userId, !botEnabled);
                if (success) {
                  setBotEnabled(!botEnabled);
                }
              }
            }}
            onShowProfile={() => setShowDetails(false)}
          />
        </div>
      )}
    </div>
  )
} 