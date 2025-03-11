import { useEffect, useState } from 'react'
import { useChatStore, type Chat } from '../store/chat-store'
import { useAuth } from '@clerk/nextjs'
import PocketBase from 'pocketbase'
import { useDebounce } from '@/hooks/use-debounce'

const WAHA_API_URL = process.env.NEXT_PUBLIC_WAHA_API_URL
const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL)

export interface Message {
  id: string
  content: string
  timestamp: string
  sender: {
    id: string
    type: 'user' | 'contact'
  }
  status: 'sent' | 'delivered' | 'read'
}

export function useChats() {
  const { chats, activeChat, loading, error, setChats, setActiveChat, setLoading, setError } = useChatStore()
  const { userId } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [sendingMessage, setSendingMessage] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [clientId, setClientId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounce(searchQuery, 500)

  const getSessionId = async () => {
    try {
      if (!userId) throw new Error('No user ID found')

      const records = await pb.collection('clients').getList(1, 1, {
        filter: `clerk_id = "${userId}"`
      })

      if (records.items.length === 0) {
        throw new Error('No client record found')
      }

      const client = records.items[0]
      if (!client.session_id) {
        throw new Error('No WhatsApp session found. Please connect your WhatsApp first.')
      }

      setSessionId(client.session_id)
      setClientId(client.id)
      return client.session_id
    } catch (error) {
      console.error('Error getting session ID:', error)
      throw error
    }
  }

  const createOrGetConversation = async (chatId: string, selectedChat: any) => {
    try {
      if (!clientId) throw new Error('No client ID found')

      // First check if conversation exists
      const existingConversations = await pb.collection('conversation').getList(1, 1, {
        filter: `chat_id = "${chatId}" && client_id = "${clientId}"`,
        requestKey: null
      })

      if (existingConversations.items.length > 0) {
        console.log('Found existing conversation:', existingConversations.items[0])
        return existingConversations.items[0]
      }

      // If not exists, create new conversation
      const phoneNumber = chatId.split('@')[0]

      const data = {
        client_id: clientId,
        name: selectedChat.contact.name,
        number_client: parseInt(phoneNumber),
        category: "general",
        finished_chat: false,
        chat_id: chatId,
        use_bot: false
      }

      console.log('Creating new conversation:', data)
      const record = await pb.collection('conversation').create(data)
      console.log('New conversation created:', record)

      return record
    } catch (error) {
      console.error('Error in createOrGetConversation:', error)
      throw error
    }
  }

  const getContactInfo = async (sessionId: string, phone: string) => {
    try {
      const response = await fetch(`${WAHA_API_URL}/api/contacts?session=${sessionId}&phone=${phone}`)
      if (!response.ok) return null
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error fetching contact info:', error)
      return null
    }
  }

  const fetchChats = async (resetPage = false) => {
    try {
      setLoading(true)
      setError(null)

      const currentSessionId = sessionId || await getSessionId()
      const currentPage = resetPage ? 1 : page

      // Fetch chats from WAHA API with pagination
      const response = await fetch(`${WAHA_API_URL}/api/${currentSessionId}/chats/overview`)
      if (!response.ok) {
        const errorText = await response.text()
        console.error('WAHA API Error:', errorText)
        throw new Error(`Failed to fetch chats: ${errorText}`)
      }

      const data = await response.json()
      console.log('Chats overview:', data)
      
      // Filter chats based on search query
      let filteredData = data
      if (debouncedSearch) {
        filteredData = data.filter((chat: any) => {
          const name = chat.name || chat.id.split('@')[0]
          return name.toLowerCase().includes(debouncedSearch.toLowerCase())
        })
      }

      // Implement pagination
      const pageSize = 20
      const start = (currentPage - 1) * pageSize
      const end = start + pageSize
      const paginatedData = filteredData.slice(start, end)
      setHasMore(end < filteredData.length)

      // Transform and enrich chat data with contact info
      const enrichedChats: Chat[] = await Promise.all(paginatedData.map(async (chat: any) => {
        const phone = chat.id.split('@')[0]
        const contactInfo = await getContactInfo(currentSessionId, phone)
        
        return {
          id: chat.id,
          contact: {
            id: phone,
            name: contactInfo?.name || chat.name || phone,
            phone: phone,
            avatar: chat.picture || contactInfo?.profilePictureUrl
          },
          lastMessage: {
            content: chat.lastMessage?.body || '',
            timestamp: chat.lastMessage?.timestamp || new Date().toISOString(),
            status: chat.lastMessage?.fromMe ? 'sent' : 'delivered'
          },
          unreadCount: chat.unreadCount || 0
        }
      }))

      if (resetPage || currentPage === 1) {
        setChats(enrichedChats)
      } else {
        setChats((prev: Chat[]) => [...prev, ...enrichedChats])
      }
      
      if (resetPage) {
        setPage(1)
      }
    } catch (error) {
      console.error('Error fetching chats:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch chats')
      setChats([]) // Clear chats on error
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (chatId: string) => {
    try {
      setLoadingMessages(true)
      setError(null)

      const currentSessionId = sessionId || await getSessionId()

      // Fetch messages from WAHA API
      const response = await fetch(`${WAHA_API_URL}/api/${currentSessionId}/chats/${chatId}/messages`)
      if (!response.ok) {
        const errorText = await response.text()
        console.error('WAHA API Error:', errorText)
        throw new Error(`Failed to fetch messages: ${errorText}`)
      }

      const data = await response.json()
      console.log('Chat messages:', data)

      // Transform messages to our format
      const transformedMessages = data.map((msg: any) => ({
        id: msg.id,
        content: msg.body || '',
        timestamp: msg.timestamp ? new Date(msg.timestamp * 1000).toISOString() : new Date().toISOString(),
        sender: {
          id: msg.fromMe ? 'me' : msg.from,
          type: msg.fromMe ? 'user' : 'contact'
        },
        status: msg.ack || 'sent'
      }))

      setMessages(transformedMessages)
    } catch (error) {
      console.error('Error fetching messages:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch messages')
      setMessages([]) // Clear messages on error
    } finally {
      setLoadingMessages(false)
    }
  }

  const sendMessage = async (content: string) => {
    if (!activeChat || sendingMessage) return

    try {
      setSendingMessage(true)
      setError(null)

      const currentSessionId = sessionId || await getSessionId()

      console.log('Sending message to chat:', activeChat)
      console.log('Message content:', content)

      // Send message using WAHA API with correct endpoint and payload
      const response = await fetch(`${WAHA_API_URL}/api/sendText`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId: activeChat,
          text: content,
          session: currentSessionId,
          linkPreview: true
        }),
      })

      // Log the raw response for debugging
      console.log('WAHA API Response status:', response.status)
      const responseText = await response.text()
      console.log('WAHA API Response text:', responseText)

      if (!response.ok) {
        let errorMessage = 'Failed to send message'
        try {
          const errorData = JSON.parse(responseText)
          errorMessage = errorData.message || errorMessage
        } catch (e) {
          // If we can't parse the error response, use the raw text
          errorMessage = responseText || errorMessage
        }
        throw new Error(errorMessage)
      }

      let responseData
      try {
        responseData = JSON.parse(responseText)
      } catch (e) {
        console.error('Failed to parse response as JSON:', e)
        throw new Error('Invalid response from server')
      }

      // Convert timestamp to Date
      let timestamp = new Date().toISOString() // default to current time
      if (responseData.messageTimestamp) {
        // If timestamp is a string that looks like a Unix timestamp
        if (!isNaN(responseData.messageTimestamp)) {
          timestamp = new Date(parseInt(responseData.messageTimestamp) * 1000).toISOString()
        } else {
          // If it's already a formatted date string
          timestamp = new Date(responseData.messageTimestamp).toISOString()
        }
      }

      // Add message to local state
      const newMessage: Message = {
        id: responseData.key?.id || Date.now().toString(),
        content,
        timestamp,
        sender: {
          id: 'me',
          type: 'user'
        },
        status: responseData.status || 'sent'
      }
      setMessages(prev => [...prev, newMessage])

      // Refresh chats to update last message
      await fetchChats()

      return newMessage
    } catch (error) {
      console.error('Error sending message:', error)
      setError(error instanceof Error ? error.message : 'Failed to send message')
      throw error
    } finally {
      setSendingMessage(false)
    }
  }

  const selectChat = async (chatId: string) => {
    try {
      console.log('Selecting chat:', chatId)
      
      // If chatId is empty (going back to chat list on mobile)
      if (!chatId) {
        setActiveChat('')
        return
      }

      // Find the chat in our list
      const selectedChat = chats.find(chat => chat.id === chatId)
      if (!selectedChat) {
        throw new Error('Chat not found in list')
      }

      console.log('Selected chat details:', {
        id: selectedChat.id,
        name: selectedChat.contact.name,
        phone: selectedChat.contact.phone
      })

      // Create or get conversation record in PocketBase
      const conversation = await createOrGetConversation(chatId, selectedChat)
      console.log('Conversation record:', conversation)
      
      // Fetch messages for this chat
      await fetchMessages(chatId)
      
      // Update active chat
      setActiveChat(chatId)
    } catch (error) {
      console.error('Error in selectChat:', error)
      setError(error instanceof Error ? error.message : 'Failed to load chat')
    }
  }

  // Load more chats
  const loadMore = async () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1)
    }
  }

  // Subscribe to real-time updates using polling
  useEffect(() => {
    if (sessionId && activeChat) {
      const pollInterval = setInterval(async () => {
        try {
          // Poll for new messages
          const messages = await pb.collection('messages').getList(1, 50, {
            filter: `chat_id = "${activeChat}"`,
            sort: '-timestamp'
          })

          setMessages(messages.items.map(msg => ({
            id: msg.message_id,
            content: msg.content,
            timestamp: msg.timestamp,
            sender: {
              id: msg.sender,
              type: msg.from_me ? 'user' : 'contact'
            },
            status: msg.status
          })))

          // Poll for chat updates
          await fetchChats()
        } catch (error) {
          console.error('Polling error:', error)
        }
      }, 3000) // Poll every 3 seconds

      return () => clearInterval(pollInterval)
    }
  }, [sessionId, activeChat])

  // Effect for search
  useEffect(() => {
    if (sessionId) {
      fetchChats(true)
    }
  }, [debouncedSearch])

  // Initial setup
  useEffect(() => {
    if (userId) {
      getSessionId().then(() => {
        fetchChats()
      }).catch((error) => {
        console.error('Initial setup error:', error)
        setError(error instanceof Error ? error.message : 'Failed to initialize')
      })
    }
  }, [userId])

  const searchWhatsAppProfile = async (phone: string) => {
    try {
      if (!sessionId) {
        const currentSessionId = await getSessionId()
        if (!currentSessionId) throw new Error('No session ID found')
      }

      // Clean phone number (remove spaces, +, -, etc)
      const cleanPhone = phone.replace(/[\s+\-()]/g, '')
      
      // Check if contact exists
      const checkResponse = await fetch(`${WAHA_API_URL}/api/contacts/check-exists?session=${sessionId}&phone=${cleanPhone}`)
      if (!checkResponse.ok) {
        throw new Error('Failed to check contact')
      }
      const exists = await checkResponse.json()
      
      if (!exists) {
        throw new Error('Phone number is not registered on WhatsApp')
      }

      // Get contact info
      const contactResponse = await fetch(`${WAHA_API_URL}/api/contacts?session=${sessionId}&phone=${cleanPhone}`)
      if (!contactResponse.ok) {
        throw new Error('Failed to get contact info')
      }
      const contactInfo = await contactResponse.json()

      // Get profile picture
      const pictureResponse = await fetch(`${WAHA_API_URL}/api/contacts/profile-picture?session=${sessionId}&phone=${cleanPhone}`)
      const pictureData = await pictureResponse.json()

      // Get about info
      const aboutResponse = await fetch(`${WAHA_API_URL}/api/contacts/about?session=${sessionId}&phone=${cleanPhone}`)
      const aboutData = await aboutResponse.json()

      // Get recent messages directly from PocketBase
      const chatId = `${cleanPhone}@s.whatsapp.net`
      const messages = await pb.collection('messages').getList(1, 20, {
        filter: `chat_id = "${chatId}"`,
        sort: '-timestamp'
      })

      // Format the response
      const profile = {
        contact: {
          id: chatId,
          phone: cleanPhone,
          name: contactInfo.name || cleanPhone,
          picture: pictureData.profilePictureUrl,
          about: aboutData.about,
          exists: true
        },
        recentMessages: messages.items.map(msg => ({
          id: msg.message_id,
          content: msg.content,
          timestamp: msg.timestamp,
          sender: {
            id: msg.sender,
            type: msg.from_me ? 'user' : 'contact'
          },
          status: msg.status
        }))
      }

      return profile
    } catch (error) {
      console.error('Error searching WhatsApp profile:', error)
      throw error
    }
  }

  return {
    chats,
    activeChat,
    loading,
    loadingMessages,
    error,
    messages,
    sendingMessage,
    selectChat,
    refreshChats: fetchChats,
    sendMessage,
    clientId,
    searchQuery,
    setSearchQuery,
    hasMore,
    loadMore,
    page,
    searchWhatsAppProfile
  }
} 