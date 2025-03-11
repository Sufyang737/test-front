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
      'fixed top-0 right-0 flex h-[60px] items-center border-b bg-background z-40',
      isCollapsed ? 'left-[60px]' : 'left-[240px]',
      'transition-all duration-300'
    )}>
      <div className='flex items-center justify-start gap-4 px-4 w-1/3'>
        <SidebarTrigger className='h-9 w-9' />
        <Separator orientation='vertical' className='h-6' />
        <div className="flex items-center gap-2">
          <Breadcrumbs />
        </div>
      </div>

      <div className='flex items-center justify-center w-1/3'>
        <div className='hidden md:block w-full max-w-md'>
          <SearchInput />
        </div>
      </div>

      <div className='flex items-center justify-end gap-4 w-1/3 px-4'>
        <UserNav />
        <ThemeToggle />
      </div>
    </header>
  );
}
