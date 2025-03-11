import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PageContainerProps {
  children: React.ReactNode
}

export default function PageContainer({ children }: PageContainerProps) {
  return (
    <div className="flex flex-col flex-1 p-4 pt-[74px] lg:pt-[80px]">
      {children}
    </div>
  )
}
