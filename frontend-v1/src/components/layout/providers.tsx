'use client';
import React from 'react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { ClerkProvider } from '@clerk/nextjs';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <Toaster />
        {children}
      </ThemeProvider>
    </ClerkProvider>
  );
}
