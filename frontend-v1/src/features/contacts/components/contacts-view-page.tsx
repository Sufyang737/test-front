"use client"

import { useEffect, useState } from "react"
import { Heading } from "@/components/ui/heading"
import { Separator } from "@/components/ui/separator"
import { ContactsClient } from "./contacts-client"
import { columns } from "./table/columns"
import { useToast } from "@/components/ui/use-toast"
import PocketBase from 'pocketbase'
import { useUser } from "@clerk/nextjs"
import { getClientId } from "@/lib/utils/get-client-id"
import { ContactForm } from "./contact-form"

const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL)

// Autenticar con el token de administrador
if (process.env.NEXT_PUBLIC_POCKETBASE_ADMIN_TOKEN) {
  pb.authStore.save(process.env.NEXT_PUBLIC_POCKETBASE_ADMIN_TOKEN)
}

export interface ContactData {
  id: string
  name_client: string
  name_company: string
  description_company?: string
  instagram?: string
  facebook?: string
  x?: string
  client_id: string
  created: string
  updated: string
  details?: {
    id: string
    lead_id: string
    client_id: string
    priority: "high" | "medium" | "low"
    customer_source: "referral" | "social" | "website" | "whatsapp"
    conversation_status: "open" | "closed" | "pending"
    request_type: "technical support" | "sales" | "general inquiry" | "complaint"
  }
}

export function ContactsViewPage() {
  const [data, setData] = useState<ContactData[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [selectedContact, setSelectedContact] = useState<ContactData | null>(null)
  const { toast } = useToast()
  const { user } = useUser()

  const fetchContacts = async () => {
    try {
      if (!user) {
        setLoading(false)
        return
      }

      const clientId = await getClientId(user.id)
      if (!clientId) {
        setLoading(false)
        return
      }

      const contacts = await pb.collection('profile_lead').getList(1, 50, {
        filter: `client_id = "${clientId}"`,
        sort: '-created',
        expand: 'details_conversation'
      })

      // Obtener los detalles de conversación para cada contacto
      const contactsWithDetails = await Promise.all(
        contacts.items.map(async (contact) => {
          const details = await pb.collection('details_conversation').getFirstListItem(
            `lead_id = "${contact.id}"`,
            { sort: '-created' }
          ).catch(() => null)

          return {
            ...contact,
            details: details
          }
        })
      )

      setData(contactsWithDetails)
    } catch (error) {
      console.error('Error fetching contacts:', error)
      // Solo mostrar el toast si no estamos en el estado de carga inicial
      if (!loading) {
        toast({
          title: "Error",
          description: "No se pudieron actualizar los contactos",
          variant: "destructive",
        })
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContacts()
  }, [user])

  const onCreateSuccess = () => {
    setOpen(false)
    fetchContacts()
    toast({
      title: "Éxito",
      description: "Contacto creado correctamente",
    })
  }

  const onUpdateSuccess = () => {
    setOpen(false)
    setSelectedContact(null)
    fetchContacts()
    toast({
      title: "Éxito",
      description: "Contacto actualizado correctamente",
    })
  }

  return (
    <>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
          <Heading title="Contactos" description="Gestiona tus contactos y leads" />
        </div>
        <Separator />
        <ContactsClient 
          data={data} 
          columns={columns({ onUpdate: fetchContacts })} 
          loading={loading}
          onEdit={(contact) => {
            setSelectedContact(contact)
            setOpen(true)
          }}
          onUpdate={fetchContacts}
        />
      </div>
      <ContactForm 
        open={open}
        onClose={() => {
          setOpen(false)
          setSelectedContact(null)
        }}
        onCreateSuccess={onCreateSuccess}
        onUpdateSuccess={onUpdateSuccess}
        initialData={selectedContact}
      />
    </>
  )
} 