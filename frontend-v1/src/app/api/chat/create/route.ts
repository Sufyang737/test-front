import { NextResponse } from 'next/server'
import PocketBase from 'pocketbase'

const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL)

// Configurar el token de admin
const adminToken = process.env.POCKETBASE_TOKEN_ADMIN

if (!adminToken) {
  console.error('POCKETBASE_TOKEN_ADMIN no está configurado')
}

// Establecer el token de admin
pb.authStore.save(adminToken!, null)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { 
      use_bot, 
      name, 
      number_client, 
      category, 
      finished_chat, 
      chat_id,
      session_name  // This is the session_id in our database
    } = body

    if (!session_name) {
      return NextResponse.json(
        { error: 'Session name is required' },
        { status: 400 }
      )
    }

    // Get client record by session_id
    const clients = await pb.collection('clients').getList(1, 1, {
      filter: `session_id = "${session_name}"`,
      requestKey: null
    })

    if (clients.items.length === 0) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    const client = clients.items[0]

    // Create new conversation with all the provided data
    const conversation = await pb.collection('conversation').create({
      client_id: client.id,
      use_bot: use_bot ?? true,
      name: name ?? '',
      number_client: number_client ?? null,
      category: category ?? 'general',
      finished_chat: finished_chat ?? false,
      chat_id: chat_id ?? `chat_${Date.now()}`  // Use provided chat_id or generate one
    })

    return NextResponse.json({
      success: true,
      record: {
        id: conversation.id,
        chatId: conversation.chat_id,
        useBot: conversation.use_bot,
        name: conversation.name,
        numberClient: conversation.number_client,
        category: conversation.category,
        finishedChat: conversation.finished_chat,
        clientId: client.id
      }
    })
  } catch (error: any) {
    console.error('Error creating conversation:', error)
    
    if (error.status === 403) {
      return NextResponse.json(
        {
          error: 'Error de permisos',
          details: 'Token de admin inválido o expirado'
        },
        { status: 403 }
      )
    }

    if (error.isAbort) {
      return NextResponse.json(
        {
          error: 'La solicitud fue cancelada',
          details: 'Por favor, intenta de nuevo'
        },
        { status: 408 }
      )
    }

    return NextResponse.json(
      {
        error: 'Error procesando la solicitud',
        details: error.message
      },
      { status: error.status || 500 }
    )
  }
} 