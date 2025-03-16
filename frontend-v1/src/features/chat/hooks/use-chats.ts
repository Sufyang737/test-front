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

interface ChatStore {
  chats: Chat[];
  activeChat: Chat | null;
  loading: boolean;
  error: string | null;
  setChats: (chats: Chat[] | ((prev: Chat[]) => Chat[])) => void;
  setActiveChat: (chat: Chat | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateChat: (chatId: string, updates: Partial<Chat>) => void;
}

export function useChats() {
  const { 
    chats, 
    activeChat, 
    loading, 
    error, 
    setChats, 
    setActiveChat, 
    setLoading, 
    setError,
    updateChat 
  } = useChatStore();
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
      console.log('🔄 Consultando información del cliente...')
      const records = await pb.collection('clients').getList(1, 1, {
        filter: `clerk_id = "${userId}"`,
        $cancelKey: `get-session-${userId}`,
        $autoCancel: false
      });

      if (records.items.length > 0) {
        const client = records.items[0];
        console.log('✅ Cliente encontrado:', client.id)
        setClientId(client.id);
        setSessionId(client.session_id);
        return client.session_id;
      }

      console.error('❌ No se encontró el cliente')
      throw new Error('No session found');
    } catch (error) {
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
        throw new Error('WAHA API URL no configurada. Verifica tu archivo .env.local')
      }

      console.log('🔄 Inicializando sesión...')
      
      // Verificar el estado de la sesión
      const response = await fetchWithoutCredentials(`${WAHA_API_URL}/api/sessions`)
      const sessions = await response.json()
      
      const existingSession = sessions.find((s: any) => s.name === sessionId)
      
      if (existingSession?.status === 'WORKING') {
        console.log('✅ Sesión activa encontrada')
        return existingSession
      }

      // Si no existe o no está activa, intentar iniciarla
      console.log('🔄 Iniciando nueva sesión...')
      const startResponse = await fetchWithoutCredentials(`${WAHA_API_URL}/api/sessions/${sessionId}/start`, {
        method: 'POST'
      })

      if (!startResponse.ok) {
        throw new Error(`Error al iniciar sesión: ${startResponse.status}`)
      }

      const data = await startResponse.json()
      console.log('✅ Sesión iniciada correctamente')
      return data
    } catch (error) {
      console.error('❌ Error al inicializar sesión:', error)
      setError('Error al inicializar la sesión de WhatsApp')
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
      setError(null);

      const currentSessionId = sessionId || await getSessionId();
      if (!currentSessionId) {
        throw new Error('No se pudo obtener el ID de sesión');
      }

      const currentPage = resetPage ? 1 : page;
      const limit = 20;
      const offset = (currentPage - 1) * limit;
      
      console.log('🔄 Obteniendo chats...');
      const response = await fetchWithoutCredentials(
        `${WAHA_API_URL}/api/${currentSessionId}/chats/overview`
      );
      
      if (!response.ok) {
        throw new Error(`Error al obtener chats: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Chats obtenidos:', data.length);

      let filteredData = data;
      if (debouncedSearch) {
        filteredData = data.filter((chat: any) => {
          const name = chat.name || chat.id;
          return name.toLowerCase().includes(debouncedSearch.toLowerCase());
        });
      }

      // Aplicar paginación en el cliente
      const start = offset;
      const end = start + limit;
      const paginatedData = filteredData.slice(start, end);

      const enrichedChats: Chat[] = paginatedData.map((chat: any) => ({
        id: chat.id,
        contact: {
          id: chat.id,
          name: chat.name || chat.id.split('@')[0],
          phone: chat.id.split('@')[0],
          avatar: chat.picture || null
        },
        lastMessage: chat.lastMessage ? {
          content: chat.lastMessage.body || '',
          timestamp: chat.lastMessage.timestamp ? 
            new Date(chat.lastMessage.timestamp * 1000).toISOString() : 
            new Date().toISOString(),
          status: chat.lastMessage.fromMe ? 'sent' : 'delivered'
        } : null,
        unreadCount: chat.unreadCount || 0
      }));

      if (resetPage || currentPage === 1) {
        setChats(enrichedChats);
      } else {
        setChats(prev => [...prev, ...enrichedChats]);
      }

      setHasMore(end < filteredData.length);

      if (resetPage) {
        setPage(1);
      }

    } catch (error) {
      console.error('❌ Error al obtener chats:', error);
      setError(error instanceof Error ? error.message : 'Error al cargar los chats');
      setChats([]);
    }
  };

  const fetchMessages = async (chatId: string, loadMore = false) => {
    try {
      setError(null);

      const currentSessionId = sessionId || await getSessionId();
      if (!currentSessionId) {
        throw new Error('No se pudo obtener el ID de sesión');
      }

      const currentMessagePage = loadMore ? messagePage + 1 : 1;
      const offset = (currentMessagePage - 1) * MESSAGES_PER_PAGE;

      console.log('🔄 Obteniendo mensajes del chat:', chatId, loadMore ? '(cargando más)' : '');
      const response = await fetchWithoutCredentials(
        `${WAHA_API_URL}/api/${currentSessionId}/chats/${chatId}/messages?limit=${MESSAGES_PER_PAGE}&offset=${offset}&downloadMedia=true`
      );

      if (!response.ok) {
        throw new Error(`Error al obtener mensajes: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Mensajes obtenidos:', data.length);

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
        mediaUrl: msg.mediaUrl,
        mediaType: msg.mediaType
      }));

      if (loadMore) {
        setMessages(prev => [...prev, ...transformedMessages]);
        setMessagePage(currentMessagePage);
      } else {
        setMessages(transformedMessages);
        setMessagePage(1);
      }

      setHasMoreMessages(data.length >= MESSAGES_PER_PAGE);

    } catch (error) {
      console.error('Error fetching messages:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch messages');
      if (!loadMore) {
        setMessages([]);
      }
    }
  };

  const loadMoreMessages = async () => {
    if (!activeChat || isFetchingMoreMessages || !hasMoreMessages) return;
    await fetchMessages(activeChat.id, true);
  };

  const formatChatId = (id: string) => {
    if (!id) return id;
    return id.includes('@') ? id : `${id}@c.us`;
  };

  const selectChat = async (chatId: string) => {
    try {
      if (!chatId) return;

      console.log('🔄 Seleccionando chat:', chatId);

      // Get chat info for name
      const selectedChat = chats.find(chat => chat.id === chatId);
      if (!selectedChat) {
        console.error('❌ Chat no encontrado. Chat buscado:', chatId);
        console.error('Chats disponibles:', chats.map(c => c.id));
        throw new Error('Chat no encontrado');
      }

      // Si es el mismo chat activo, solo actualizamos mensajes
      if (activeChat?.id === chatId) {
        await fetchMessages(chatId);
        return;
      }

      // Establecer el chat activo inmediatamente para mejor UX
      setActiveChat(selectedChat);

      // Obtener conversación y mensajes en paralelo
      const [conversation, messages] = await Promise.all([
        createOrGetConversation(chatId, selectedChat),
        fetchMessages(chatId, false)
      ]);

      setCurrentConversation(conversation);

    } catch (err) {
      console.error('❌ Error en selectChat:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar el chat');
    }
  };

  const sendMessage = async (content: string) => {
    if (!activeChat || sendingMessage) return;

    try {
      setSendingMessage(true);
      setError(null);

      const currentSessionId = sessionId || await getSessionId();
      if (!currentSessionId) throw new Error('No session ID found');

      const response = await fetchWithoutCredentials(`${WAHA_API_URL}/api/sendText`, {
        method: 'POST',
        body: JSON.stringify({
          chatId: activeChat.id,
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

      // Actualizar el último mensaje en el chat activo
      updateChat(activeChat.id, {
        lastMessage: {
          content,
          timestamp: new Date().toISOString(),
          status: 'sent'
        }
      });

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

  // Load more chats
  const loadMore = () => {
    if (hasMore && !loading && activeChat) {
      setPage(prev => prev + 1)
    }
  }

  // Initial setup
  useEffect(() => {
    if (!userId) return;

    let isMounted = true;
    let wsCleanup: (() => void) | null = null;

    const initChats = async () => {
      try {
        if (!isMounted) return;

        const currentSessionId = await getSessionId();
        if (!currentSessionId || !isMounted) return;

        await initSession(currentSessionId);
        if (!isMounted) return;

        // Cargar chats solo si no hay
        if (chats.length === 0) {
          await fetchChats();
        }

        // Configurar WebSocket
        if (!wsCleanup) {
          wsCleanup = setupWebSocket(currentSessionId);
        }
      } catch (error) {
        if (!isMounted) return;
        console.error('Error initializing chats:', error);
        setError('Failed to initialize chats');
      }
    };

    initChats();

    return () => {
      isMounted = false;
      if (wsCleanup) {
        wsCleanup();
        wsCleanup = null;
      }
    };
  }, [userId]);

  // Effect for search - optimizado para evitar recargas innecesarias
  useEffect(() => {
    if (!sessionId || !debouncedSearch) return;
    
    // No hacemos nada aquí - la búsqueda será manual
  }, [debouncedSearch, sessionId]);

  // Separar la lógica del WebSocket en una función independiente
  const setupWebSocket = (sessionId: string) => {
    console.log('🔄 Configurando WebSocket...')
    
    const wsUrl = WAHA_API_URL.replace('https://', 'wss://').replace('http://', 'ws://') + '/ws'
    let ws: WebSocket | null = null
    let reconnectTimeout: NodeJS.Timeout | null = null
    let reconnectAttempts = 0
    const MAX_RECONNECT_ATTEMPTS = 5
    let isIntentionalClose = false

    const connect = () => {
      if (isIntentionalClose || ws?.readyState === WebSocket.OPEN) return;

      try {
        ws = new WebSocket(wsUrl)

        ws.onopen = () => {
          console.log('✅ WebSocket conectado')
          reconnectAttempts = 0
          // Enviar autenticación después de un breve retraso
          setTimeout(() => {
            ws?.send(JSON.stringify({
              type: 'auth',
              session: sessionId // Cambiado de sessionId a session
            }))
          }, 100)
        }

        ws.onmessage = async (event) => {
          try {
            const data = JSON.parse(event.data)
            if (data.event === 'message.new' || data.event === 'message') {
              await handleIncomingMessage(data)
            }
          } catch (error) {
            console.error('❌ Error procesando mensaje WebSocket:', error)
          }
        }

        ws.onerror = (error) => {
          if (!isIntentionalClose) {
            console.error('❌ Error en WebSocket:', error)
          }
        }

        ws.onclose = (event) => {
          console.log('WebSocket cerrado con código:', event.code)
          if (!isIntentionalClose && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000)
            console.log(`🔄 Reconectando en ${delay/1000}s...`)
            if (reconnectTimeout) clearTimeout(reconnectTimeout)
            reconnectTimeout = setTimeout(() => {
              reconnectAttempts++
              connect()
            }, delay)
          }
        }
      } catch (error) {
        if (!isIntentionalClose) {
          console.error('❌ Error al crear WebSocket:', error)
        }
      }
    }

    connect()

    return () => {
      isIntentionalClose = true
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
        reconnectTimeout = null
      }
      if (ws) {
        ws.close()
        ws = null
      }
    }
  }

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
      
      if (!payload || !payload.from) {
        console.error('❌ Mensaje inválido:', wahaMessage);
        return;
      }

      const isActiveChat = activeChat?.id === payload.from;

      const newMessage: Message = {
        id: payload.id,
        content: payload.body,
        timestamp: new Date(payload.timestamp * 1000).toISOString(),
        sender: {
          id: payload.from,
          type: 'contact',
          name: payload._data?.notifyName
        },
        status: 'delivered',
        hasMedia: payload.hasMedia,
        mediaUrl: payload.mediaUrl,
        mediaType: payload.mediaType
      };

      // Actualizar mensajes si es el chat activo
      if (isActiveChat) {
        setMessages(prev => [...prev, newMessage]);
      }

      // Actualizar el chat en la lista sin recargar
      const targetChat = chats.find(chat => chat.id === payload.from);
      if (targetChat) {
        const updatedChat: Chat = {
          ...targetChat,
          lastMessage: {
            content: payload.body,
            timestamp: new Date(payload.timestamp * 1000).toISOString(),
            status: 'delivered' as const
          },
          unreadCount: isActiveChat ? 0 : targetChat.unreadCount + 1
        };

        // Actualizar el chat en la lista manteniendo el orden
        setChats(prev => {
          const otherChats = prev.filter(c => c.id !== payload.from);
          return [updatedChat, ...otherChats];
        });
      }

    } catch (error) {
      console.error('❌ Error procesando mensaje entrante:', error);
    }
  };

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