'use client';

import { cn } from '@/lib/utils';
import React from 'react';

export function NavGroup({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-4', className)} {...props} />;
}

export function NavGroupLabel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('text-xs font-medium text-muted-foreground', className)} {...props} />;
}

export function NavMenu({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('space-y-1', className)} {...props} />;
}

export function NavMenuItem({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('relative', className)} {...props} />;
}

export function NavMenuButton({
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

export function NavMenuSub({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('pl-6 space-y-1', className)} {...props} />;
}

export function NavMenuSubItem({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('relative', className)} {...props} />;
}

export function NavMenuSubButton({
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