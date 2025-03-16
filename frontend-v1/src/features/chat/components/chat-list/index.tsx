import { type Chat } from '../../hooks/use-chats';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { HTMLAttributes } from 'react';

export interface ChatListProps extends HTMLAttributes<HTMLDivElement> {
  chats: Chat[];
  activeChat: Chat | null;
  onChatSelect: (chat: Chat) => void;
}

export default function ChatList({ chats, activeChat, onChatSelect, className, ...props }: ChatListProps) {
  return (
    <div className={cn('h-full', className)} {...props}>
      <ScrollArea className="h-full">
        <div className="p-4 space-y-2">
          <h2 className="text-lg font-semibold mb-4">Chats</h2>
          {chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => onChatSelect(chat)}
              className={cn(
                'w-full p-4 rounded-lg text-left transition-colors',
                'hover:bg-muted',
                activeChat?.id === chat.id ? 'bg-muted' : 'bg-background'
              )}
            >
              <div className="flex flex-col">
                <span className="font-medium">{chat.name}</span>
                {chat.lastMessage && (
                  <span className="text-sm text-muted-foreground truncate">
                    {chat.lastMessage}
                  </span>
                )}
                {chat.timestamp && (
                  <span className="text-xs text-muted-foreground mt-1">
                    {new Date(chat.timestamp).toLocaleString()}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}