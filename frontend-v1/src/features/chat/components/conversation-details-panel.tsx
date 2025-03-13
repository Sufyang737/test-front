import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useConversationDetails, type Priority, type ConversationStatus, type RequestType } from '../hooks/use-conversation-details'

interface ConversationDetailsPanelProps {
  conversationId: string
  onClose?: () => void
}

export function ConversationDetailsPanel({ conversationId, onClose }: ConversationDetailsPanelProps) {
  const { loading, error, details, getDetails, updateDetails } = useConversationDetails()

  useEffect(() => {
    if (conversationId) {
      getDetails(conversationId)
    }
  }, [conversationId])

  const handleUpdatePriority = async (value: Priority) => {
    await updateDetails(conversationId, { priority: value })
  }

  const handleUpdateStatus = async (value: ConversationStatus) => {
    await updateDetails(conversationId, { conversation_status: value })
  }

  const handleUpdateType = async (value: RequestType) => {
    await updateDetails(conversationId, { request_type: value })
  }

  const handleUpdateNotes = async (notes: string) => {
    await updateDetails(conversationId, { notes })
  }

  if (loading) {
    return <div className="p-4">Loading...</div>
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>
  }

  if (!details) {
    return <div className="p-4">No details found</div>
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Conversation Details</h3>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        )}
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Priority</Label>
          <Select value={details.priority} onValueChange={handleUpdatePriority}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={details.conversation_status} onValueChange={handleUpdateStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Request Type</Label>
          <Select value={details.request_type} onValueChange={handleUpdateType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="initial_contact">Initial Contact</SelectItem>
              <SelectItem value="support">Support</SelectItem>
              <SelectItem value="sales">Sales</SelectItem>
              <SelectItem value="complaint">Complaint</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Notes</Label>
          <Textarea
            value={details.notes || ''}
            onChange={(e) => handleUpdateNotes(e.target.value)}
            placeholder="Add notes about this conversation..."
            className="min-h-[100px]"
          />
        </div>

        <div className="pt-2 text-sm text-gray-500">
          Last updated: {new Date(details.last_updated).toLocaleString()}
        </div>
      </div>
    </Card>
  )
} 