import { ProfileSearch } from '@/features/chat/components/profile-search'

export default function SearchPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Search WhatsApp Profile</h1>
        <p className="text-muted-foreground">
          Search for a WhatsApp profile by phone number to view their information and recent messages.
        </p>
      </div>
      
      <ProfileSearch />
    </div>
  )
} 