'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';
import NavMain from '@/components/navigation/nav-main';
import { TeamSwitcher } from '../team-switcher';
import { useClerk, useUser } from '@clerk/nextjs';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Menu } from 'lucide-react';
import { Sidebar, useSidebar } from '@/components/ui/sidebar';

export const company = {
  name: 'Acme Inc',
  plan: 'Enterprise'
};

interface AppSidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function AppSidebar({ className }: AppSidebarProps) {
  const [open, setOpen] = useState(false);
  const { user } = useUser();
  const { signOut } = useClerk();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  if (!user) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild className="fixed left-4 top-4 z-40 lg:hidden">
          <Button
            variant="ghost"
            className="px-2 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[240px] p-0">
          <div className="px-3 py-2">
            <TeamSwitcher />
          </div>
          <ScrollArea className="my-2 h-[calc(100vh-8rem)] pb-8">
            <div className="px-3">
              <NavMain />
            </div>
          </ScrollArea>
          <div className="mt-auto p-3">
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 px-2"
              onClick={() => signOut()}
            >
              <Avatar className="h-6 w-6">
                <AvatarImage src={user.imageUrl} alt={user.fullName || ''} />
                <AvatarFallback>{user.firstName?.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium truncate">{user.fullName}</span>
            </Button>
          </div>
        </SheetContent>
      </Sheet>
      <Sidebar 
        className={cn(
          "hidden lg:block",
          className,
          "transition-[width] duration-300 ease-in-out",
          isCollapsed ? "w-[60px]" : "w-[240px]"
        )}
        collapsible="icon"
      >
        <div className={cn(
          "flex h-[50px] items-center border-b",
          "transition-all duration-300 ease-in-out",
          isCollapsed ? "justify-center px-2" : "justify-between px-4"
        )}>
          <TeamSwitcher />
        </div>
        <ScrollArea className={cn(
          "flex-1",
          "transition-all duration-300 ease-in-out",
          isCollapsed ? "px-2 py-4" : "p-4"
        )}>
          <NavMain />
        </ScrollArea>
        <div className={cn(
          "mt-auto border-t flex",
          "transition-all duration-300 ease-in-out",
          isCollapsed ? "justify-center p-2" : "p-4"
        )}>
          <Button
            variant="ghost"
            className={cn(
              "flex items-center gap-2",
              "transition-all duration-300 ease-in-out",
              isCollapsed ? "w-10 h-10 p-0 justify-center" : "w-full px-2 justify-start"
            )}
            onClick={() => signOut()}
          >
            <Avatar className="h-6 w-6">
              <AvatarImage src={user.imageUrl} alt={user.fullName || ''} />
              <AvatarFallback>{user.firstName?.charAt(0)}</AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <span className="text-sm font-medium truncate transition-opacity duration-300">{user.fullName}</span>
            )}
          </Button>
        </div>
      </Sidebar>
    </>
  );
}
