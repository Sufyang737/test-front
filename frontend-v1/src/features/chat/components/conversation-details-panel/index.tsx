import { Button } from '@/components/ui/button';
import { Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ConversationDetailsPanelProps {
  botEnabled: boolean;
  onToggleBot: () => Promise<void>;
  onShowProfile: () => void;
}

export function ConversationDetailsPanel({
  botEnabled,
  onToggleBot,
  onShowProfile
}: ConversationDetailsPanelProps) {
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Detalles de la Conversación</h2>
      <div className="space-y-4">
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={onShowProfile}
        >
          <User className="mr-2 h-4 w-4" />
          Ver Perfil
        </Button>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start',
            botEnabled && 'bg-primary text-primary-foreground hover:bg-primary/90'
          )}
          onClick={onToggleBot}
        >
          <Bot className="mr-2 h-4 w-4" />
          {botEnabled ? 'Desactivar Bot' : 'Activar Bot'}
        </Button>
      </div>
    </div>
  );
}
