import { NextResponse } from 'next/server'
import PocketBase from 'pocketbase'

const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL)

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { event, payload, session } = body

    console.log('Webhook received:', { event, session })

    // Handle different webhook events
    switch (event) {
      case 'message':
      case 'message.any':
        // Store message in PocketBase
        await pb.collection('messages').create({
          message_id: payload.id,
          chat_id: payload.to,
          content: payload.body,
          timestamp: new Date(payload.timestamp * 1000).toISOString(),
          from_me: payload.fromMe,
          sender: payload.fromMe ? 'me' : payload.from,
          status: 'sent'
        })
        break

      case 'message.ack':
        // Update message status in PocketBase
        const messages = await pb.collection('messages').getList(1, 1, {
          filter: `message_id = "${payload.id}"`
        })
        
        if (messages.items.length > 0) {
          await pb.collection('messages').update(messages.items[0].id, {
            status: getStatusFromAck(payload.ack)
          })
        }
        break

      case 'presence.update':
        // Update presence status in conversation
        const conversations = await pb.collection('conversation').getList(1, 1, {
          filter: `chat_id = "${payload.id}"`
        })

        if (conversations.items.length > 0) {
          await pb.collection('conversation').update(conversations.items[0].id, {
            last_presence: payload.status,
            last_presence_timestamp: new Date().toISOString()
          })
        }
        break
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function getStatusFromAck(ack: number): 'sent' | 'delivered' | 'read' {
  switch (ack) {
    case 1:
      return 'sent'
    case 2:
      return 'delivered'
    case 3:
      return 'read'
    default:
      return 'sent'
  }
} 