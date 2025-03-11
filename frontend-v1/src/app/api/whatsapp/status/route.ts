import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import PocketBase from 'pocketbase'

const WAHA_API_URL = process.env.NEXT_PUBLIC_WAHA_API_URL
const POCKETBASE_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090'

export async function GET() {
  try {
    const session = await auth()
    const user = await currentUser()
    
    if (!session?.userId || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessionName = user.username || 
                       user.emailAddresses[0]?.emailAddress?.split('@')[0] || 
                       `user_${session.userId}`

    console.log('Checking WAHA session status for:', sessionName)

    // Obtener la información de la sesión directamente
    const sessionResponse = await fetch(`${WAHA_API_URL}/api/sessions/${sessionName}`)
    const sessionData = await sessionResponse.json()
    console.log('Session data:', sessionData)

    if (!sessionResponse.ok) {
      return NextResponse.json({ status: 'DISCONNECTED' })
    }

    // Si la sesión está conectada (verificando el estado del engine)
    if (sessionData.engine?.state === 'CONNECTED') {
      const phoneNumber = sessionData.me.id.replace('@c.us', '')
      console.log('Phone number:', phoneNumber)

      // Buscar el cliente por su clerk_id
      console.log('Updating PocketBase for clerk_id:', session.userId)
      const clientsResponse = await fetch(`${POCKETBASE_URL}/api/collections/clients/records?filter=(clerk_id='${session.userId}')`)
      
      if (!clientsResponse.ok) {
        console.error('Failed to fetch client:', await clientsResponse.text())
        return NextResponse.json({
          status: 'CONNECTED',
          phone: phoneNumber,
          error: 'Failed to fetch client'
        })
      }

      const clientsData = await clientsResponse.json()
      console.log('Found clients:', clientsData)
      
      if (clientsData.items && clientsData.items.length > 0) {
        const client = clientsData.items[0]
        
        // Actualizar el cliente con el session_id (solo el name) y phone_client
        const updateResponse = await fetch(`${POCKETBASE_URL}/api/collections/clients/records/${client.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            session_id: sessionData.name,
            phone_client: phoneNumber
          })
        })

        const updateResult = await updateResponse.text()
        console.log('PocketBase update result:', updateResult)

        if (!updateResponse.ok) {
          return NextResponse.json({
            status: 'CONNECTED',
            phone: phoneNumber,
            error: 'Failed to update client',
            details: updateResult
          })
        }

        return NextResponse.json({
          status: 'CONNECTED',
          phone: phoneNumber,
          clientUpdated: true,
          session_id: sessionData.name
        })
      }

      return NextResponse.json({
        status: 'CONNECTED',
        phone: phoneNumber,
        error: 'No client found to update'
      })
    }

    // Si la sesión existe pero no está conectada
    return NextResponse.json({ 
      status: sessionData.status || 'DISCONNECTED',
      sessionFound: true,
      session_id: sessionData.name
    })

  } catch (error) {
    console.error('Error checking status:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 