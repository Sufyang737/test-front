import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useConversationDetails, type Priority, type ConversationStatus, type RequestType } from '../hooks/use-conversation-details'

interface ConversationDetailsPanelProps {
  botEnabled: boolean
  onToggleBot: () => Promise<void>
  onShowProfile: () => void
}

export function ConversationDetailsPanel({ 
  botEnabled,
  onToggleBot,
  onShowProfile
}: ConversationDetailsPanelProps) {
  return (
    <div className="w-80 border-l p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Bot Status</Label>
          <Button 
            variant="outline" 
            size="sm"
            onClick={onToggleBot}
          >
            {botEnabled ? 'Disable Bot' : 'Enable Bot'}
          </Button>
        </div>
        <div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={onShowProfile}
          >
            View Profile
          </Button>
        </div>
      </div>
    </div>
  );
} 