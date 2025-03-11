import { Metadata } from 'next'
import WhatsAppProductList from '@/features/whatsapp-products/components/product-list'

export const metadata: Metadata = {
  title: 'WhatsApp Products'
}

export default function WhatsAppProductsPage() {
  return <WhatsAppProductList />
} 