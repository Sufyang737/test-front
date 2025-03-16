"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ContactData } from "../contacts-view-page"
import { DataTableColumnHeader } from "@/components/ui/table/data-table-column-header"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { ContactActions } from "./contact-actions"
import { cn } from "@/lib/utils"

interface ColumnsProps {
  onUpdate: () => void
}

export const columns = ({ onUpdate }: ColumnsProps): ColumnDef<ContactData>[] => [
  {
    accessorKey: "name_client",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nombre del Contacto" />
    ),
  },
  {
    accessorKey: "name_company",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Empresa" />
    ),
  },
  {
    accessorKey: "details.priority",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Prioridad" />
    ),
    cell: ({ row }) => {
      const priority = row.original.details?.priority || "sin asignar"
      const styles = {
        high: "bg-red-100 text-red-800 hover:bg-red-200",
        medium: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
        low: "bg-green-100 text-green-800 hover:bg-green-200",
        "sin asignar": "bg-gray-100 text-gray-800 hover:bg-gray-200"
      }
      
      const priorityText = {
        high: "Alta",
        medium: "Media",
        low: "Baja",
        "sin asignar": "Sin asignar"
      }[priority]

      return (
        <Badge 
          className={cn(
            "font-semibold",
            styles[priority as keyof typeof styles]
          )}
          variant="outline"
        >
          {priorityText}
        </Badge>
      )
    },
  },
  {
    accessorKey: "details.conversation_status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Estado" />
    ),
    cell: ({ row }) => {
      const status = row.original.details?.conversation_status || "desconocido"
      const styles = {
        open: "bg-emerald-100 text-emerald-800 hover:bg-emerald-200",
        closed: "bg-gray-100 text-gray-800 hover:bg-gray-200",
        pending: "bg-orange-100 text-orange-800 hover:bg-orange-200",
        desconocido: "bg-gray-100 text-gray-800 hover:bg-gray-200"
      }
      const statusText = {
        open: "Abierto",
        closed: "Cerrado",
        pending: "Pendiente",
        desconocido: "Desconocido"
      }[status]

      return (
        <Badge 
          className={cn(
            "font-semibold",
            styles[status as keyof typeof styles]
          )}
          variant="outline"
        >
          {statusText}
        </Badge>
      )
    },
  },
  {
    accessorKey: "details.customer_source",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Origen" />
    ),
    cell: ({ row }) => {
      const source = row.original.details?.customer_source || "desconocido"
      const sourceText = {
        referral: "Referido",
        social: "Redes Sociales",
        website: "Sitio Web",
        whatsapp: "WhatsApp",
        desconocido: "Desconocido"
      }[source]

      return sourceText
    }
  },
  {
    accessorKey: "created",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Fecha de Creación" />
    ),
    cell: ({ row }) => format(new Date(row.original.created), "PPP", { locale: es }),
  },
  {
    id: "actions",
    cell: ({ row }) => <ContactActions data={row.original} onUpdate={onUpdate} />,
  },
] 