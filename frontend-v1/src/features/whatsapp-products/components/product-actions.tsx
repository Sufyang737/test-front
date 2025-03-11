'use client'

import { Cross2Icon } from '@radix-ui/react-icons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTableViewOptions } from '@/components/ui/table/data-table-view-options'
import { DataTableFacetedFilter } from '@/components/ui/table/data-table-faceted-filter'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { Table } from '@tanstack/react-table'
import { Product } from './product-list'

const statuses = [
  {
    value: 'active',
    label: 'Active',
  },
  {
    value: 'inactive',
    label: 'Inactive',
  },
]

interface WhatsAppProductActionsProps {
  table: Table<Product>
}

export default function WhatsAppProductActions({ table }: WhatsAppProductActionsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const createQueryString = useCallback((params: Record<string, string | null>) => {
    const newSearchParams = new URLSearchParams(searchParams?.toString())

    Object.entries(params).forEach(([key, value]) => {
      if (value === null) {
        newSearchParams.delete(key)
      } else {
        newSearchParams.set(key, value)
      }
    })

    return newSearchParams.toString()
  }, [searchParams])

  const currentFilter = searchParams?.get('filter') ?? ''
  const currentStatus = searchParams?.get('status') ?? ''

  const handleSearch = (value: string) => {
    const query = createQueryString({
      filter: value || null
    })
    router.push(`${pathname}${query ? `?${query}` : ''}`)
  }

  const handleStatusChange = (value: string) => {
    const query = createQueryString({
      status: value || null
    })
    router.push(`${pathname}${query ? `?${query}` : ''}`)
  }

  const handleReset = () => {
    router.push(pathname)
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Search products..."
          value={currentFilter}
          onChange={(event) => handleSearch(event.target.value)}
          className="h-8 w-[150px] lg:w-[250px]"
        />
        <DataTableFacetedFilter
          column={table.getColumn('status')}
          title="Status"
          options={statuses}
        />
        {(currentFilter || currentStatus) && (
          <Button
            variant="ghost"
            onClick={handleReset}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <Cross2Icon className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  )
} 