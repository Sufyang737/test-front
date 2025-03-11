import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Edit, Trash } from 'lucide-react'
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header'

export type Template = {
  id: string
  name_template: string
  template: string
  tags: string
  variables: string
  created: string
  updated: string
}

export const columns: ColumnDef<Template>[] = [
  {
    accessorKey: 'name_template',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
  },
  {
    accessorKey: 'template',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Template" />
    ),
    cell: ({ row }) => {
      const template = row.getValue('template') as string
      return (
        <div className="max-w-[500px] truncate">
          {template}
        </div>
      )
    }
  },
  {
    accessorKey: 'tags',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tags" />
    ),
    cell: ({ row }) => {
      const tags = (row.getValue('tags') as string).split(',')
      return (
        <div className="flex gap-1 flex-wrap">
          {tags.map((tag, i) => (
            <Badge key={i} variant="secondary">
              {tag.trim()}
            </Badge>
          ))}
        </div>
      )
    }
  },
  {
    accessorKey: 'variables',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Variables" />
    ),
    cell: ({ row }) => {
      const variables = (row.getValue('variables') as string).split(',')
      return (
        <div className="flex gap-1 flex-wrap">
          {variables.map((variable, i) => (
            <Badge key={i} variant="outline">
              {variable.trim()}
            </Badge>
          ))}
        </div>
      )
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const template = row.original

      return (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      )
    },
  },
] 