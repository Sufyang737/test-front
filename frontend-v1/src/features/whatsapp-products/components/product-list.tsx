'use client'

import { useSearchParams } from 'next/navigation'
import PocketBase from 'pocketbase'
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Plus } from 'lucide-react'
import Link from 'next/link'
import { DataTable } from '@/components/ui/table/data-table'
import { columns } from './table/columns'
import { useClientId } from '@/lib/utils/get-client-id'
import { useToast } from '@/components/ui/use-toast'

const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL)

export type Product = {
  id: string
  name: string
  url: string
  description: string
  price: number
  client_id: string
  created: string
  updated: string
}

export default function WhatsAppProductList() {
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  const { getClientId, isLoaded } = useClientId()
  const { toast } = useToast()

  const fetchProducts = async () => {
    if (!isLoaded) {
      return
    }

    try {
      setLoading(true)
      const clientId = await getClientId()
      
      const resultList = await pb.collection('products').getList<Product>(1, 50, {
        sort: '-created',
        filter: `client_id = "${clientId}"${searchTerm ? ` && name ~ "${searchTerm}"` : ''}`,
        $autoCancel: false
      })
      setProducts(resultList.items)
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error fetching products:', error)
        toast({
          title: 'Error',
          description: 'Failed to fetch products',
          variant: 'destructive'
        })
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const abortController = new AbortController()

    const fetchWithAbort = async () => {
      if (!isLoaded) {
        return
      }

      try {
        setLoading(true)
        const clientId = await getClientId()

        const resultList = await pb.collection('products').getList<Product>(1, 50, {
          sort: '-created',
          filter: `client_id = "${clientId}"${searchTerm ? ` && name ~ "${searchTerm}"` : ''}`,
          $autoCancel: false,
          signal: abortController.signal
        })
        setProducts(resultList.items)
      } catch (error) {
        // Ignorar error de cancelación
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Error fetching products:', error)
          toast({
            title: 'Error',
            description: 'Failed to fetch products',
            variant: 'destructive'
          })
        }
      } finally {
        setLoading(false)
      }
    }

    fetchWithAbort()

    // Cleanup function para cancelar la solicitud cuando el componente se desmonte
    return () => {
      abortController.abort()
    }
  }, [searchTerm, isLoaded])

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(price)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await pb.collection('products').delete(id)
        fetchProducts()
        toast({
          title: 'Success',
          description: 'Product deleted successfully'
        })
      } catch (error) {
        console.error('Error deleting product:', error)
        toast({
          title: 'Error',
          description: 'Failed to delete product',
          variant: 'destructive'
        })
      }
    }
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium">Loading...</h3>
          <p className="text-sm text-gray-500">Please wait while we load your data</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-gray-500" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-[300px]"
          />
        </div>
        <Link href="/dashboard/products/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </Link>
      </div>

      <div className="border rounded-lg">
        <DataTable 
          columns={columns} 
          data={products}
          loading={loading}
        />
      </div>
    </div>
  )
} 