import { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { UserCircle, Loader2 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import PocketBase from 'pocketbase'

const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL)

interface ProfileLead {
  id: string;
  name_client: string;
  email: string;
  phone: string;
  instagram?: string;
  facebook?: string;
  x?: string;
  description?: string;
  name_company?: string;
  description_company?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface RecordModel extends ProfileLead {
  collectionId: string;
  collectionName: string;
}

interface ClientProfileProps {
  conversationId: string
  clientId: string
}

const newProfileDefaults: Partial<ProfileLead> = {
  name_client: '',
  email: '',
  phone: '',
  instagram: '',
  facebook: '',
  x: '',
  description: '',
  name_company: '',
  description_company: '',
  status: 'active'
};

export function ClientProfileDialog({ conversationId, clientId }: ClientProfileProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileLead | null>(null);
  const { toast } = useToast();
  const adminToken = process.env.NEXT_PUBLIC_POCKETBASE_ADMIN_TOKEN;

  const fetchProfile = useCallback(async () => {
    try {
      if (!adminToken) {
        throw new Error('No se encontró el token de administrador');
      }

      setLoading(true);
      
      const records = await pb.collection('profile_lead').getList(1, 1, {
        filter: `client_id = "${clientId}"`
      });

      if (records.items.length > 0) {
        const data = records.items[0] as RecordModel;
        setProfile(data);
      } else {
        // Create new profile with defaults
        const newProfile = {
          ...newProfileDefaults,
          client_id: clientId,
          conversation: conversationId
        };
        
        const createdProfile = await pb.collection('profile_lead').create(newProfile) as RecordModel;
        setProfile(createdProfile);
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el perfil del cliente',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [clientId, conversationId, adminToken, toast]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!profile?.id || !adminToken) return

    try {
      setSaving(true)
      pb.authStore.save(adminToken)

      const formData = new FormData(e.currentTarget)
      const data = {
        instagram: formData.get('instagram') || '',
        facebook: formData.get('facebook') || '',
        x: formData.get('x') || '',
        name_client: formData.get('name_client') || '',
        name_company: formData.get('name_company') || '',
        description_company: formData.get('description_company') || '',
        conversation: conversationId,
        client_id: clientId
      }

      await pb.collection('profile_lead').update(profile.id, data)
      
      toast({
        title: "Perfil actualizado",
        description: "La información del cliente ha sido actualizada correctamente"
      })
      
      setIsOpen(false)
    } catch (error) {
      console.error('Error al actualizar el perfil:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el perfil del cliente"
      })
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchProfile()
    }
  }, [isOpen, clientId, conversationId, adminToken, fetchProfile])

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <UserCircle className="h-4 w-4" />
          Información del Cliente
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Perfil del Cliente</DialogTitle>
          <DialogDescription>
            Ver y editar la información del cliente
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !profile ? (
          <div className="text-center py-8 text-muted-foreground">
            No se encontró información del cliente
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name_client">Nombre del Cliente</Label>
                  <Input
                    id="name_client"
                    name="name_client"
                    defaultValue={profile.name_client}
                    placeholder="Nombre completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name_company">Nombre de la Empresa</Label>
                  <Input
                    id="name_company"
                    name="name_company"
                    defaultValue={profile.name_company}
                    placeholder="Nombre de la empresa"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description_company">Descripción de la Empresa</Label>
                <Textarea
                  id="description_company"
                  name="description_company"
                  defaultValue={profile.description_company}
                  placeholder="Describe la empresa..."
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label>Redes Sociales</Label>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Input
                      name="instagram"
                      defaultValue={profile.instagram}
                      placeholder="URL de Instagram"
                    />
                  </div>
                  <div>
                    <Input
                      name="facebook"
                      defaultValue={profile.facebook}
                      placeholder="URL de Facebook"
                    />
                  </div>
                  <div>
                    <Input
                      name="x"
                      defaultValue={profile.x}
                      placeholder="URL de X (Twitter)"
                    />
                  </div>
                </div>
              </div>
            </div>

            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar Cambios'
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
} 