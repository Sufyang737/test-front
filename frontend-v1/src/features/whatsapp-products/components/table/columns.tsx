'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Product } from '../product-list'
import { formatPrice } from '@/lib/utils/format'

export const columns: ColumnDef<Product>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'price',
    header: 'Price',
    cell: ({ row }) => {
      const price = parseFloat(row.getValue('price'))
      return formatPrice(price)
    },
  },
  {
    accessorKey: 'description',
    header: 'Description',
    cell: ({ row }) => {
      const description = row.getValue('description') as string
      return description.length > 50 ? description.substring(0, 50) + '...' : description
    },
  },
  {
    accessorKey: 'url',
    header: 'URL',
    cell: ({ row }) => {
      const url = row.getValue('url') as string
      return (
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline"
        >
          {url.length > 30 ? url.substring(0, 30) + '...' : url}
        </a>
      )
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const product = row.original

      return (
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/products/${product.id}`}>
            <Button variant="outline" size="sm">
              Edit
            </Button>
          </Link>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={() => {
              if (confirm('Are you sure you want to delete this product?')) {
                // TODO: Implement delete functionality
              }
            }}
          >
            Delete
          </Button>
        </div>
      )
    },
  },
] 