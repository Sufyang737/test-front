'use client'

import { useUser } from '@clerk/nextjs'
import PocketBase from 'pocketbase'

const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL)

export async function getClientId(sessionId: string) {
  try {
    // Find client record by session_id
    const record = await pb.collection('clients').getFirstListItem(`session_id="${sessionId}"`)
    
    if (!record?.id) {
      throw new Error('No client record found')
    }

    return record.id
  } catch (error) {
    console.error('Error getting client ID:', error)
    throw error
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