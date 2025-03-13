const WAHA_API_URL = process.env.NEXT_PUBLIC_WAHA_API_URL
const POCKETBASE_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090'

async function getClientByClerkId(userId: string) {
  try {
    console.log('Buscando cliente con clerk_id:', userId)
    
    const response = await fetch(`${POCKETBASE_URL}/api/collections/clients/records?filter=(clerk_id='${userId}')`)
    
    if (!response.ok) {
      console.error('Error fetching client:', await response.text())
      return null
    }

    const data = await response.json()
    
    if (!data.items?.length) {
      console.log('No se encontró cliente con clerk_id:', userId)
      return null
    }

    console.log('Cliente encontrado:', data.items[0])
    return data.items[0]
  } catch (error) {
    console.error('Error buscando cliente:', error)
    return null
  }
}

function generateSessionName(username: string) {
  const cleanUsername = username.replace(/[^a-zA-Z0-9]/g, '');
  return `wa_${cleanUsername}`;
}

export async function getOrCreateSession(userId: string): Promise<string | null> {
  try {
    // 1. Get the existing client by clerk_id
    const client = await getClientByClerkId(userId);
    
    if (!client) {
      console.error('Cliente no encontrado para clerk_id:', userId);
      return null;
    }

    // 2. If client has an existing session, verify it in WAHA
    if (client.session_id) {
      try {
        const wahaResponse = await fetch(`${WAHA_API_URL}/api/sessions/${client.session_id}`);
        if (wahaResponse.ok) {
          console.log('Sesión existente encontrada:', client.session_id);
          return client.session_id;
        }
        // Si la sesión existe en PocketBase pero no en WAHA, la limpiamos
        await fetch(`${POCKETBASE_URL}/api/collections/clients/records/${client.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            session_id: null
          })
        });
      } catch (error) {
        console.log('Error verificando sesión existente:', error);
      }
    }

    // 3. Generate a new session name using client's username
    const sessionName = generateSessionName(client.username);

    // 4. Check if session already exists in WAHA before creating
    try {
      const checkSession = await fetch(`${WAHA_API_URL}/api/sessions/${sessionName}`);
      if (checkSession.ok) {
        console.log('La sesión ya existe en WAHA, usando:', sessionName);
        await fetch(`${POCKETBASE_URL}/api/collections/clients/records/${client.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            session_id: sessionName
          })
        });
        return sessionName;
      }
    } catch (error) {
      // Si no existe la sesión, continuamos con la creación
    }

    // 5. Create session in WAHA
    const webhookUrl = process.env.NODE_ENV === 'production'
      ? 'https://your-production-url.com/api/webhooks/whatsapp'
      : 'http://localhost:3000/api/webhooks/whatsapp';

    const createBody = {
      name: sessionName,
      start: true,
      config: {
        proxy: null,
        debug: false,
        webhooks: [
          {
            url: webhookUrl,
            events: ["session.status", "message", "message.waiting", "poll.vote"],
            retries: [
              {
                statusCodes: [500, 502, 503, 504],
                strategy: "exponential",
                maxAttempts: 5,
                initialDelay: 1000
              }
            ],
            customHeaders: [
              {
                name: "x-client-id",
                value: userId
              }
            ]
          }
        ],
        noweb: {
          store: {
            enabled: true,
            fullSync: false
          }
        }
      }
    };

    const createResponse = await fetch(`${WAHA_API_URL}/api/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(createBody)
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('Error creando sesión WAHA:', errorText);
      return null;
    }

    // 6. Update client with new session
    await fetch(`${POCKETBASE_URL}/api/collections/clients/records/${client.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        session_id: sessionName
      })
    });

    return sessionName;
  } catch (error) {
    console.error('Error en getOrCreateSession:', error);
    return null;
  }
}

export async function getSessionName(clerkId: string): Promise<string | null> {
  try {
    const client = await getClientByClerkId(clerkId)
    return client?.session_id || null
  } catch (error) {
    console.error('Error obteniendo nombre de sesión:', error)
    return null
  }
} 