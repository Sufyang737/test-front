import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'

const WAHA_API_URL = process.env.NEXT_PUBLIC_WAHA_API_URL

export async function GET() {
  try {
    const session = await auth()
    const user = await currentUser()
    
    if (!session?.userId || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Usar el username o email como nombre de sesión
    const sessionName = user.username || 
                       user.emailAddresses[0]?.emailAddress?.split('@')[0] || 
                       `user_${session.userId}`

    console.log('Getting QR for session:', sessionName)

    // Verificar si la sesión existe
    const checkSession = await fetch(`${WAHA_API_URL}/api/sessions/${sessionName}`)
    
    // Si la sesión no existe, la creamos
    if (!checkSession.ok) {
      console.log('Session does not exist, creating...')
      
      const createBody = {
        name: sessionName,
        start: true,
        config: {
          proxy: null,
          debug: false,
          webhooks: [
            {
              url: process.env.NODE_ENV === 'production'
                ? 'https://your-production-url.com/api/webhooks/whatsapp'
                : 'http://localhost:3000/api/webhooks/whatsapp',
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

      const createResponse = await fetch(`${WAHA_API_URL}/api/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(createBody)
      })

      if (!createResponse.ok) {
        const error = await createResponse.text()
        console.error('Failed to create session:', error)
        return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
      }

      console.log('Session created successfully')
    }

    // Esperar un momento para que la sesión se inicialice
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Obtener el QR como PNG
    const qrResponse = await fetch(`${WAHA_API_URL}/api/${sessionName}/auth/qr`)
    if (!qrResponse.ok) {
      const error = await qrResponse.text()
      console.error('Failed to get QR:', error)
      return NextResponse.json({ error: 'Failed to get QR code' }, { status: 500 })
    }

    // Devolver la imagen directamente
    const headers = new Headers()
    headers.set('Content-Type', 'image/png')
    
    return new NextResponse(qrResponse.body, {
      status: 200,
      headers
    })

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 