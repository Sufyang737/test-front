import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { ChatList } from './chat-list'
import { ChatMessages } from './chat-messages'
import { ChatInput } from './chat-input'
import { ConversationDetailsPanel } from './conversation-details-panel'
import { useChats } from '../hooks/use-chats'

export function ChatContainer() {
  const { userId, user } = useAuth()
  const { 
    chats, 
    activeChat, 
    loading, 
    error, 
    messages, 
    sendMessage, 
    selectChat,
    currentConversation,
    toggleBotStatus,
    isUpdatingBot
  } = useChats()
  const [showDetails, setShowDetails] = useState(false)
  const isSupport = user?.publicMetadata?.role === 'support'

  useEffect(() => {
    if (activeChat && isSupport) {
      setShowDetails(true)
    }
  }, [activeChat, isSupport])

  if (!userId) {
    return <div>Please sign in to access the chat.</div>
  }

  if (error) {
    return <div className="text-red-500">{error}</div>
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-1/4 border-r bg-white">
        <ChatList
          chats={chats}
          activeChat={activeChat}
          loading={loading}
          onSelectChat={selectChat}
        />
      </div>
      
      <div className={`flex-1 flex flex-col ${showDetails && isSupport ? 'w-1/2' : 'w-3/4'}`}>
        {activeChat ? (
          <>
            <div className="flex-1 overflow-hidden">
              <ChatMessages messages={messages} />
            </div>
            <div className="p-4 border-t bg-white">
              <ChatInput 
                onSend={sendMessage}
                disabled={loading}
                currentConversation={currentConversation}
                onToggleBot={toggleBotStatus}
                isUpdatingBot={isUpdatingBot}
              />
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select a chat to start messaging
          </div>
        )}
      </div>

      {isSupport && showDetails && activeChat && (
        <div className="w-1/4 border-l bg-white overflow-y-auto">
          <ConversationDetailsPanel
            conversationId={activeChat}
            onClose={() => setShowDetails(false)}
          />
        </div>
      )}
    </div>
  )
} 