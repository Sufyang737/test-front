import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

const WAHA_API_URL = process.env.NEXT_PUBLIC_WAHA_API_URL
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export async function POST() {
  try {
    const session = await auth()
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Asegurarnos de que la URL del webhook sea completa
    const webhookUrl = `${APP_URL}/api/webhooks/whatsapp`
    if (!webhookUrl.startsWith('http')) {
      return NextResponse.json({ 
        error: 'Invalid webhook URL. Must start with http:// or https://' 
      }, { status: 400 })
    }

    const createBody = {
      name: "sufyang737",
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