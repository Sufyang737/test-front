import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { type Message } from '../../hooks/use-chats';
import { cn } from '@/lib/utils';

export interface ChatMessagesProps {
  messages: Message[];
  loading: boolean;
  hasMore: boolean;
  isFetchingMore: boolean;
  onLoadMore: () => Promise<void>;
}

export function ChatMessages({
  messages,
  loading,
  hasMore,
  isFetchingMore,
  onLoadMore
}: ChatMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!hasMore || isFetchingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreTriggerRef.current) {
      observer.observe(loadMoreTriggerRef.current);
    }

    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isFetchingMore, onLoadMore]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-pulse">Cargando mensajes...</div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 p-4" ref={scrollRef}>
      {hasMore && (
        <div
          ref={loadMoreTriggerRef}
          className="h-8 flex items-center justify-center"
        >
          {isFetchingMore ? (
            <div className="animate-pulse">Cargando más mensajes...</div>
          ) : (
            <div className="text-muted-foreground">Desliza para cargar más</div>
          )}
        </div>
      )}
      <div className="space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'flex',
              message.type === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            <div
              className={cn(
                'rounded-lg px-4 py-2 max-w-[80%]',
                message.type === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              )}
            >
              <div className="break-words">{message.content}</div>
              <div
                className={cn(
                  'text-xs mt-1',
                  message.type === 'user'
                    ? 'text-primary-foreground/70'
                    : 'text-muted-foreground'
                )}
              >
                {new Date(message.timestamp).toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}