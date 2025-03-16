import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import PocketBase from 'pocketbase'

const WAHA_API_URL = process.env.NEXT_PUBLIC_WAHA_API_URL
const POCKETBASE_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL
const POCKETBASE_TOKEN_ADMIN = process.env.POCKETBASE_TOKEN_ADMIN || ''

if (!POCKETBASE_URL) {
  throw new Error('NEXT_PUBLIC_POCKETBASE_URL no está configurado')
}

if (!POCKETBASE_TOKEN_ADMIN) {
  throw new Error('POCKETBASE_TOKEN_ADMIN no está configurado')
}

const pb = new PocketBase(POCKETBASE_URL)

export async function GET() {
  try {
    const session = await auth()
    const user = await currentUser()
    
    if (!session?.userId || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Autenticar con PocketBase usando el token de admin
    pb.authStore.save(POCKETBASE_TOKEN_ADMIN)
    console.log('✅ Token de admin guardado')

    // Buscar el cliente por clerk_id
    console.log('🔍 Buscando cliente con clerk_id:', session.userId)
    try {
      const clientsResponse = await pb.collection('clients').getFirstListItem(`clerk_id = "${session.userId}"`)
      console.log('✅ Cliente encontrado:', clientsResponse)

      // Si encontramos el cliente, verificar la sesión de WhatsApp
      const sessionName = user.username || 
                         user.emailAddresses[0]?.emailAddress?.split('@')[0] || 
                         `user_${session.userId}`

      console.log('Checking WAHA session status for:', sessionName)
      const sessionResponse = await fetch(`${WAHA_API_URL}/api/sessions/${sessionName}`)
      const sessionData = await sessionResponse.json()
      console.log('Session data:', sessionData)

      if (!sessionResponse.ok) {
        return NextResponse.json({ status: 'DISCONNECTED' })
      }

      // Si la sesión está conectada
      if (sessionData.engine?.state === 'CONNECTED') {
        const phoneNumber = sessionData.me.id.replace('@c.us', '')
        console.log('Phone number:', phoneNumber)

        // Actualizar el cliente con el session_id y phone_client
        try {
          const updatedClient = await pb.collection('clients').update(clientsResponse.id, {
            session_id: sessionData.name,
            phone_client: phoneNumber
          })

          console.log('✅ Cliente actualizado:', updatedClient)
          return NextResponse.json({
            status: 'CONNECTED',
            phone: phoneNumber,
            clientUpdated: true,
            session_id: sessionData.name,
            client: updatedClient
          })
        } catch (error) {
          console.error('❌ Error actualizando cliente:', error)
          return NextResponse.json({
            status: 'CONNECTED',
            phone: phoneNumber,
            error: 'Failed to update client',
            details: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }

      // Si la sesión existe pero no está conectada
      return NextResponse.json({ 
        status: sessionData.status || 'DISCONNECTED',
        sessionFound: true,
        session_id: sessionData.name,
        client: clientsResponse
      })

    } catch (error) {
      console.error('❌ Error buscando cliente:', error)
      // Si el error es que no se encontró el cliente
      if (error.status === 404) {
        return NextResponse.json({
          status: 'ERROR',
          error: 'No client found',
          clerk_id: session.userId
        })
      }
      throw error
    }

  } catch (error) {
    console.error('Error general:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 