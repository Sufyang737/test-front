"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ContactData } from "../contacts-view-page"
import { MoreHorizontal, MessageSquare, ExternalLink, Pencil, AlertCircle, CheckCircle2, Clock, ArrowUp, ArrowRight, ArrowDown } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { ContactForm } from "../contact-form"
import { useToast } from "@/components/ui/use-toast"
import PocketBase from 'pocketbase'
import { useUser } from "@clerk/nextjs"
import { getClientId } from "@/lib/utils/get-client-id"

const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL)

if (process.env.NEXT_PUBLIC_POCKETBASE_ADMIN_TOKEN) {
  pb.authStore.save(process.env.NEXT_PUBLIC_POCKETBASE_ADMIN_TOKEN)
}

interface ContactActionsProps {
  data: ContactData
  onUpdate?: () => void
}

export function ContactActions({ data, onUpdate }: ContactActionsProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const { user } = useUser()

  const updateDetails = async (updates: Partial<ContactData['details']>) => {
    try {
      setIsLoading(true)
      if (!user) return

      const clientId = await getClientId(user.id)
      if (!clientId) throw new Error("Cliente no encontrado")

      const detailsData = {
        lead_id: data.id,
        client_id: clientId,
        priority: data.details?.priority || "medium",
        customer_source: data.details?.customer_source || "whatsapp",
        conversation_status: data.details?.conversation_status || "open",
        request_type: data.details?.request_type || "general inquiry",
        ...updates
      }

      if (data.details?.id) {
        await pb.collection('details_conversation').update(data.details.id, detailsData)
      } else {
        await pb.collection('details_conversation').create(detailsData)
      }

      if (onUpdate) {
        onUpdate()
      }

      toast({
        title: "Éxito",
        description: "Contacto actualizado correctamente",
      })
    } catch (error) {
      console.error('Error updating contact:', error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el contacto",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0" disabled={isLoading}>
            <span className="sr-only">Abrir menú</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <AlertCircle className="mr-2 h-4 w-4" />
              Prioridad
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem 
                onClick={() => updateDetails({ priority: "high" })}
                className="text-red-600 focus:text-red-600"
              >
                <ArrowUp className="mr-2 h-4 w-4" />
                Alta
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => updateDetails({ priority: "medium" })}
                className="text-yellow-600 focus:text-yellow-600"
              >
                <ArrowRight className="mr-2 h-4 w-4" />
                Media
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => updateDetails({ priority: "low" })}
                className="text-green-600 focus:text-green-600"
              >
                <ArrowDown className="mr-2 h-4 w-4" />
                Baja
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Clock className="mr-2 h-4 w-4" />
              Estado
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem 
                onClick={() => updateDetails({ conversation_status: "open" })}
                className="text-emerald-600 focus:text-emerald-600"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Abierto
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => updateDetails({ conversation_status: "pending" })}
                className="text-orange-600 focus:text-orange-600"
              >
                <Clock className="mr-2 h-4 w-4" />
                Pendiente
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => updateDetails({ conversation_status: "closed" })}
                className="text-gray-600 focus:text-gray-600"
              >
                <AlertCircle className="mr-2 h-4 w-4" />
                Cerrado
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => setOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar Todo
          </DropdownMenuItem>
          
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/chats?contact=${data.id}`}>
              <MessageSquare className="mr-2 h-4 w-4" />
              Ver Chat
            </Link>
          </DropdownMenuItem>
          
          {data.instagram && (
            <DropdownMenuItem asChild>
              <a href={data.instagram} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Perfil de Instagram
              </a>
            </DropdownMenuItem>
          )}
          {data.facebook && (
            <DropdownMenuItem asChild>
              <a href={data.facebook} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Perfil de Facebook
              </a>
            </DropdownMenuItem>
          )}
          {data.x && (
            <DropdownMenuItem asChild>
              <a href={data.x} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Perfil de X
              </a>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ContactForm
        open={open}
        onClose={() => setOpen(false)}
        initialData={data}
        onCreateSuccess={() => {}}
        onUpdateSuccess={() => {
          setOpen(false)
          if (onUpdate) {
            onUpdate()
          }
        }}
      />
    </>
  )
} 