import { useEffect, useState, useCallback } from 'react'
import { useChatStore, type Chat } from '../store/chat-store'
import { useAuth } from '@clerk/nextjs'
import { pb } from '@/lib/pocketbase'
import { useDebounce } from '@/hooks/use-debounce'
import { ClientResponseError } from 'pocketbase'

const WAHA_API_URL = process.env.NEXT_PUBLIC_WAHA_API_URL || ''
const SESSION_ID = process.env.NEXT_PUBLIC_WAHA_SESSION_ID

export interface Message {
  id: string
  content: string
  timestamp: string
  sender: {
    id: string
    type: 'user' | 'contact'
    name?: string
  }
  status: 'sent' | 'delivered' | 'read'
  hasMedia?: boolean
  mediaUrl?: string
  mediaType?: string
}

export interface WAHAMessage {
  session: string
  payload: {
    id: string
    from: string
    body: string
    timestamp: number
    hasMedia?: boolean
    mediaUrl?: string
    mediaType?: string
    _data?: {
      notifyName?: string
    }
  }
}

interface Conversation {
  id: string
  client_id: string
  use_bot: boolean
  name: string
  number_client: string
  category: string
  finished_chat: boolean
  chat_id: string
  created: string
  updated: string
}

interface MessageWithTimestamp {
  timestamp: string
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
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  const [isUpdatingBot, setIsUpdatingBot] = useState(false)
  const debouncedSearch = useDebounce(searchQuery, 500)
  const [hasMoreMessages, setHasMoreMessages] = useState(true)
  const [messagePage, setMessagePage] = useState(1)
  const [isFetchingMoreMessages, setIsFetchingMoreMessages] = useState(false)
  const MESSAGES_PER_PAGE = 20

  const getSessionId = async () => {
    try {
      // Crear una señal de cancelación
      const cancelSignal = new AbortController();

      const records = await pb.collection('clients').getList(1, 1, {
        filter: `clerk_id = "${userId}"`,
        $cancelKey: `get-session-${userId}`, // Clave única para esta solicitud
        $autoCancel: false // Deshabilitar la cancelación automática
      });

      if (records.items.length > 0) {
        const client = records.items[0];
        setClientId(client.id);
        setSessionId(client.session_id); // Guardar el sessionId en el estado
        return client.session_id;
      }

      throw new Error('No session found');
    } catch (error) {
      // Verificar si el error es por cancelación
      if (error instanceof ClientResponseError && error.isAbort) {
        console.log('Request cancelled:', error);
        return null;
      }
      console.error('Error getting session:', error);
      throw error;
    }
  };

  const initSession = async (sessionId: string) => {
    try {
      if (!WAHA_API_URL) {
        console.error('❌ WAHA_API_URL no está configurada')
        throw new Error('WAHA API URL no configurada. Verifica tu archivo .env.local')
      }

      console.log('🔄 Intentando inicializar sesión...')
      console.log('URL:', WAHA_API_URL)
      console.log('Session ID:', sessionId)

      // Verificar el estado de la sesión
      const response = await fetch(`${WAHA_API_URL}/api/sessions`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Error al verificar sesiones:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        })
        throw new Error(`Error al verificar sesiones: ${response.status} ${response.statusText}`)
      }

      const sessions = await response.json()
      console.log('✅ Sesiones disponibles:', sessions)
      const existingSession = sessions.find((s: any) => s.name === sessionId)

      if (existingSession) {
        console.log('✅ Sesión existente encontrada:', existingSession.status)
        if (existingSession.status === 'WORKING') {
          return existingSession
        }
      }

      // Si no existe la sesión o no está en estado WORKING, intentar iniciarla
      const startResponse = await fetch(`${WAHA_API_URL}/api/sessions/${sessionId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      })

      if (!startResponse.ok) {
        const errorData = await startResponse.text()
        console.error('❌ Error al iniciar sesión:', {
          status: startResponse.status,
          statusText: startResponse.statusText,
          error: errorData
        })
        throw new Error(`Error al iniciar sesión: ${startResponse.status} ${startResponse.statusText}`)
      }

      const data = await startResponse.json()
      console.log('✅ Sesión iniciada correctamente:', data)
      return data
    } catch (error) {
      console.error('❌ Error detallado al inicializar sesión:', error)
      throw error
    }
  }

  const fetchWithoutCredentials = async (url: string, options: RequestInit = {}) => {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(options.headers || {})
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Error en petición a ${url}:`, {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Error en petición: ${response.status} ${response.statusText}`);
    }

    return response;
  };

  const getContactInfo = async (sessionId: string, phone: string) => {
    try {
      const response = await fetchWithoutCredentials(`${WAHA_API_URL}/api/contacts?session=${sessionId}&phone=${phone}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.warn('⚠️ No se pudo obtener info del contacto:', error);
      return {
        name: phone,
        profilePictureUrl: null
      };
    }
  };

  const createOrGetConversation = async (chatId: string, selectedChat: Chat): Promise<Conversation> => {
    try {
      if (!clientId) throw new Error('No client ID found')

      // First check if conversation exists
      try {
        const existingConversations = await pb.collection('conversation').getList<Conversation>(1, 1, {
          filter: `chat_id = "${chatId}" && client_id = "${clientId}"`,
          requestKey: null
        })

        if (existingConversations.items.length > 0) {
          return existingConversations.items[0]
        }
      } catch (error) {
        console.error('Error checking existing conversation:', error)
        throw new Error('Failed to check existing conversation')
      }

      // Create new conversation first
      let conversation: Conversation
      try {
        const phoneNumber = chatId.split('@')[0]
        const conversationData = {
          client_id: clientId,
          name: selectedChat.contact.name,
          number_client: phoneNumber,
          category: "general",
          finished_chat: false,
          chat_id: chatId,
          use_bot: false
        }

        conversation = await pb.collection('conversation').create<Conversation>(conversationData)
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
        
        await pb.collection('details_conversation').create(detailsData)

      } catch (error) {
        // If any of the related records fail to create, delete the conversation
        if (conversation?.id) {
          try {
            await pb.collection('conversation').delete(conversation.id)
          } catch (deleteError) {
            console.error('Error deleting conversation after failed related records:', deleteError)
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

  const fetchChats = async (resetPage = false) => {
    try {
      setLoading(true)
      setError(null)

      const currentSessionId = sessionId || await getSessionId()
      const currentPage = resetPage ? 1 : page

      const response = await fetchWithoutCredentials(`${WAHA_API_URL}/api/${currentSessionId}/chats/overview`)
      const data = await response.json()
      
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

      // Transform chat data
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

      if (resetPage || currentPage === 1) {
        setChats(enrichedChats)
      } else {
        setChats((prev: Chat[]) => [...prev, ...enrichedChats])
      }

      // Enrich with contact info
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
      setError(error instanceof Error ? error.message : 'Failed to fetch chats')
      setChats([])
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (chatId: string, loadMore = false) => {
    try {
      if (!loadMore) {
        setLoadingMessages(true)
      } else {
        setIsFetchingMoreMessages(true)
      }
      setError(null)

      const currentSessionId = sessionId || await getSessionId()

      // Si estamos cargando más mensajes, usamos el ID del mensaje más antiguo como referencia
      const beforeMessageId = loadMore && messages.length > 0 ? messages[0].id : undefined

      const response = await fetchWithoutCredentials(
        `${WAHA_API_URL}/api/${currentSessionId}/chats/${chatId}/messages${beforeMessageId ? `?beforeMessageId=${beforeMessageId}&limit=${MESSAGES_PER_PAGE}` : ''}`
      )
      const data = await response.json()

      const transformedMessages = data.map((msg: any) => ({
        id: msg.id,
        content: msg.body || '',
        timestamp: msg.timestamp ? new Date(msg.timestamp * 1000).toISOString() : new Date().toISOString(),
        sender: {
          id: msg.fromMe ? 'me' : (msg.from || '').split('@')[0],
          type: msg.fromMe ? 'user' : 'contact',
          name: msg._data?.notifyName
        },
        status: msg.ack === 3 ? 'read' : msg.ack === 2 ? 'delivered' : 'sent',
        hasMedia: msg.hasMedia,
        mediaUrl: msg.media?.url,
        mediaType: msg.media?.mimetype
      }))

      // Ordenar mensajes por timestamp
      const sortByTimestamp = (a: MessageWithTimestamp, b: MessageWithTimestamp) => {
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      }

      transformedMessages.sort(sortByTimestamp)

      // Actualizar el estado de los mensajes
      if (loadMore) {
        setMessages(prev => [...transformedMessages, ...prev])
      } else {
        setMessages(transformedMessages)
      }

      // Actualizar si hay más mensajes para cargar
      setHasMoreMessages(data.length >= MESSAGES_PER_PAGE)

    } catch (error) {
      console.error('Error fetching messages:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch messages')
      if (!loadMore) {
        setMessages([])
      }
    } finally {
      if (loadMore) {
        setIsFetchingMoreMessages(false)
      } else {
        setLoadingMessages(false)
      }
    }
  }

  const loadMoreMessages = async () => {
    if (!activeChat || isFetchingMoreMessages || !hasMoreMessages) return
    await fetchMessages(activeChat.id, messages[0].id)
  }

  const sendMessage = async (content: string) => {
    if (!activeChat || sendingMessage) return;

    try {
      setSendingMessage(true);
      setError(null);

      const currentSessionId = sessionId || await getSessionId();
      const chatId = `${activeChat.id}@c.us`;

      const response = await fetchWithoutCredentials(`${WAHA_API_URL}/api/sendText`, {
        method: 'POST',
        body: JSON.stringify({
          chatId,
          text: content,
          session: currentSessionId,
          linkPreview: true
        }),
      });

      const responseData = await response.json();

      const newMessage: Message = {
        id: responseData.key?.id || Date.now().toString(),
        content,
        timestamp: new Date().toISOString(),
        sender: {
          id: 'me',
          type: 'user'
        },
        status: 'sent',
        hasMedia: responseData.hasMedia,
        mediaUrl: responseData.mediaUrl,
        mediaType: responseData.mediaType
      };

      setMessages(prev => [...prev, newMessage]);
      return newMessage;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to send message');
      throw error;
    } finally {
      setSendingMessage(false);
    }
  };

  const toggleBotStatus = async (conversationId: string, newBotStatus: boolean) => {
    try {
      setIsUpdatingBot(true)
      const updatedConversation = await pb.collection('conversations').update<Conversation>(conversationId, {
        use_bot: newBotStatus
      })
      setCurrentConversation(updatedConversation)
    } catch (err) {
      setError('Failed to update bot status')
      console.error('Error updating bot status:', err)
    } finally {
      setIsUpdatingBot(false)
    }
  }

  const selectChat = async (chatId: string) => {
    try {
      setLoading(true)
      setActiveChat(chatId)
      
      if (!clientId) throw new Error('No client ID found')

      // Get chat info for name
      const selectedChat = chats.find(chat => chat.id === chatId)
      if (!selectedChat) throw new Error('Chat not found')

      // Create or get conversation and related records
      const conversation = await createOrGetConversation(chatId, selectedChat)
      setCurrentConversation(conversation)
      
      // Fetch messages for the chat
      await fetchMessages(chatId)
    } catch (err) {
      console.error('Error in selectChat:', err)
      setError(err instanceof Error ? err.message : 'Failed to load chat')
    } finally {
      setLoading(false)
    }
  }

  // Load more chats
  const loadMore = () => {
    if (hasMore && !loading && activeChat) {
      setPage(prev => prev + 1)
    }
  }

  // Effect for search
  useEffect(() => {
    if (sessionId) {
      fetchChats(true)
    }
  }, [debouncedSearch])

  // Initial setup
  useEffect(() => {
    if (!userId) return;

    let isMounted = true;

    const initChats = async () => {
      try {
        if (!isMounted) return;

        const currentSessionId = await getSessionId();
        if (!currentSessionId || !isMounted) return;

        await initSession(currentSessionId);
        if (!isMounted) return;

        await fetchChats();
      } catch (error) {
        if (!isMounted) return;
        console.error('Error initializing chats:', error);
        setError('Failed to initialize chats');
        setLoading(false);
      }
    };

    initChats();

    // Función de limpieza
    return () => {
      isMounted = false;
      // Cancelar todas las solicitudes pendientes
      pb.autoCancellation(false);
    };
  }, [userId]);

  const searchWhatsAppProfile = async (phone: string) => {
    try {
      if (!sessionId) {
        const currentSessionId = await getSessionId()
        if (!currentSessionId) throw new Error('No session ID found')
      }

      // Clean phone number (remove spaces, +, -, etc)
      const cleanPhone = phone.replace(/[\s+\-()]/g, '')
      
      // Check if contact exists
      const checkResponse = await fetchWithoutCredentials(`${WAHA_API_URL}/api/contacts/check-exists?session=${sessionId}&phone=${cleanPhone}`)
      const exists = await checkResponse.json()
      
      if (!exists) {
        throw new Error('Phone number is not registered on WhatsApp')
      }

      // Get contact info
      const contactResponse = await fetchWithoutCredentials(`${WAHA_API_URL}/api/contacts?session=${sessionId}&phone=${cleanPhone}`)
      const contactInfo = await contactResponse.json()

      // Get profile picture
      const pictureResponse = await fetchWithoutCredentials(`${WAHA_API_URL}/api/contacts/profile-picture?session=${sessionId}&phone=${cleanPhone}`)
      const pictureData = await pictureResponse.json()

      // Get about info
      const aboutResponse = await fetchWithoutCredentials(`${WAHA_API_URL}/api/contacts/about?session=${sessionId}&phone=${cleanPhone}`)
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
      throw error
    }
  }

  const handleIncomingMessage = async (wahaMessage: WAHAMessage) => {
    try {
      const { session, payload } = wahaMessage;
      
      console.log('📱 MENSAJE NUEVO RECIBIDO:', {
        session,
        from: payload.from,
        body: payload.body,
        timestamp: payload.timestamp,
        notifyName: payload._data?.notifyName
      });
      
      if (!payload || !payload.from) {
        console.error('❌ Mensaje inválido:', wahaMessage);
        return;
      }

      // Limpiar el ID del chat (remover @c.us o @s.whatsapp.net)
      const cleanChatId = payload.from.split('@')[0];

      // Verificar si el mensaje es para el chat activo
      const isActiveChat = activeChat && (
        cleanChatId === activeChat || 
        payload.from === activeChat ||
        `${cleanChatId}@c.us` === activeChat
      );

      console.log('🔍 Verificación de chat:', {
        cleanChatId,
        activeChat,
        isActiveChat
      });

      const newMessage: Message = {
        id: payload.id,
        content: payload.body,
        timestamp: new Date(payload.timestamp * 1000).toISOString(),
        sender: {
          id: cleanChatId,
          type: 'contact',
          name: payload._data?.notifyName || cleanChatId
        },
        status: 'delivered',
        hasMedia: payload.hasMedia,
        mediaUrl: payload.mediaUrl,
        mediaType: payload.mediaType
      };

      // SIEMPRE actualizar la lista de chats primero
      console.log('🔄 Actualizando lista de chats...');
      await fetchChats();

      // Si es el chat activo, actualizar los mensajes inmediatamente
      if (isActiveChat) {
        console.log('✅ Agregando mensaje al chat activo');
        setMessages(prev => [...prev, newMessage]);
      }

    } catch (error) {
      console.error('❌ Error procesando mensaje entrante:', error);
    }
  };

  // Subscribe to webhook events
  useEffect(() => {
    if (!sessionId) return;

    console.log('🔄 Configurando WebSocket...');
    
    const wsUrl = WAHA_API_URL.replace('https://', 'wss://').replace('http://', 'ws://') + '/ws';
    console.log('📡 WebSocket URL:', wsUrl);
    
    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;
    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 5;

    const connect = () => {
      try {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log('✅ WebSocket conectado');
          reconnectAttempts = 0;
          // Enviar mensaje de autenticación
          ws?.send(JSON.stringify({
            type: 'auth',
            sessionId: sessionId
          }));
        };

        ws.onmessage = async (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('📨 Evento WebSocket recibido:', data);
            
            // Manejar diferentes tipos de eventos
            if (data.event === 'message.new' || data.event === 'message') {
              await handleIncomingMessage(data);
            } else if (data.event === 'message.update' || data.event === 'message.ack') {
              // Actualizar el estado del mensaje
              console.log('🔄 Actualizando estado del mensaje:', data);
              await fetchChats();
            }
          } catch (error) {
            console.error('❌ Error procesando evento WebSocket:', error);
          }
        };

        ws.onerror = (error) => {
          console.error('❌ Error en WebSocket:', error);
        };

        ws.onclose = () => {
          console.log('❌ WebSocket desconectado');
          
          if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
            console.log(`🔄 Intentando reconectar en ${delay/1000} segundos...`);
            
            reconnectTimeout = setTimeout(() => {
              reconnectAttempts++;
              connect();
            }, delay);
          } else {
            console.error('❌ Se alcanzó el límite máximo de intentos de reconexión');
          }
        };
      } catch (error) {
        console.error('❌ Error al crear WebSocket:', error);
      }
    };

    connect();

    // Configurar webhooks al iniciar la sesión
    const setupWebhooks = async () => {
      try {
        const response = await fetchWithoutCredentials(`${WAHA_API_URL}/api/sessions/${sessionId}/webhooks`, {
          method: 'POST',
          body: JSON.stringify({
            url: `${window.location.origin}/api/webhooks/waha`,
            events: ['message', 'message.ack', 'message.reaction', 'message.update']
          })
        });

        console.log('✅ Webhooks configurados correctamente');
      } catch (error) {
        console.error('❌ Error configurando webhooks:', error);
      }
    };

    setupWebhooks();

    return () => {
      console.log('🔄 Limpiando conexión WebSocket...');
      clearTimeout(reconnectTimeout);
      if (ws) {
        ws.close();
        ws = null;
      }
    };
  }, [sessionId]);

  const markAsUnread = async (chatId: string) => {
    try {
      if (!sessionId) {
        const currentSessionId = await getSessionId();
        if (!currentSessionId) throw new Error('No session ID found');
      }

      const response = await fetchWithoutCredentials(`${WAHA_API_URL}/api/${sessionId}/chats/${chatId}/unread`, {
        method: 'POST'
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to mark chat as unread: ${errorText}`);
      }
      
      await fetchChats();
    } catch (error) {
      throw error;
    }
  };

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
    searchWhatsAppProfile,
    markAsUnread,
    currentConversation,
    toggleBotStatus,
    isUpdatingBot,
    hasMoreMessages,
    loadMoreMessages,
    isFetchingMoreMessages,
  }
} 