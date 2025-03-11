'use client';

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

type BreadcrumbItem = {
  title: string;
  link: string;
};

// This allows to add custom title as well
const routeMapping: Record<string, BreadcrumbItem[]> = {
  '/dashboard': [{ title: 'Dashboard', link: '/dashboard' }],
  '/dashboard/overview': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: 'Overview', link: '/dashboard/overview' }
  ],
  '/dashboard/chats': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: 'Chats', link: '/dashboard/chats' }
  ],
  '/dashboard/kanban': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: 'Kanban', link: '/dashboard/kanban' }
  ],
  '/dashboard/products': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: 'Products', link: '/dashboard/products' }
  ],
  '/dashboard/business-profile': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: 'Business Profile', link: '/dashboard/business-profile' }
  ],
  '/dashboard/profile': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: 'Profile', link: '/dashboard/profile' }
  ]
};

export function useBreadcrumbs() {
  const pathname = usePathname();

  const breadcrumbs = useMemo(() => {
    // Check if we have a custom mapping for this exact path
    if (routeMapping[pathname]) {
      return routeMapping[pathname];
    }

    // If no exact match, fall back to generating breadcrumbs from the path
    const segments = pathname.split('/').filter(Boolean);
    return segments.map((segment, index) => {
      const path = `/${segments.slice(0, index + 1).join('/')}`;
      // Format the title by replacing hyphens with spaces and capitalizing each word
      const title = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      return {
        title,
        link: path
      };
    });
  }, [pathname]);

  return breadcrumbs;
}
