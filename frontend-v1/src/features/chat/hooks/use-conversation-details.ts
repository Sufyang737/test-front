import { useState } from 'react'
import PocketBase from 'pocketbase'

const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL)

export type Priority = 'low' | 'medium' | 'high' | 'urgent'
export type ConversationStatus = 'open' | 'pending' | 'resolved' | 'closed'
export type RequestType = 'initial_contact' | 'support' | 'sales' | 'complaint' | 'other'

export interface ConversationDetails {
  id: string
  conversation_id: string
  client_id: string
  lead_id: string
  priority: Priority
  customer_source: string
  conversation_status: ConversationStatus
  request_type: RequestType
  notes?: string
  assigned_to?: string
  last_updated: string
}

export function useConversationDetails() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [details, setDetails] = useState<ConversationDetails | null>(null)

  const getDetails = async (conversationId: string): Promise<ConversationDetails | null> => {
    try {
      setLoading(true)
      setError(null)

      const record = await pb.collection('details_conversation').getFirstListItem(`conversation_id="${conversationId}"`)
      
      const details: ConversationDetails = {
        id: record.id,
        conversation_id: record.conversation_id,
        client_id: record.client_id,
        lead_id: record.lead_id,
        priority: record.priority,
        customer_source: record.customer_source,
        conversation_status: record.conversation_status,
        request_type: record.request_type,
        notes: record.notes,
        assigned_to: record.assigned_to,
        last_updated: record.updated
      }

      setDetails(details)
      return details
    } catch (error) {
      console.error('Error getting conversation details:', error)
      setError(error instanceof Error ? error.message : 'Failed to get conversation details')
      return null
    } finally {
      setLoading(false)
    }
  }

  const updateDetails = async (
    conversationId: string,
    updates: Partial<Omit<ConversationDetails, 'id' | 'conversation_id' | 'client_id' | 'lead_id' | 'last_updated'>>
  ): Promise<ConversationDetails | null> => {
    try {
      setLoading(true)
      setError(null)

      const record = await pb.collection('details_conversation').getFirstListItem(`conversation_id="${conversationId}"`)
      
      const updatedRecord = await pb.collection('details_conversation').update(record.id, {
        ...updates,
        last_updated: new Date().toISOString()
      })

      const updatedDetails: ConversationDetails = {
        id: updatedRecord.id,
        conversation_id: updatedRecord.conversation_id,
        client_id: updatedRecord.client_id,
        lead_id: updatedRecord.lead_id,
        priority: updatedRecord.priority,
        customer_source: updatedRecord.customer_source,
        conversation_status: updatedRecord.conversation_status,
        request_type: updatedRecord.request_type,
        notes: updatedRecord.notes,
        assigned_to: updatedRecord.assigned_to,
        last_updated: updatedRecord.updated
      }

      setDetails(updatedDetails)
      return updatedDetails
    } catch (error) {
      console.error('Error updating conversation details:', error)
      setError(error instanceof Error ? error.message : 'Failed to update conversation details')
      return null
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    error,
    details,
    getDetails,
    updateDetails
  }
} 