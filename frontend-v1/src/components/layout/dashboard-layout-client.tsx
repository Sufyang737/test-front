'use client'

import { useSelectedLayoutSegments } from 'next/navigation';
import KBar from '@/components/kbar';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { Header } from '@/components/layout/header';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';

export default function DashboardLayoutClient({
  children
}: {
  children: React.ReactNode;
}) {
  const segments = useSelectedLayoutSegments();
  const isOnboarding = segments.includes('onboarding');

  if (isOnboarding) {
    return children;
  }

  return (
    <KBar>
      <SidebarProvider defaultOpen={true}>
        <AppSidebar />
        <SidebarInset>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1 pt-[50px]">
              {children}
            </main>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </KBar>
  );
} 