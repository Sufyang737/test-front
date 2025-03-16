import { PageContainer } from '@/components/layout/page-container'
import { Heading } from '@/components/ui/heading'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ProductForm from './product-form'
import ProductCSVUpload from './product-csv-upload'

export default function NewProductPage() {
  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-4'>
        <Heading
          title='Add Product'
          description='Add a new product to your catalog or import multiple products via CSV.'
        />
        <Separator />
        
        <Tabs defaultValue="single" className="w-full">
          <TabsList>
            <TabsTrigger value="single">Single Product</TabsTrigger>
            <TabsTrigger value="csv">Import CSV</TabsTrigger>
          </TabsList>
          <TabsContent value="single">
            <ProductForm />
          </TabsContent>
          <TabsContent value="csv">
            <ProductCSVUpload />
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  )
} 