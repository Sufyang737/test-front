import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import PocketBase from 'pocketbase'

const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || '')

export async function GET() {
  try {
    const session = await auth()
    const user = await currentUser()
    
    if (!session?.userId || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Intentar autenticar con PocketBase primero
    try {
      const token = await session.getToken()
      if (!token) {
        throw new Error('No token available')
      }
      
      pb.authStore.save(token, null)
      
      // Verificar si el cliente existe
      const existingClient = await pb.collection('clients').getFirstListItem(`clerk_id = "${session.userId}"`)
      
      return NextResponse.json({
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.emailAddresses[0]?.emailAddress,
        userId: session.userId,
        clientId: existingClient.id,
        token
      })
      
    } catch (pbError: any) { // Using any here because PocketBase error type is not well defined
      // Si el cliente no existe, lo creamos
      if (pbError.status === 404) {
        const newClient = await pb.collection('clients').create({
          first_name: user.firstName || 'User',
          last_name: user.lastName || session.userId,
          clerk_id: session.userId,
          username: user.username || user.emailAddresses[0]?.emailAddress || `user_${session.userId}`,
          phone_client: null,
          session_id: '',
          created: new Date().toISOString(),
          updated: new Date().toISOString()
        })
        
        const token = await session.getToken()
        if (!token) {
          throw new Error('No token available after client creation')
        }
        
        return NextResponse.json({
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          email: user.emailAddresses[0]?.emailAddress,
          userId: session.userId,
          clientId: newClient.id,
          token
        })
      }
      
      throw pbError
    }

  } catch (error) {
    console.error('Error in user endpoint:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 