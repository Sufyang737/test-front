"use client"

import { useState } from "react"
import { MoreHorizontal, Pencil, Trash } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ContactData } from "./contacts-view-page"
import { ContactForm } from "./contact-form"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import PocketBase from 'pocketbase'

const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL)

if (process.env.NEXT_PUBLIC_POCKETBASE_ADMIN_TOKEN) {
  pb.authStore.save(process.env.NEXT_PUBLIC_POCKETBASE_ADMIN_TOKEN)
}

interface ContactActionsProps {
  contact: ContactData
  onUpdate?: () => void
}

export function ContactActions({ contact, onUpdate }: ContactActionsProps) {
  const [open, setOpen] = useState(false)
  const [openAlert, setOpenAlert] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleDelete = async () => {
    try {
      setLoading(true)
      
      // Eliminar los detalles de la conversación primero
      if (contact.details?.id) {
        await pb.collection('details_conversation').delete(contact.details.id)
      }
      
      // Luego eliminar el contacto
      await pb.collection('profile_lead').delete(contact.id)
      
      toast({
        title: "Éxito",
        description: "Contacto eliminado correctamente",
      })
      
      if (onUpdate) {
        onUpdate()
      }
    } catch (error) {
      console.error('Error deleting contact:', error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el contacto",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setOpenAlert(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Abrir menú</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => setOpen(true)}
            className="text-blue-600 focus:text-blue-600"
          >
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setOpenAlert(true)}
            className="text-red-600 focus:text-red-600"
          >
            <Trash className="mr-2 h-4 w-4" />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ContactForm
        open={open}
        onClose={() => setOpen(false)}
        initialData={contact}
        onCreateSuccess={() => {}}
        onUpdateSuccess={() => {
          setOpen(false)
          if (onUpdate) {
            onUpdate()
          }
          toast({
            title: "Éxito",
            description: "Contacto actualizado correctamente",
          })
        }}
      />

      <AlertDialog open={openAlert} onOpenChange={setOpenAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el contacto
              y toda su información asociada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {loading ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 