'use client';

import React from 'react';
import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={cn(
      "w-full px-6 py-4",
      className
    )}>
      {children}
    </div>
  );
}
