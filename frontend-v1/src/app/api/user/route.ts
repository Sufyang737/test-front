import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { getOrCreateClient } from '@/lib/utils/pocketbase'

export async function GET() {
  try {
    const session = await auth()
    const userId = session?.userId
    
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const user = await currentUser()
    if (!user) {
      return new NextResponse('User not found', { status: 404 })
    }

    // Asegurarnos de tener los campos requeridos
    const firstName = user.firstName || 'User'
    const lastName = user.lastName || userId.substring(0, 8)
    const username = user.username || user.emailAddresses[0]?.emailAddress?.split('@')[0] || `user_${userId}`

    // Obtener o crear el cliente con la información de Clerk
    try {
      const client = await getOrCreateClient(userId, {
        first_name: firstName,
        last_name: lastName,
        username: username
      })
      return NextResponse.json(client)
    } catch (error) {
      console.error('Error creating client:', error)
      return new NextResponse('Failed to create client record', { status: 400 })
    }
  } catch (error) {
    console.error('Error getting user:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 