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

    // Primero, buscar en la tabla conversation por chat_id
    const conversations = await pb.collection('conversation').getList(1, 1, {
      filter: `chat_id = "${chatId}"`,
      fields: 'client_id'
    })

    if (conversations.items.length === 0) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    const clientId = conversations.items[0].client_id

    // Luego, buscar en la tabla clients usando el client_id
    try {
      const client = await pb.collection('clients').getOne(clientId, {
        fields: 'id,session_id'
      })

      return NextResponse.json({
        success: true,
        record: {
          id: client.id,
          session_id: client.session_id
        }
      })
    } catch (clientError) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

  } catch (error: any) {
    console.error('Error fetching client:', error)
    
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