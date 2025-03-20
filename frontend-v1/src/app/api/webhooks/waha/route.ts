import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { Server } from 'socket.io'
import { headers } from 'next/headers'

const SOCKET_PORT = 3001
const io = new Server({
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
})

// Inicializar Socket.IO solo una vez
if (!global.io) {
  io.listen(SOCKET_PORT)
  console.log(`🚀 Socket.IO iniciado en puerto ${SOCKET_PORT}`)
  global.io = io
}

export async function POST(request: Request) {
  console.log('📩 Webhook recibido de WAHA')
  
  try {
    const body = await request.json()
    console.log('📦 Datos del webhook:', JSON.stringify(body, null, 2))

    // Verificar que sea un evento de mensaje
    if (body.event === 'message') {
      const message = body.payload
      const messageData = {
        id: message.id,
        from: message.from,
        to: message.to,
        body: message.body,
        fromMe: message.fromMe,
        timestamp: message.timestamp
      }
      
      console.log('💬 Nuevo mensaje recibido:', messageData)

      // Emitir el mensaje por WebSocket
      if (global.io) {
        global.io.emit('message.new', messageData)
        console.log('📡 Mensaje emitido por WebSocket')
      }

      return NextResponse.json({ status: 'ok' }, { status: 200 })
    }

    // Para otros tipos de eventos
    if (body.event === 'message.ack') {
      console.log('✅ Confirmación de mensaje:', body.payload)
      if (global.io) {
        global.io.emit('message.ack', body.payload)
      }
    } else if (body.event === 'message.reaction') {
      console.log('😀 Reacción a mensaje:', body.payload)
      if (global.io) {
        global.io.emit('message.reaction', body.payload)
      }
    } else if (body.event === 'presence.update') {
      console.log('👤 Actualización de presencia:', body.payload)
      if (global.io) {
        global.io.emit('presence.update', body.payload)
      }
    }

    return NextResponse.json({ status: 'ok' }, { status: 200 })
  } catch (error) {
    console.error('❌ Error en webhook:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error procesando webhook' },
      { status: 500 }
    )
  }
} 