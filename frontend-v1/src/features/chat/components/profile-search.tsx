'use client';

import { useState } from 'react'
import { useChats } from '../hooks/use-chats'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import { Loader2, Search } from 'lucide-react'
import { format } from 'date-fns'

interface WhatsAppProfile {
  contact: {
    id: string
    phone: string
    name: string
    picture?: string
    about?: string
    exists: boolean
  }
  recentMessages: {
    id: string
    content: string
    timestamp: string
    sender: {
      id: string
      type: 'user' | 'contact'
    }
    status: 'sent' | 'delivered' | 'read'
  }[]
}

export function ProfileSearch() {
  const { searchWhatsAppProfile } = useChats()
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<WhatsAppProfile | null>(null)
  const [error, setError] = useState('')

  const handleSearch = async () => {
    if (!phone) return
    
    setLoading(true)
    setError('')
    setProfile(null)

    try {
      const result = await searchWhatsAppProfile(phone)
      const typedProfile: WhatsAppProfile = {
        contact: {
          id: result.contact.id,
          phone: result.contact.phone,
          name: result.contact.name || result.contact.phone,
          picture: result.contact.picture,
          about: result.contact.about,
          exists: result.contact.exists
        },
        recentMessages: result.recentMessages.map(msg => ({
          id: msg.id,
          content: msg.content,
          timestamp: msg.timestamp,
          sender: {
            id: msg.sender.id,
            type: msg.sender.type === 'user' ? 'user' : 'contact'
          },
          status: msg.status === 'sent' || msg.status === 'delivered' || msg.status === 'read' ? msg.status : 'sent'
        }))
      }
      setProfile(typedProfile)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error searching profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex gap-2">
        <Input
          placeholder="Enter phone number (e.g. 1234567890)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button onClick={handleSearch} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>
      </div>

      {error && (
        <div className="text-sm text-red-500">
          {error}
        </div>
      )}

      {profile && (
        <Card className="p-4 space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              {profile.contact.picture ? (
                <img src={profile.contact.picture} alt={profile.contact.name} />
              ) : (
                <div className="bg-primary text-primary-foreground h-full w-full flex items-center justify-center text-xl">
                  {profile.contact.name[0]}
                </div>
              )}
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold">{profile.contact.name}</h3>
              <p className="text-sm text-muted-foreground">{profile.contact.phone}</p>
              {profile.contact.about && (
                <p className="text-sm text-muted-foreground mt-1">{profile.contact.about}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Recent Messages</h4>
            {profile.recentMessages.length > 0 ? (
              <div className="space-y-2">
                {profile.recentMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-2 rounded-lg ${
                      msg.sender.type === 'user' ? 'bg-primary/10 ml-auto' : 'bg-muted'
                    } max-w-[80%]`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(msg.timestamp), 'MMM d, HH:mm')}
                      </span>
                      {msg.sender.type === 'user' && (
                        <span className="text-xs text-muted-foreground">
                          {msg.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No recent messages</p>
            )}
          </div>
        </Card>
      )}
    </div>
  )
} 