"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ContactData } from "./contacts-view-page"
import { useUser } from "@clerk/nextjs"
import { getClientId } from "@/lib/utils/get-client-id"
import PocketBase from 'pocketbase'
import { Loader2 } from "lucide-react"

const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL)

if (process.env.NEXT_PUBLIC_POCKETBASE_ADMIN_TOKEN) {
  pb.authStore.save(process.env.NEXT_PUBLIC_POCKETBASE_ADMIN_TOKEN)
}

const formSchema = z.object({
  name_client: z.string().min(1, "El nombre es requerido"),
  name_company: z.string().min(1, "El nombre de la empresa es requerido"),
  description_company: z.string().optional(),
  instagram: z.string().url("URL inválida").optional().or(z.literal("")),
  facebook: z.string().url("URL inválida").optional().or(z.literal("")),
  x: z.string().url("URL inválida").optional().or(z.literal("")),
  priority: z.enum(["high", "medium", "low"]),
  customer_source: z.enum(["referral", "social", "website", "whatsapp"]),
  conversation_status: z.enum(["open", "closed", "pending"]),
  request_type: z.enum(["technical support", "sales", "general inquiry", "complaint"])
})

type FormValues = z.infer<typeof formSchema>

interface ContactFormProps {
  open: boolean
  onClose: () => void
  onCreateSuccess: () => void
  onUpdateSuccess: () => void
  initialData?: ContactData | null
}

export function ContactForm({
  open,
  onClose,
  onCreateSuccess,
  onUpdateSuccess,
  initialData
}: ContactFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useUser()
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name_client: "",
      name_company: "",
      description_company: "",
      instagram: "",
      facebook: "",
      x: "",
      priority: "medium",
      customer_source: "whatsapp",
      conversation_status: "open",
      request_type: "general inquiry"
    }
  })

  useEffect(() => {
    if (initialData) {
      form.reset({
        name_client: initialData.name_client,
        name_company: initialData.name_company,
        description_company: initialData.description_company || "",
        instagram: initialData.instagram || "",
        facebook: initialData.facebook || "",
        x: initialData.x || "",
        priority: initialData.details?.priority || "medium",
        customer_source: initialData.details?.customer_source || "whatsapp",
        conversation_status: initialData.details?.conversation_status || "open",
        request_type: initialData.details?.request_type || "general inquiry"
      })
    }
  }, [initialData, form])

  const onSubmit = async (values: FormValues) => {
    try {
      setIsLoading(true)
      if (!user) return

      const clientId = await getClientId(user.id)
      if (!clientId) throw new Error("Cliente no encontrado")

      let contactId: string

      if (initialData) {
        // Actualizar contacto existente
        await pb.collection('profile_lead').update(initialData.id, {
          name_client: values.name_client,
          name_company: values.name_company,
          description_company: values.description_company,
          instagram: values.instagram,
          facebook: values.facebook,
          x: values.x,
          client_id: clientId
        })
        contactId = initialData.id
      } else {
        // Crear nuevo contacto
        const contact = await pb.collection('profile_lead').create({
          name_client: values.name_client,
          name_company: values.name_company,
          description_company: values.description_company,
          instagram: values.instagram,
          facebook: values.facebook,
          x: values.x,
          client_id: clientId
        })
        contactId = contact.id
      }

      // Datos para details_conversation
      const detailsData = {
        lead_id: contactId,
        client_id: clientId,
        priority: values.priority,
        customer_source: values.customer_source,
        conversation_status: values.conversation_status,
        request_type: values.request_type
      }

      if (initialData?.details?.id) {
        // Actualizar detalles existentes
        await pb.collection('details_conversation').update(initialData.details.id, detailsData)
      } else {
        // Crear nuevos detalles
        await pb.collection('details_conversation').create(detailsData)
      }

      if (initialData) {
        onUpdateSuccess()
      } else {
        onCreateSuccess()
      }
    } catch (error) {
      console.error('Error saving contact:', error)
      form.setError("root", {
        message: "Error al guardar el contacto"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Editar Contacto" : "Nuevo Contacto"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name_client"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Contacto</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name_company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de la Empresa</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description_company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción de la Empresa</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="instagram"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instagram</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="facebook"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Facebook</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="x"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>X (Twitter)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridad</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona la prioridad" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="medium">Media</SelectItem>
                        <SelectItem value="low">Baja</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="customer_source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Origen</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el origen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="referral">Referido</SelectItem>
                        <SelectItem value="social">Redes Sociales</SelectItem>
                        <SelectItem value="website">Sitio Web</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="conversation_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="open">Abierto</SelectItem>
                        <SelectItem value="closed">Cerrado</SelectItem>
                        <SelectItem value="pending">Pendiente</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="request_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Solicitud</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="technical support">Soporte Técnico</SelectItem>
                        <SelectItem value="sales">Ventas</SelectItem>
                        <SelectItem value="general inquiry">Consulta General</SelectItem>
                        <SelectItem value="complaint">Reclamo</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                variant="outline" 
                onClick={onClose} 
                type="button"
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {initialData ? "Actualizando..." : "Creando..."}
                  </>
                ) : (
                  initialData ? "Actualizar" : "Crear"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 