import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    // Mostrar el webhook completo
    console.log('\n🔔 NUEVO MENSAJE RECIBIDO 🔔')
    console.log('================================')
    console.log('📦 DATOS COMPLETOS DEL WEBHOOK:')
    console.log(JSON.stringify(data, null, 2))
    console.log('================================')

    // Extraer y mostrar los campos principales
    const session = String(data.session)
    const fromUser = String(data.payload.from).split('@')[0]
    const incomingMsg = String(data.payload.body)
    const timestamp = String(data.payload.timestamp)
    const notifyName = data.payload._data?.notifyName || ''
    
    console.log('\n📱 DATOS PROCESADOS:')
    console.log('================================')
    console.log(`🆔 Session ID: ${session}`)
    console.log(`👤 From: ${fromUser}`)
    console.log(`💬 Message: ${incomingMsg}`)
    console.log(`👋 Notify Name: ${notifyName}`)
    console.log(`🕒 Timestamp: ${new Date(Number(timestamp) * 1000).toLocaleString()}`)
    console.log('================================\n')

    // Crear el objeto de mensaje procesado
    const processedMessage = {
      session,
      from: fromUser,
      message: incomingMsg,
      timestamp,
      notifyName
    }

    // Guardar el mensaje procesado (aquí puedes añadir tu lógica de almacenamiento)
    console.log('💾 Mensaje guardado:', processedMessage)

    return NextResponse.json({ 
      status: 'ok',
      message: 'Webhook recibido y procesado correctamente',
      timestamp: new Date().toISOString(),
      data: processedMessage
    })

  } catch (error) {
    console.error('\n❌ ERROR EN WEBHOOK ❌')
    console.error('================================')
    console.error('Error:', error)
    console.error('URL:', request.url)
    console.error('Method:', request.method)
    console.error('Headers:', JSON.stringify(Object.fromEntries(request.headers), null, 2))
    console.error('================================\n')

    return NextResponse.json(
      { 
        status: 'error',
        message: error instanceof Error ? error.message : 'Error procesando webhook',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
} 