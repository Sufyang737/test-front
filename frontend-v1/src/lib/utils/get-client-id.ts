'use client'

import { useUser } from '@clerk/nextjs'
import PocketBase from 'pocketbase'

const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL)

// Autenticar con el token de administrador
if (process.env.NEXT_PUBLIC_POCKETBASE_ADMIN_TOKEN) {
  pb.authStore.save(process.env.NEXT_PUBLIC_POCKETBASE_ADMIN_TOKEN)
}

export async function getClientId(clerkUserId: string): Promise<string | null> {
  try {
    const record = await pb.collection('clients').getFirstListItem(
      `clerk_id = "${clerkUserId}"`
    )
    return record?.id || null
  } catch (error) {
    console.error('Error getting client ID:', error)
    return null
  }
}

export function useClientId() {
  const { user, isLoaded } = useUser()

  const getClientIdByUser = async () => {
    if (!isLoaded) {
      throw new Error('Loading user data...')
    }

    if (!user) {
      throw new Error('No authenticated user')
    }

    try {
      // Find client record by clerk_id
      const record = await pb.collection('clients').getFirstListItem(`clerk_id="${user.id}"`)
      
      if (!record?.id) {
        throw new Error('No client record found')
      }

      return record.id
    } catch (error) {
      console.error('Error getting client ID:', error)
      throw error
    }
  }

  return { getClientId: getClientIdByUser, isLoaded }
} 