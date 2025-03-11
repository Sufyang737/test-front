'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CircleUser,
  Command,
  LayoutDashboard,
  LayoutList,
  Package,
  Settings,
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/components/ui/sidebar';

const items = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    url: '/dashboard',
    isActive: true
  },
  {
    title: 'Product',
    icon: Package,
    url: '/dashboard/product'
  },
  {
    title: 'Account',
    icon: CircleUser,
    items: [
      {
        title: 'Profile',
        url: '/dashboard/profile'
      },
      {
        title: 'Login',
        url: '/sign-in'
      }
    ]
  },
  {
    title: 'Kanban',
    icon: LayoutList,
    url: '/dashboard/kanban'
  },
  {
    title: 'Settings',
    icon: Settings,
    items: [
      {
        title: 'Account',
        url: '/dashboard/settings/account'
      },
      {
        title: 'Notifications',
        url: '/dashboard/settings/notifications'
      },
      {
        title: 'Appearance',
        url: '/dashboard/settings/appearance'
      },
      {
        title: 'Security',
        url: '/dashboard/settings/security'
      }
    ]
  },
  {
    title: 'Help',
    icon: Command,
    items: [
      {
        title: 'Documentation',
        url: '/dashboard/help/documentation'
      },
      {
        title: 'API Reference',
        url: '/dashboard/help/api'
      },
      {
        title: 'Support',
        url: '/dashboard/help/support'
      }
    ]
  }
];

export default function NavMain() {
  const pathname = usePathname();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <nav className="flex flex-col gap-4">
      {!isCollapsed && <div className="text-xs font-medium text-muted-foreground">Platform</div>}
      <div className={cn(
        "flex flex-col transition-all duration-300 ease-in-out space-y-1", 
        isCollapsed && "items-center gap-2"
      )}>
        {items.map((item) => {
          const Icon = item.icon;
          return item?.items ? (
            <Collapsible key={item.title}>
              <div className="relative">
                <CollapsibleTrigger asChild>
                  <button 
                    type="button"
                    className={cn(
                      "flex w-full items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                      pathname.startsWith(item.url || '') && "bg-accent text-accent-foreground",
                      "flex items-center transition-all duration-300 ease-in-out",
                      isCollapsed ? "w-10 h-10 justify-center p-0" : "w-full gap-2 px-2"
                    )}
                  >
                    {Icon && <Icon className="h-4 w-4 shrink-0 transition-transform duration-300 ease-in-out" />}
                    {!isCollapsed && <span className="truncate transition-opacity duration-300">{item.title}</span>}
                  </button>
                </CollapsibleTrigger>
                {!isCollapsed && (
                  <CollapsibleContent>
                    <div className="pl-6 space-y-1">
                      {item.items?.map((subItem) => (
                        <div key={subItem.title} className="relative">
                          <Link
                            href={subItem.url}
                            className={cn(
                              "flex w-full items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                              pathname === subItem.url && "bg-accent text-accent-foreground",
                              "py-1.5 transition-all duration-300 ease-in-out"
                            )}
                          >
                            <span className="truncate transition-opacity duration-300">{subItem.title}</span>
                          </Link>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                )}
              </div>
            </Collapsible>
          ) : (
            <div key={item.title} className="relative">
              <Link
                href={item.url || ''}
                className={cn(
                  "flex w-full items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                  pathname === item.url && "bg-accent text-accent-foreground",
                  "flex items-center transition-all duration-300 ease-in-out",
                  isCollapsed ? "w-10 h-10 justify-center p-0" : "w-full gap-2 px-2"
                )}
              >
                {Icon && <Icon className="h-4 w-4 shrink-0 transition-transform duration-300 ease-in-out" />}
                {!isCollapsed && <span className="truncate transition-opacity duration-300">{item.title}</span>}
              </Link>
            </div>
          );
        })}
      </div>
    </nav>
  );
} 