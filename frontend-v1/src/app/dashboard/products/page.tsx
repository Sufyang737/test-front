import PageContainer from '@/components/layout/page-container'
import { Heading } from '@/components/ui/heading'
import { Separator } from '@/components/ui/separator'
import ProductsClient from './products-client'

export default function ProductsPage() {
  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-4'>
        <Heading
          title='Products'
          description='Manage your product catalog and pricing.'
        />
        <Separator />
        <ProductsClient />
      </div>
    </PageContainer>
  )
} 