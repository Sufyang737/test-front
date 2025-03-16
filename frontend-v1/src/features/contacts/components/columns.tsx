"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ContactData } from "./contacts-view-page"
import { Badge } from "@/components/ui/badge"
import { ContactActions } from "./contact-actions"
import { cn } from "@/lib/utils"

export const columns: ColumnDef<ContactData>[] = [
  {
    accessorKey: "name_client",
    header: "Nombre del Contacto",
  },
  {
    accessorKey: "name_company",
    header: "Empresa",
  },
  {
    accessorKey: "details.priority",
    header: "Prioridad",
    cell: ({ row }) => {
      const priority = row.getValue("details.priority") as string
      const styles = {
        high: "bg-red-100 text-red-800 hover:bg-red-200",
        medium: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
        low: "bg-green-100 text-green-800 hover:bg-green-200"
      }
      const label = priority === "high" ? "Alta" : priority === "medium" ? "Media" : "Baja"
      return priority ? (
        <Badge 
          className={cn(
            "font-semibold",
            styles[priority as keyof typeof styles]
          )}
          variant="outline"
        >
          {label}
        </Badge>
      ) : null
    },
  },
  {
    accessorKey: "details.customer_source",
    header: "Origen",
    cell: ({ row }) => {
      const source = row.getValue("details.customer_source") as string
      const label = {
        referral: "Referido",
        social: "Redes Sociales",
        website: "Sitio Web",
        whatsapp: "WhatsApp"
      }[source] || source
      return source ? (
        <Badge 
          className="bg-blue-100 text-blue-800 hover:bg-blue-200"
          variant="outline"
        >
          {label}
        </Badge>
      ) : null
    },
  },
  {
    accessorKey: "details.conversation_status",
    header: "Estado",
    cell: ({ row }) => {
      const status = row.getValue("details.conversation_status") as string
      const styles = {
        open: "bg-emerald-100 text-emerald-800 hover:bg-emerald-200",
        closed: "bg-gray-100 text-gray-800 hover:bg-gray-200",
        pending: "bg-orange-100 text-orange-800 hover:bg-orange-200"
      }
      const label = {
        open: "Abierto",
        closed: "Cerrado",
        pending: "Pendiente"
      }[status] || status
      return status ? (
        <Badge 
          className={cn(
            "font-semibold",
            styles[status as keyof typeof styles]
          )}
          variant="outline"
        >
          {label}
        </Badge>
      ) : null
    },
  },
  {
    accessorKey: "details.request_type",
    header: "Tipo",
    cell: ({ row }) => {
      const type = row.getValue("details.request_type") as string
      const styles = {
        "technical support": "bg-purple-100 text-purple-800 hover:bg-purple-200",
        "sales": "bg-indigo-100 text-indigo-800 hover:bg-indigo-200",
        "general inquiry": "bg-cyan-100 text-cyan-800 hover:bg-cyan-200",
        "complaint": "bg-rose-100 text-rose-800 hover:bg-rose-200"
      }
      const label = {
        "technical support": "Soporte Técnico",
        "sales": "Ventas",
        "general inquiry": "Consulta General",
        "complaint": "Reclamo"
      }[type] || type
      return type ? (
        <Badge 
          className={cn(
            "font-semibold",
            styles[type as keyof typeof styles]
          )}
          variant="outline"
        >
          {label}
        </Badge>
      ) : null
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <ContactActions contact={row.original} />,
  },
]