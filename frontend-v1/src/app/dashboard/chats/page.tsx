'use client'

import { ChatList } from '@/features/chat/components/chat-list'
import { ChatMessages } from '@/features/chat/components/chat-messages'
import { ChatInput } from '@/features/chat/components/chat-input'
import { Heading } from '@/components/ui/heading'
import { useChats } from '@/features/chat/hooks/use-chats'
import { useBotStatus } from '@/features/chat/hooks/use-bot-status'
import { Loader2, MessageSquare, Bot } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { useEffect, useState } from 'react'

export default function ChatsPage() {
  const {
    chats,
    activeChat,
    loading,
    loadingMessages,
    error,
    messages,
    sendingMessage,
    selectChat,
    sendMessage,
    refreshChats,
    clientId,
    searchQuery,
    setSearchQuery,
    hasMore,
    loadMore,
    page
  } = useChats()

  const {
    loading: loadingBot,
    error: botError,
    getBotStatus,
    toggleBotStatus
  } = useBotStatus()

  const [botEnabled, setBotEnabled] = useState(false)

  useEffect(() => {
    if (activeChat && clientId) {
      getBotStatus(activeChat, clientId).then((status) => {
        if (status) {
          setBotEnabled(status.useBot)
        }
      })
    }
  }, [activeChat, clientId])

  const handleToggleBot = async () => {
    if (!activeChat || !clientId) return
    
    const status = await toggleBotStatus(activeChat, clientId)
    if (status) {
      setBotEnabled(status.useBot)
    }
  }

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    if (scrollHeight - scrollTop <= clientHeight * 1.5) {
      loadMore()
    }
  }

  const handleSendMessage = async (content: string) => {
    await sendMessage(content);
  };

  if (error || botError) {
    return (
      <div className="p-4 space-y-4">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{error || botError}</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refreshChats(true)}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const selectedChat = chats.find(chat => chat.id === activeChat)

  return (
    <div className="flex h-[calc(100vh-10rem)] flex-col gap-4 p-4">
      <Heading
        title="WhatsApp Chats"
        description="Manage your WhatsApp conversations with customers."
      />
      <div className="flex-1 min-h-0 rounded-lg border bg-background shadow-sm">
        <div className="grid h-full lg:grid-cols-[280px_1fr]">
          {/* Chat List */}
          <div className="border-r">
            <ChatList
              chats={chats}
              activeChat={activeChat}
              onChatSelect={selectChat}
            />
          </div>

          {/* Chat Messages */}
          <div className="flex flex-col">
            {activeChat ? (
              <>
                <ScrollArea className="flex-1">
                  {loadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <ChatMessages
                      messages={messages}
                      userId="me"
                    />
                  )}
                </ScrollArea>

                {/* Chat Input */}
                <div className="p-4 border-t bg-muted/10">
                  <ChatInput
                    onSend={handleSendMessage}
                    disabled={!activeChat || sendingMessage}
                    loading={sendingMessage}
                  />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
                <MessageSquare className="h-12 w-12 text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-semibold">No chat selected</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose a conversation from the list to start messaging
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 