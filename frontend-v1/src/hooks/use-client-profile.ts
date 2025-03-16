import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import PocketBase from 'pocketbase'

const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL)

export interface ClientProfile {
  id: string
  client_id: string
  name_company: string
  description: string
  instagram: string
  facebook: string
  website: string
  x: string
  opening_hours: string
}

export function useClientProfile() {
  const { userId } = useAuth()
  const [profile, setProfile] = useState<ClientProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProfile() {
      try {
        if (!userId) return

        // First get the client record
        const clientRecords = await pb.collection('clients').getList(1, 1, {
          filter: `clerk_id = "${userId}"`
        })

        if (clientRecords.items.length === 0) {
          throw new Error('No client record found')
        }

        const clientId = clientRecords.items[0].id

        // Then get the profile record
        const profileRecords = await pb.collection('client_profile').getList(1, 1, {
          filter: `client_id = "${clientId}"`
        })

        if (profileRecords.items.length > 0) {
          const record = profileRecords.items[0]
          const mappedProfile: ClientProfile = {
            id: record.id,
            client_id: record.client_id,
            name_company: record.name_company || '',
            description: record.description || '',
            instagram: record.instagram || '',
            facebook: record.facebook || '',
            website: record.website || '',
            x: record.x || '',
            opening_hours: record.opening_hours || ''
          }
          setProfile(mappedProfile)
        }
      } catch (err) {
        console.error('Error fetching client profile:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [userId])

  return { profile, loading, error }
} 