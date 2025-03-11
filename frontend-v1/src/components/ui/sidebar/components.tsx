'use client';

import * as React from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useSidebar } from './base';

export function SidebarGroup({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-4', className)} {...props} />;
}

export function SidebarGroupLabel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('text-xs font-medium text-muted-foreground', className)} {...props} />;
}

export function SidebarMenu({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('space-y-1', className)} {...props} />;
}

export function SidebarMenuItem({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('relative', className)} {...props} />;
}

export function SidebarMenuButton({
  className,
  isActive,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { isActive?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        'flex w-full items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground',
        isActive && 'bg-accent text-accent-foreground',
        className
      )}
      {...props}
    />
  );
}

export function SidebarMenuSub({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('pl-6 space-y-1', className)} {...props} />;
}

export function SidebarMenuSubItem({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('relative', className)} {...props} />;
}

export function SidebarMenuSubButton({
  className,
  isActive,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { isActive?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        'flex w-full items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground',
        isActive && 'bg-accent text-accent-foreground',
        className
      )}
      {...props}
    />
  );
}

export function SidebarComponent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const { isMobile, openMobile, setOpenMobile } = useSidebar();

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetContent side="left" className="p-0">
          <div className={cn('flex flex-col h-full', className)} {...props} />
        </SheetContent>
      </Sheet>
    );
  }

  return <div className={cn('flex flex-col h-full', className)} {...props} />;
}

export function SidebarInset({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <div
      className={cn(
        'flex-1',
        isCollapsed ? 'lg:pl-[60px]' : 'lg:pl-[240px]',
        'transition-all duration-300 ease-in-out',
        className
      )}
      {...props}
    />
  );
} 