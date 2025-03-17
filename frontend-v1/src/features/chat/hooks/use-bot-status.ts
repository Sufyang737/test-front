import { useState } from 'react'

interface BotStatus {
  useBot: boolean
  category: string
}

export function useBotStatus() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getBotStatus = async (chatId: string, clientId: string): Promise<BotStatus | null> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/chat/bot-status?chatId=${chatId}&clientId=${clientId}`)
      
      // Check content type to handle non-JSON responses
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Formato de respuesta inválido: Se esperaba JSON')
      }

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al obtener el estado del bot')
      }

      const data = await response.json()
      if (data.success && data.record) {
        return {
          useBot: data.record.useBot,
          category: data.record.category
        }
      }
      throw new Error('Formato de respuesta inválido')
    } catch (error) {
      console.error('Error getting bot status:', error)
      setError(error instanceof Error ? error.message : 'Error al obtener el estado del bot')
      return null
    } finally {
      setLoading(false)
    }
  }

  const updateBotStatus = async (chatId: string, clientId: string, useBot: boolean, category?: string): Promise<BotStatus | null> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/chat/bot-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chatId,
          clientId,
          useBot,
          category
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al actualizar el estado del bot')
      }

      const data = await response.json()
      if (data.success && data.record) {
        return {
          useBot: data.record.useBot,
          category: data.record.category
        }
      }
      throw new Error('Formato de respuesta inválido')
    } catch (error) {
      console.error('Error updating bot status:', error)
      setError(error instanceof Error ? error.message : 'Failed to update bot status')
      return null
    } finally {
      setLoading(false)
    }
  }

  const toggleBotStatus = async (chatId: string, clientId: string): Promise<BotStatus | null> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/chat/bot-status?chatId=${chatId}&clientId=${clientId}`, {
        method: 'PATCH'
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al alternar el estado del bot')
      }

      const data = await response.json()
      if (data.success && data.record) {
        return {
          useBot: data.record.useBot,
          category: data.record.category
        }
      }
      throw new Error('Formato de respuesta inválido')
    } catch (error) {
      console.error('Error toggling bot status:', error)
      setError(error instanceof Error ? error.message : 'Failed to toggle bot status')
      return null
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    error,
    getBotStatus,
    updateBotStatus,
    toggleBotStatus
  }
} 