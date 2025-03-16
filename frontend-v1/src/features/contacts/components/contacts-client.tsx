"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ContactData } from "./contacts-view-page"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/ui/data-table"
import { Skeleton } from "@/components/ui/skeleton"

interface ContactsClientProps {
  data: ContactData[]
  columns: ColumnDef<ContactData>[]
  loading: boolean
  onEdit: (contact: ContactData) => void
  onUpdate: () => void
}

export function ContactsClient({
  data,
  columns,
  loading,
  onEdit,
  onUpdate
}: ContactsClientProps) {
  if (loading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre del Contacto</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Prioridad</TableHead>
              <TableHead>Origen</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Fecha de Creación</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, index) => (
              <TableRow key={index}>
                <TableCell><Skeleton className="h-6 w-[200px]" /></TableCell>
                <TableCell><Skeleton className="h-6 w-[150px]" /></TableCell>
                <TableCell><Skeleton className="h-6 w-[100px]" /></TableCell>
                <TableCell><Skeleton className="h-6 w-[120px]" /></TableCell>
                <TableCell><Skeleton className="h-6 w-[100px]" /></TableCell>
                <TableCell><Skeleton className="h-6 w-[130px]" /></TableCell>
                <TableCell><Skeleton className="h-6 w-[180px]" /></TableCell>
                <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <DataTable 
      columns={columns} 
      data={data}
      searchKey="name_client"
      searchPlaceholder="Buscar por nombre..."
    />
  )
} 