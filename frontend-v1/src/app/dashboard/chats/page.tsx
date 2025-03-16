'use client';

import { useState, useEffect } from 'react';
import { useChats } from '@/features/chat/hooks/use-chats';
import { ChatList } from '@/features/chat/components/chat-list';
import { ChatMessages } from '@/features/chat/components/chat-messages';
import { ChatInput } from '@/features/chat/components/chat-input';
import { ConversationDetailsPanel } from '@/features/chat/components/conversation-details-panel';
import { ClientProfileDialog } from '@/features/chat/components/client-profile-dialog';
import { useToast } from '@/components/ui/use-toast';

export default function ChatsPage() {
  const { toast } = useToast();
  const {
    chats,
    messages,
    activeChat,
    loading,
    loadingMessages,
    hasMoreMessages,
    isFetchingMoreMessages,
    clientId,
    sendMessage,
    loadMoreMessages,
    selectChat,
    getBotStatus,
    toggleBot
  } = useChats();

  const [showProfile, setShowProfile] = useState(false);
  const [botEnabled, setBotEnabled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    if (activeChat?.id && clientId) {
      getBotStatus(activeChat.id, clientId).then(status => {
        setBotEnabled(status?.useBot ?? false);
      });
    }
  }, [activeChat?.id, clientId, getBotStatus]);

  const handleToggleBot = async () => {
    if (!activeChat?.id || !clientId) return;
    const success = await toggleBot(activeChat.id, clientId, !botEnabled);
    if (success) {
      setBotEnabled(!botEnabled);
      toast({
        title: botEnabled ? 'Bot disabled' : 'Bot enabled',
        description: `Bot has been ${botEnabled ? 'disabled' : 'enabled'} for this chat.`
      });
    } else {
      toast({
        title: 'Error',
        description: 'Failed to toggle bot status',
        variant: 'destructive'
      });
    }
  };

  const handleShowProfile = () => {
    setProfileOpen(true);
  };

  return (
    <div className="flex h-full">
      <div className="w-80 border-r">
        <ChatList />
      </div>
      <div className="flex-1 flex flex-col">
        {activeChat ? (
          <>
            <ChatMessages
              messages={messages}
              loadingMessages={loading}
              hasMoreMessages={hasMoreMessages}
              isFetchingMoreMessages={isFetchingMoreMessages}
              loadMoreMessages={loadMoreMessages}
            />
            <ChatInput
              onSendMessage={async (message) => {
                const newMessage = await sendMessage(message);
                return;
              }}
              disabled={loading}
              loading={loading}
              botEnabled={botEnabled}
            />
            <ConversationDetailsPanel
              botEnabled={botEnabled}
              onToggleBot={async () => {
                setBotEnabled(!botEnabled);
              }}
              onShowProfile={() => setProfileOpen(true)}
            />
            {profileOpen && activeChat?.id && clientId && (
              <ClientProfileDialog
                clientId={clientId}
                conversationId={activeChat.id}
              />
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">Select a chat to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}