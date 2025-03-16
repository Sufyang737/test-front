'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { routes } from '@/config/routes';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/components/ui/sidebar';

export default function NavMain() {
  const pathname = usePathname();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <nav className="flex flex-col gap-4">
      <div className={cn(
        "flex flex-col transition-all duration-300 ease-in-out space-y-4", 
        isCollapsed && "items-center gap-2"
      )}>
        {routes.map((section) => (
          <div key={section.section} className="flex flex-col gap-1">
            {!isCollapsed && (
              <div className="text-xs font-medium text-muted-foreground px-2">
                {section.section}
              </div>
            )}
            {section.routes.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="relative">
                  <Link
                    href={item.href}
                    className={cn(
                      "flex w-full items-center rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                      pathname === item.href && "bg-accent text-accent-foreground",
                      "flex items-center transition-all duration-300 ease-in-out",
                      isCollapsed ? "w-10 h-10 justify-center p-0" : "w-full gap-2 px-3 py-2"
                    )}
                  >
                    {Icon && <Icon className="h-4 w-4 shrink-0 transition-transform duration-300 ease-in-out" />}
                    {!isCollapsed && <span className="truncate transition-opacity duration-300">{item.label}</span>}
                  </Link>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </nav>
  );
} 