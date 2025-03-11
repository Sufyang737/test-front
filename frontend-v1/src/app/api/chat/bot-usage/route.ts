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

// GET endpoint to check bot usage
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const chatId = searchParams.get('chatId')

    if (!chatId) {
      return NextResponse.json(
        { error: 'Chat ID is required' },
        { status: 400 }
      )
    }

    // Buscar en la tabla conversation por chat_id
    const conversations = await pb.collection('conversation').getList(1, 1, {
      filter: `chat_id = "${chatId}"`,
      fields: 'use_bot,category',
      requestKey: null // Evitar auto-cancelación
    })

    if (conversations.items.length === 0) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    const conversation = conversations.items[0]

    return NextResponse.json({
      success: true,
      record: {
        chatId,
        useBot: conversation.use_bot,
        category: conversation.category
      }
    })

  } catch (error: any) {
    console.error('Error checking bot usage:', error)
    
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