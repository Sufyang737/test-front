import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import PocketBase from 'pocketbase'
import { Template } from '@/app/dashboard/templates/columns'

const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL)

export function useTemplates() {
  const { userId } = useAuth()
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!userId) throw new Error('No user ID found')

      // Get client record
      const clientRecords = await pb.collection('clients').getList(1, 1, {
        filter: `clerk_id = "${userId}"`
      })

      if (clientRecords.items.length === 0) {
        throw new Error('No client record found')
      }

      const clientId = clientRecords.items[0].id

      // Get templates for this client
      const records = await pb.collection('templates_chats').getList(1, 50, {
        filter: `client_id = "${clientId}"`,
        sort: '-created'
      })

      setTemplates(records.items.map(record => ({
        id: record.id,
        name_template: record.name_template,
        template: record.template,
        tags: record.tags,
        variables: record.variables,
        created: record.created,
        updated: record.updated
      })))
    } catch (error) {
      console.error('Error fetching templates:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch templates')
    } finally {
      setLoading(false)
    }
  }

  const createTemplate = async (data: Omit<Template, 'id' | 'created' | 'updated'>) => {
    try {
      if (!userId) throw new Error('No user ID found')

      // Get client record
      const clientRecords = await pb.collection('clients').getList(1, 1, {
        filter: `clerk_id = "${userId}"`
      })

      if (clientRecords.items.length === 0) {
        throw new Error('No client record found')
      }

      const clientId = clientRecords.items[0].id

      // Create template
      const record = await pb.collection('templates_chats').create({
        ...data,
        client_id: clientId
      })

      return record
    } catch (error) {
      console.error('Error creating template:', error)
      throw error
    }
  }

  const updateTemplate = async (id: string, data: Partial<Template>) => {
    try {
      const record = await pb.collection('templates_chats').update(id, data)
      return record
    } catch (error) {
      console.error('Error updating template:', error)
      throw error
    }
  }

  const deleteTemplate = async (id: string) => {
    try {
      await pb.collection('templates_chats').delete(id)
    } catch (error) {
      console.error('Error deleting template:', error)
      throw error
    }
  }

  useEffect(() => {
    if (userId) {
      fetchTemplates()
    }
  }, [userId])

  return {
    templates,
    loading,
    error,
    refreshTemplates: fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate
  }
} 