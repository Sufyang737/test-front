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

// GET endpoint to check bot status
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const chatId = searchParams.get('chatId')
    const clientId = searchParams.get('clientId')

    if (!chatId || !clientId) {
      return NextResponse.json(
        { error: 'Chat ID and Client ID are required' },
        { status: 400 }
      )
    }

    // Get conversation record
    const conversations = await pb.collection('conversation').getList(1, 1, {
      filter: `chat_id = "${chatId}" && client_id = "${clientId}"`,
      requestKey: null // Avoid auto-cancellation
    })

    if (conversations.items.length === 0) {
      return NextResponse.json({
        success: true,
        record: {
          useBot: false,
          category: 'general'
        }
      })
    }

    const conversation = conversations.items[0]
    return NextResponse.json({
      success: true,
      record: {
        useBot: conversation.use_bot,
        category: conversation.category
      }
    })
  } catch (error: any) {
    console.error('Error checking chat existence:', error)
    
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

// POST endpoint to update bot status
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { chatId, useBot, category, clientId } = body

    if (!chatId || !clientId) {
      return NextResponse.json(
        { error: 'Chat ID and Client ID are required' },
        { status: 400 }
      )
    }

    // Get conversation record
    const conversations = await pb.collection('conversation').getList(1, 1, {
      filter: `chat_id = "${chatId}" && client_id = "${clientId}"`,
      requestKey: null
    })

    let conversation
    if (conversations.items.length === 0) {
      // Create new conversation if it doesn't exist
      conversation = await pb.collection('conversation').create({
        chat_id: chatId,
        client_id: clientId,
        use_bot: useBot ?? false,
        category: category || 'general',
        finished_chat: false
      })
    } else {
      // Update existing conversation
      conversation = await pb.collection('conversation').update(conversations.items[0].id, {
        use_bot: useBot ?? conversations.items[0].use_bot,
        category: category || conversations.items[0].category
      })
    }

    return NextResponse.json({
      success: true,
      record: {
        chatId,
        useBot: conversation.use_bot,
        category: conversation.category
      }
    })
  } catch (error: any) {
    console.error('Error updating bot status:', error)
    
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

// PATCH endpoint to toggle bot status
export async function PATCH(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const chatId = searchParams.get('chatId')
    const clientId = searchParams.get('clientId')

    if (!chatId || !clientId) {
      return NextResponse.json(
        { error: 'Chat ID and Client ID are required' },
        { status: 400 }
      )
    }

    // Get conversation record
    const conversations = await pb.collection('conversation').getList(1, 1, {
      filter: `chat_id = "${chatId}" && client_id = "${clientId}"`,
      requestKey: null
    })

    if (conversations.items.length === 0) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    // Toggle bot status
    const conversation = await pb.collection('conversation').update(conversations.items[0].id, {
      use_bot: !conversations.items[0].use_bot
    })

    return NextResponse.json({
      success: true,
      record: {
        chatId,
        useBot: conversation.use_bot,
        category: conversation.category
      }
    })
  } catch (error: any) {
    console.error('Error toggling bot status:', error)
    
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