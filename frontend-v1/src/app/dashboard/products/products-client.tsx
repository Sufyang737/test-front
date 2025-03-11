'use client'

import dynamic from 'next/dynamic'

const WhatsAppProductList = dynamic(
  () => import('@/features/whatsapp-products/components/product-list'),
  { ssr: false }
)

export default function ProductsClient() {
  return <WhatsAppProductList />
} 