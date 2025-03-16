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
      "container mx-auto max-w-7xl px-4 flex items-center justify-between w-full",
      className
    )}>
      {children}
    </div>
  );
}
