'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'
import PocketBase from 'pocketbase'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Download } from 'lucide-react'
import { useClientId } from '@/lib/utils/get-client-id'

const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL)

const CSV_HEADERS = ['name', 'url', 'description', 'price']
const SAMPLE_CSV = `name,url,description,price
Product 1,https://example.com/1,Description for product 1,10.99
Product 2,https://example.com/2,Description for product 2,20.99`

export default function ProductCSVUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const { getClientId, isLoaded } = useClientId()

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sample_products.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type !== 'text/csv') {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a CSV file.',
        variant: 'destructive',
      })
      return
    }
    setFile(file || null)
  }

  const processCSV = (text: string) => {
    const lines = text.split('\n')
    const headers = lines[0].split(',')
    
    // Validate headers
    if (!CSV_HEADERS.every(header => headers.includes(header))) {
      throw new Error('Invalid CSV format. Please use the sample CSV as a template.')
    }

    return lines.slice(1).map(line => {
      const values = line.split(',')
      const product: Record<string, string> = {}
      headers.forEach((header, index) => {
        product[header.trim()] = values[index]?.trim() || ''
      })
      return product
    })
  }

  const handleUpload = async () => {
    if (!file) return

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

      const text = await file.text()
      const products = processCSV(text)

      let successCount = 0
      let errorCount = 0

      for (const product of products) {
        try {
          const productData = {
            ...product,
            client_id: clientId,
            price: parseFloat(product.price)
          }

          await pb.collection('products').create(productData)
          successCount++
        } catch (error) {
          console.error('Error creating product:', error)
          errorCount++
        }
      }

      toast({
        title: 'Import completed',
        description: `Successfully imported ${successCount} products. ${errorCount} failed.`,
        variant: errorCount > 0 ? 'destructive' : 'default',
      })

      if (successCount > 0) {
        router.push('/dashboard/products')
        router.refresh()
      }
    } catch (error) {
      console.error('Error processing CSV:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error processing CSV file',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Alert>
        <AlertDescription>
          Upload a CSV file with the following columns: name, url, description, price.
          You can download a sample CSV file to see the required format.
        </AlertDescription>
      </Alert>

      <Button 
        variant="outline" 
        onClick={downloadSample}
        className="w-full"
        disabled={!isLoaded}
      >
        <Download className="mr-2 h-4 w-4" />
        Download Sample CSV
      </Button>

      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          disabled={!isLoaded || isLoading}
        />
      </div>

      <Button
        onClick={handleUpload}
        disabled={!file || !isLoaded || isLoading}
        className="w-full"
      >
        {isLoading ? 'Importing...' : 'Import Products'}
      </Button>
    </div>
  )
} 