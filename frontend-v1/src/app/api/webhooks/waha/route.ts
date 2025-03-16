import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  console.log('🎯 WEBHOOK RECIBIDO - INICIO DEL PROCESO')
  
  try {
    // Log de headers
    const headers = Object.fromEntries(request.headers.entries())
    console.log('📋 Headers recibidos:', JSON.stringify(headers, null, 2))

    // Log del body completo
    const data = await request.json()
    console.log('📦 Body completo recibido:', JSON.stringify(data, null, 2))

    // Extraer datos relevantes
    const session = String(data.session)
    const payload = data.payload
    
    console.log('🔍 Datos extraídos:')
    console.log('- Session:', session)
    console.log('- Payload:', JSON.stringify(payload, null, 2))
    
    if (!payload) {
      console.error('❌ ERROR: Payload inválido')
      console.error('Data recibida:', JSON.stringify(data, null, 2))
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
    }

    // Extraer y limpiar el número de teléfono
    const fromUser = String(payload.from).split('@')[0]
    
    // Extraer otros campos
    const incomingMsg = String(payload.body)
    const timestamp = String(payload.timestamp)
    const notifyName = String(payload._data?.notifyName || '')
    
    console.log('✅ Datos procesados:')
    console.log({
      session,
      fromUser,
      incomingMsg,
      timestamp,
      notifyName,
      rawPayload: payload
    })

    // Emitir evento para el WebSocket
    const wsMessage = {
      event: 'message.new',
      session,
      payload: {
        ...payload,
        notifyName
      }
    }
    
    console.log('📤 Mensaje WebSocket preparado:', JSON.stringify(wsMessage, null, 2))
    console.log('🎯 WEBHOOK PROCESADO CORRECTAMENTE')

    return NextResponse.json({ status: 'OK' })

  } catch (error) {
    console.error('❌ ERROR EN WEBHOOK:', error)
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace available')
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
} 