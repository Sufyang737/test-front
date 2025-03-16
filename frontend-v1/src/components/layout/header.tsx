'use client';

import React from 'react';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Breadcrumbs } from '../breadcrumbs';
import SearchInput from '../search-input';
import { UserNav } from './user-nav';
import ThemeToggle from './ThemeToggle/theme-toggle';
import { cn } from '@/lib/utils';

export function Header() {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <header className={cn(
      'fixed top-0 right-0 flex h-[50px] items-center border-b bg-background z-40',
      isCollapsed ? 'left-[60px]' : 'left-[192px]',
      'transition-all duration-200 ease-linear'
    )}>
      <div className="container mx-auto max-w-7xl px-4 flex items-center justify-between w-full">
        <div className='flex items-center gap-4'>
          <SidebarTrigger className='h-9 w-9' />
          <Separator orientation='vertical' className='h-6' />
          <div className="flex items-center gap-2">
            <Breadcrumbs />
          </div>
        </div>

        <div className='flex-1 flex items-center justify-center max-w-md mx-auto'>
          <div className='hidden md:block w-full'>
            <SearchInput />
          </div>
        </div>

        <div className='flex items-center gap-4'>
          <UserNav />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
