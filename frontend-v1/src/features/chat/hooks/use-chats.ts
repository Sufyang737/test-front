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
  payload?: {
    from?: string
    body?: string
    _data?: {
      notifyName?: string
    }
  }
}

export interface WAHAMessage {
  session: string
  payload: {
    id: string
    from: string
    body: string
    timestamp: number
    _data?: {
      notifyName?: string
    }
  }
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
      try {
        const existingConversations = await pb.collection('conversation').getList(1, 1, {
          filter: `chat_id = "${chatId}" && client_id = "${clientId}"`,
          requestKey: null
        })

        if (existingConversations.items.length > 0) {
          console.log('Found existing conversation:', existingConversations.items[0])
          return existingConversations.items[0]
        }
      } catch (error) {
        console.error('Error checking existing conversation:', error)
        throw new Error('Failed to check existing conversation')
      }

      // Create new conversation first
      let conversation
      try {
        const phoneNumber = chatId.split('@')[0]
        const conversationData = {
          client_id: clientId,
          name: selectedChat.contact.name,
          number_client: parseInt(phoneNumber),
          category: "general",
          finished_chat: false,
          chat_id: chatId,
          use_bot: false
        }

        conversation = await pb.collection('conversation').create(conversationData)
        console.log('New conversation created:', conversation)
      } catch (error) {
        console.error('Error creating conversation:', error)
        throw new Error('Failed to create conversation record')
      }

      // Create related records
      try {
        // Create profile lead first
        const profileData = {
          name_client: selectedChat.contact.name,
          conversation: conversation.id,
          client_id: clientId,
          instagram: "",
          facebook: "",
          x: "",
          name_company: "",
          description_company: ""
        }

        const profile = await pb.collection('profile_lead').create(profileData)
        console.log('Profile lead created:', profile)

        // Then create conversation details with the lead_id
        const detailsData = {
          conversation_id: conversation.id,
          client_id: clientId,
          lead_id: profile.id,
          priority: "medium",
          customer_source: "organic",
          conversation_status: "open",
          request_type: "sales inquiry",
          notes: "",
          assigned_to: ""
        }

        console.log('Creating details with data:', detailsData)
        console.log('Conversation ID:', conversation.id)
        console.log('Client ID:', clientId)
        
        try {
          const details = await pb.collection('details_conversation').create(detailsData)
          console.log('Conversation details created successfully:', details)
        } catch (detailsError: any) {
          console.error('Error response from PocketBase:', detailsError.response)
          console.error('Error data:', detailsError.data)
          console.error('Error status:', detailsError.status)
          console.error('Full error object:', JSON.stringify(detailsError, null, 2))
          console.error('Available schema:', await pb.collection('details_conversation').getFullList())
          throw detailsError
        }

      } catch (error) {
        // If any of the related records fail to create, delete the conversation
        if (conversation?.id) {
          try {
            await pb.collection('conversation').delete(conversation.id)
          } catch (deleteError) {
            console.warn('Failed to cleanup conversation:', deleteError)
          }
        }

        console.error('Error creating related records:', error)
        throw new Error('Failed to create related records. Please ensure all collections are properly configured.')
      }

      return conversation
    } catch (error) {
      console.error('Error in createOrGetConversation:', error)
      throw error
    }
  }

  const getContactInfo = async (sessionId: string, phone: string) => {
    try {
      const response = await fetch(`${WAHA_API_URL}/api/contacts?session=${sessionId}&phone=${phone}`)
      if (!response.ok) {
        console.warn(`Failed to fetch contact info for ${phone}:`, await response.text())
        return {
          name: phone,
          profilePictureUrl: null
        }
      }
      const data = await response.json()
      return data
    } catch (error) {
      console.warn('Error fetching contact info:', error)
      return {
        name: phone,
        profilePictureUrl: null
      }
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

      // Transform chat data (without waiting for contact info)
      const enrichedChats: Chat[] = paginatedData.map((chat: any) => {
        const phone = chat.id.split('@')[0]
        return {
          id: chat.id,
          contact: {
            id: phone,
            name: chat.name || phone,
            phone: phone,
            avatar: chat.picture
          },
          lastMessage: {
            content: chat.lastMessage?.body || '',
            timestamp: chat.lastMessage?.timestamp || new Date().toISOString(),
            status: chat.lastMessage?.fromMe ? 'sent' : 'delivered'
          },
          unreadCount: chat.unreadCount || 0
        }
      })

      // Update state immediately with basic data
      if (resetPage || currentPage === 1) {
        setChats(enrichedChats)
      } else {
        setChats((prev: Chat[]) => [...prev, ...enrichedChats])
      }

      // Then enrich with contact info in background
      Promise.all(
        paginatedData.map(async (chat: any, index: number) => {
          const phone = chat.id.split('@')[0]
          const contactInfo = await getContactInfo(currentSessionId, phone)
          if (contactInfo?.name && contactInfo.name !== phone) {
            return {
              ...enrichedChats[index],
              contact: {
                ...enrichedChats[index].contact,
                name: contactInfo.name,
                avatar: contactInfo.profilePictureUrl || enrichedChats[index].contact.avatar
              }
            }
          }
          return enrichedChats[index]
        })
      ).then((updatedChats) => {
        if (resetPage || currentPage === 1) {
          setChats(updatedChats)
        } else {
          setChats((prev: Chat[]) => {
            const nonUpdatedChats = prev.filter(
              (chat) => !updatedChats.find((updated) => updated.id === chat.id)
            )
            return [...nonUpdatedChats, ...updatedChats]
          })
        }
      })
      
      if (resetPage) {
        setPage(1)
      }
    } catch (error) {
      console.error('Error fetching chats:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch chats')
      setChats([])
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
          id: msg.fromMe ? 'me' : (msg.from || '').split('@')[0],
          type: msg.fromMe ? 'user' : 'contact'
        },
        status: msg.ack === 3 ? 'read' : msg.ack === 2 ? 'delivered' : 'sent',
        payload: {
          from: msg.from,
          body: msg.body,
          _data: msg._data
        }
      }))

      // Sort messages by timestamp
      transformedMessages.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )

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
    if (!activeChat || sendingMessage) return;

    try {
      setSendingMessage(true);
      setError(null);

      const currentSessionId = sessionId || await getSessionId();
      const chatId = `${activeChat}@c.us`; // Ensure proper WhatsApp chat ID format

      // Send message using WAHA API
      const response = await fetch(`${WAHA_API_URL}/api/sendText`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId,
          text: content,
          session: currentSessionId,
          linkPreview: true
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('WAHA API Error:', errorText);
        throw new Error(`Failed to send message: ${errorText}`);
      }

      const responseData = await response.json();
      console.log('Send message response:', responseData);

      // Add message to local state
      const newMessage: Message = {
        id: responseData.key?.id || Date.now().toString(),
        content,
        timestamp: new Date().toISOString(),
        sender: {
          id: 'me',
          type: 'user'
        },
        status: 'sent',
        payload: {
          from: `${clientId}@c.us`,
          body: content
        }
      };

      setMessages(prev => [...prev, newMessage]);

      // Start polling for message status updates
      const checkMessageStatus = async () => {
        try {
          const statusResponse = await fetch(
            `${WAHA_API_URL}/api/${currentSessionId}/messages/${newMessage.id}`
          );
          
          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            const newStatus = statusData.ack === 3 ? 'read' : 
                            statusData.ack === 2 ? 'delivered' : 'sent';
            
            if (newStatus !== newMessage.status) {
              setMessages(prev => 
                prev.map(msg => 
                  msg.id === newMessage.id 
                    ? { ...msg, status: newStatus }
                    : msg
                )
              );
            }

            // Stop polling if message is read
            if (newStatus === 'read') {
              return true;
            }
          }
          return false;
        } catch (error) {
          console.error('Error checking message status:', error);
          return false;
        }
      };

      // Poll for status updates every 2 seconds for up to 30 seconds
      let attempts = 0;
      const maxAttempts = 15;
      const pollInterval = setInterval(async () => {
        attempts++;
        const shouldStop = await checkMessageStatus();
        if (shouldStop || attempts >= maxAttempts) {
          clearInterval(pollInterval);
        }
      }, 2000);

      // Refresh chat list to update last message
      await fetchChats();

      return newMessage;
    } catch (error) {
      console.error('Error sending message:', error);
      setError(error instanceof Error ? error.message : 'Failed to send message');
      throw error;
    } finally {
      setSendingMessage(false);
    }
  };

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
  const loadMore = () => {
    if (hasMore && !loading && activeChat) {
      setPage(prev => prev + 1)
    }
  }

  // Subscribe to real-time updates using polling
  useEffect(() => {
    if (sessionId && activeChat) {
      const pollInterval = setInterval(async () => {
        try {
          // Poll for new messages using WAHA API
          const response = await fetch(`${WAHA_API_URL}/api/${sessionId}/chats/${activeChat}/messages`)
          if (!response.ok) {
            throw new Error('Failed to fetch messages')
          }

          const data = await response.json()
          
          // Transform messages to our format
          const transformedMessages = data.map((msg: any) => ({
            id: msg.id,
            content: msg.body || '',
            timestamp: msg.timestamp ? new Date(msg.timestamp * 1000).toISOString() : new Date().toISOString(),
            sender: {
              id: msg.fromMe ? 'me' : (msg.from || '').split('@')[0],
              type: msg.fromMe ? 'user' : 'contact'
            },
            status: msg.ack === 3 ? 'read' : msg.ack === 2 ? 'delivered' : 'sent',
            payload: {
              from: msg.from,
              body: msg.body,
              _data: msg._data
            }
          }))

          // Sort messages by timestamp
          transformedMessages.sort((a, b) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          )

          setMessages(transformedMessages)

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

  const handleIncomingMessage = async (wahaMessage: WAHAMessage) => {
    try {
      const { session, payload } = wahaMessage;
      
      // Verify this message is for the current session
      if (session !== sessionId) return;
      
      // Format message to match our interface
      const newMessage: Message = {
        id: payload.id,
        content: payload.body,
        timestamp: new Date(payload.timestamp * 1000).toISOString(),
        sender: {
          id: payload.from.split('@')[0],
          type: 'contact'
        },
        status: 'delivered',
        payload: {
          from: payload.from,
          body: payload.body,
          _data: payload._data
        }
      };

      // Add message to state
      setMessages(prev => [...prev, newMessage]);

      // Refresh chat list to update last message
      await fetchChats();
    } catch (error) {
      console.error('Error handling incoming message:', error);
    }
  };

  // Subscribe to webhook events
  useEffect(() => {
    if (!sessionId) return;

    // Create WebSocket connection for real-time updates
    const ws = new WebSocket(`${WAHA_API_URL.replace('http', 'ws')}/ws`);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'message') {
          handleIncomingMessage(data);
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.close();
    };
  }, [sessionId]);

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