import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'

const WAHA_API_URL = process.env.NEXT_PUBLIC_WAHA_API_URL
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

function generateSessionName(userId: string) {
  // Tomar los primeros 8 caracteres del userId y añadir un timestamp
  const shortId = userId.slice(-8);
  const timestamp = Date.now().toString(36);
  return `session_${shortId}_${timestamp}`;
}

export async function POST() {
  try {
    const session = await auth()
    const user = await currentUser()
    
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Generar un nombre de sesión único
    const sessionName = generateSessionName(session.userId);

    // Asegurarnos de que la URL del webhook sea completa
    const webhookUrl = `${APP_URL}/api/webhooks/whatsapp`
    if (!webhookUrl.startsWith('http')) {
      return NextResponse.json({ 
        error: 'Invalid webhook URL. Must start with http:// or https://' 
      }, { status: 400 })
    }

    const createBody = {
      name: sessionName,
      start: true,
      config: {
        proxy: null,
        debug: false,
        webhooks: [
          {
            url: webhookUrl,
            events: [
              "session.status",
              "message",
              "message.waiting",
              "poll.vote"
            ],
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
                value: session.userId
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
    }

    console.log('Creating session with:', JSON.stringify(createBody, null, 2))

    const response = await fetch(`${WAHA_API_URL}/api/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(createBody)
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Error creating session:', error)
      
      // Si la sesión ya existe, intentar con un nuevo nombre
      if (response.status === 422) {
        const newSessionName = generateSessionName(session.userId);
        createBody.name = newSessionName;
        
        const retryResponse = await fetch(`${WAHA_API_URL}/api/sessions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(createBody)
        });

        if (!retryResponse.ok) {
          return NextResponse.json({ error: await retryResponse.text() }, { status: retryResponse.status });
        }

        const retryData = await retryResponse.json();
        console.log('Session created on retry:', retryData);
        return NextResponse.json(retryData);
      }

      return NextResponse.json({ error }, { status: response.status })
    }

    const data = await response.json()
    console.log('Session created:', data)

    return NextResponse.json(data)

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 