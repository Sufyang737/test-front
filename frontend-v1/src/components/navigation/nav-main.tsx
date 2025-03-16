'use client';

import { useCallback, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  const router = useRouter();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  // Memoize the flattened routes for keyboard navigation
  const flattenedRoutes = useMemo(() => {
    return routes.reduce((acc, section) => {
      return [...acc, ...section.routes];
    }, [] as typeof routes[0]['routes']);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent, href: string) => {
    if (e.key === 'Enter') {
      router.push(href);
    }
  }, [router]);

  // Prefetch routes on hover
  const handleMouseEnter = useCallback((href: string) => {
    router.prefetch(href);
  }, [router]);

  return (
    <nav className="flex flex-col gap-4" role="navigation">
      <div 
        className={cn(
          "flex flex-col transition-all duration-200 ease-out space-y-4", 
          isCollapsed && "items-center gap-2"
        )}
      >
        {routes.map((section) => (
          <div key={section.section} className="flex flex-col gap-1">
            {!isCollapsed && (
              <div 
                className="text-xs font-medium text-muted-foreground px-2"
                role="group"
                aria-label={section.section}
              >
                {section.section}
              </div>
            )}
            {section.routes.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <div key={item.label} className="relative">
                  <Link
                    href={item.href}
                    onMouseEnter={() => handleMouseEnter(item.href)}
                    onKeyDown={(e) => handleKeyDown(e, item.href)}
                    className={cn(
                      "flex w-full items-center rounded-md text-sm font-medium",
                      "hover:bg-accent hover:text-accent-foreground",
                      "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary",
                      "transform transition-all duration-200 ease-out will-change-transform",
                      isActive && "bg-accent text-accent-foreground",
                      isCollapsed ? "w-10 h-10 justify-center p-0" : "w-full gap-2 px-3 py-2"
                    )}
                    aria-current={isActive ? 'page' : undefined}
                    role="menuitem"
                    tabIndex={0}
                  >
                    {Icon && (
                      <Icon 
                        className={cn(
                          "h-4 w-4 shrink-0",
                          "transform transition-transform duration-200 ease-out",
                          isActive && "scale-110"
                        )} 
                        aria-hidden="true"
                      />
                    )}
                    {!isCollapsed && (
                      <span className="truncate transition-opacity duration-200">
                        {item.label}
                      </span>
                    )}
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