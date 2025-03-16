'use client'

import { useEffect, useState } from 'react'
import { ChatList } from '@/features/chat/components/chat-list'
import { ChatMessages } from '@/features/chat/components/chat-messages'
import { ChatInput } from '@/features/chat/components/chat-input'
import { ClientProfileDialog } from '@/features/chat/components/client-profile-dialog'
import { Heading } from '@/components/ui/heading'
import { useChats, type Message } from '@/features/chat/hooks/use-chats'
import { useBotStatus } from '@/features/chat/hooks/use-bot-status'
import { Loader2, MessageSquare, Bot, Info } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { useAuth } from '@clerk/nextjs'

export default function ChatsPage() {
  const { userId } = useAuth()
  const {
    chats,
    messages,
    loading,
    error,
    activeChat,
    clientId,
    sendMessage,
    selectChat,
    sendingMessage
  } = useChats()

  const {
    loading: loadingBot,
    error: botError,
    getBotStatus,
    updateBotStatus,
    toggleBotStatus
  } = useBotStatus()

  const [botEnabled, setBotEnabled] = useState(false)
  const [showProfile, setShowProfile] = useState(false)

  useEffect(() => {
    if (activeChat && clientId) {
      getBotStatus(activeChat, clientId).then(status => {
        setBotEnabled(status?.useBot ?? false)
      })
    }
  }, [activeChat, clientId, getBotStatus])

  const handleToggleBot = async () => {
    if (activeChat && clientId) {
      const newStatus = !botEnabled
      await toggleBotStatus(activeChat, clientId)
      setBotEnabled(newStatus)
    }
  }

  const selectedChat = chats.find(chat => chat.id === activeChat)

  const handleSendMessage = async (content: string) => {
    if (activeChat) {
      await sendMessage(content)
    }
  }

  if (!userId) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center p-4">
        <Alert className="max-w-md">
          <AlertTitle>No user found</AlertTitle>
          <AlertDescription>Please sign in to access chats.</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (chats.length === 0) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center p-4">
        <Alert className="max-w-md">
          <MessageSquare className="h-4 w-4" />
          <AlertTitle>No chats found</AlertTitle>
          <AlertDescription>
            Start a conversation on WhatsApp to see it here.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-10rem)] flex-col gap-4 p-4">
      <div className="flex justify-between items-center">
        <Heading
          title="WhatsApp Chats"
          description="Manage your WhatsApp conversations with customers."
        />
      </div>

      <div className="grid flex-1 gap-4 md:grid-cols-[300px_1fr]">
        <div className="flex flex-col">
          <ChatList
            chats={chats}
            activeChat={activeChat}
            onChatSelect={selectChat}
          />
        </div>

        <div className="flex flex-col">
          {selectedChat ? (
            <>
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-3">
                  <div className="font-medium">
                    {selectedChat.contact.name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {selectedChat.contact.phone}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowProfile(true)}
                  >
                    <Info className="h-5 w-5" />
                  </Button>
                  <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-lg">
                    <Bot className={cn("h-5 w-5", botEnabled ? "text-green-500" : "text-muted-foreground")} />
                    <Switch
                      checked={botEnabled}
                      onCheckedChange={handleToggleBot}
                      disabled={loadingBot}
                    />
                    <span className={cn(
                      "text-sm font-medium",
                      botEnabled ? "text-green-500" : "text-muted-foreground"
                    )}>
                      {loadingBot ? "Actualizando..." : botEnabled ? "Bot Activado" : "Bot Desactivado"}
                    </span>
                  </div>
                </div>
              </div>

              <ScrollArea className="flex-1 p-4">
                <ChatMessages
                  messages={messages}
                  userId={userId}
                  loading={false}
                  onLoadMore={() => {}}
                />
              </ScrollArea>
              <div className="p-4">
                <ChatInput
                  onSend={handleSendMessage}
                  disabled={sendingMessage}
                  loading={sendingMessage}
                />
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-sm text-muted-foreground">
                Select a chat to start messaging
              </p>
            </div>
          )}
        </div>
      </div>

      {selectedChat && clientId && showProfile && activeChat && (
        <ClientProfileDialog
          conversationId={activeChat}
          clientId={clientId}
        />
      )}
    </div>
  )
} 