'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useToast } from '@/components/ui/use-toast'
import PocketBase from 'pocketbase'
import { useClientId } from '@/lib/utils/get-client-id'

const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL)

const productSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  url: z.string().url('Must be a valid URL'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid price (e.g., 10.99)'),
})

type ProductFormValues = z.infer<typeof productSchema>

export default function ProductForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const { getClientId, isLoaded } = useClientId()

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      url: '',
      description: '',
      price: '',
    },
  })

  async function onSubmit(data: ProductFormValues) {
    if (!isLoaded) {
      toast({
        title: 'Loading',
        description: 'Please wait while we load your user data.',
      })
      return
    }

    try {
      setIsLoading(true)
      
      // Get the client ID using the utility function
      const clientId = await getClientId()

      // Create the product with the client_id
      const productData = {
        ...data,
        client_id: clientId,
        price: parseFloat(data.price)
      }

      await pb.collection('products').create(productData)

      toast({
        title: 'Product created',
        description: 'Your product has been created successfully.',
      })

      router.push('/dashboard/products')
      router.refresh()
    } catch (error) {
      console.error('Error creating product:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'There was an error creating your product.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Product name" {...field} disabled={!isLoaded || isLoading} />
              </FormControl>
              <FormDescription>
                The name of your product.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com" {...field} disabled={!isLoaded || isLoading} />
              </FormControl>
              <FormDescription>
                The URL where the product can be found.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Product description" 
                  {...field}
                  className="min-h-[100px]"
                  disabled={!isLoaded || isLoading}
                />
              </FormControl>
              <FormDescription>
                A detailed description of your product.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Price</FormLabel>
              <FormControl>
                <Input placeholder="10.99" {...field} disabled={!isLoaded || isLoading} />
              </FormControl>
              <FormDescription>
                The price of your product (e.g., 10.99).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={!isLoaded || isLoading}>
          {isLoading ? 'Creating...' : 'Create Product'}
        </Button>
      </form>
    </Form>
  )
} 