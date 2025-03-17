import { ProfileSearch } from '@/features/chat/components/profile-search'

export default function SearchPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Buscar Perfil de WhatsApp</h1>
        <p className="text-muted-foreground">
          Busca un perfil de WhatsApp por número de teléfono para ver su información y mensajes recientes.
        </p>
      </div>
      
      <ProfileSearch />
    </div>
  )
} 