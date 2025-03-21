import { NextResponse } from 'next/server';

const WAHA_API_URL = process.env.NEXT_PUBLIC_WAHA_API_URL;

if (!WAHA_API_URL) {
  throw new Error('WAHA_API_URL no está definida');
}

export async function GET(
  request: Request,
  { params }: { params: { chatId: string } }
) {
  try {
    const chatId = `${params.chatId}@c.us`
    const wahaUrl = `${WAHA_API_URL}/api/laconchadetumadre/chats/${chatId}/messages?downloadMedia=false&limit=100`

    console.log('🔍 Obteniendo mensajes para:', chatId)
    console.log('📍 URL:', wahaUrl)

    const response = await fetch(wahaUrl)
    if (!response.ok) {
      throw new Error(`Error al obtener mensajes: ${response.status} ${response.statusText}`)
    }

    const messages = await response.json()
    console.log(`✅ Mensajes obtenidos: ${messages.length}`)

    // Ordenar mensajes por timestamp de más antiguo a más reciente
    const sortedMessages = messages.sort((a: any, b: any) => a.timestamp - b.timestamp);

    return NextResponse.json({
      status: 'ok',
      messages: sortedMessages.map((msg: any) => ({
        id: msg.id,
        from: msg.from?.split('@')[0] || '',
        to: msg.to?.split('@')[0] || '',
        body: msg.body || '',
        timestamp: msg.timestamp * 1000, // Convertir a milisegundos
        fromMe: msg.fromMe,
        hasMedia: msg.hasMedia || false,
        notifyName: msg._data?.notifyName || ''
      }))
    })

  } catch (error) {
    console.error('❌ Error obteniendo mensajes:', error)
    return NextResponse.json(
      { 
        status: 'error',
        message: error instanceof Error ? error.message : 'Error obteniendo mensajes'
      },
      { status: 500 }
    )
  }
} 