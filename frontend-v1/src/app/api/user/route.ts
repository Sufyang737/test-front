import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { authPocketBase, getClientByClerkId, createClient } from '@/lib/pocketbase'

export async function GET() {
  try {
    const session = await auth()
    const user = await currentUser()
    
    if (!session?.userId || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
      const token = await session.getToken()
      if (!token) {
        throw new Error('No token available')
      }

      // Autenticar con PocketBase
      await authPocketBase(token)
      
      // Buscar cliente existente
      let client = await getClientByClerkId(session.userId)
      
      // Si no existe, crear uno nuevo
      if (!client) {
        client = await createClient({
          first_name: user.firstName || 'User',
          last_name: user.lastName || session.userId,
          clerk_id: session.userId,
          username: user.username || user.emailAddresses[0]?.emailAddress || `user_${session.userId}`,
          phone_client: null,
          session_id: '',
          created: new Date().toISOString(),
          updated: new Date().toISOString()
        })
      }

      return NextResponse.json({
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.emailAddresses[0]?.emailAddress,
        userId: session.userId,
        clientId: client.id,
        token
      })

    } catch (error) {
      console.error('Error processing request:', error)
      throw error
    }

  } catch (error) {
    console.error('Error in user endpoint:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 