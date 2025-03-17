'use client';

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

type BreadcrumbItem = {
  title: string;
  link: string;
};

// This allows to add custom title as well
const routeMapping: Record<string, BreadcrumbItem[]> = {
  '/dashboard': [{ title: 'Panel', link: '/dashboard' }],
  '/dashboard/overview': [
    { title: 'Panel', link: '/dashboard' },
    { title: 'Resumen', link: '/dashboard/overview' }
  ],
  '/dashboard/chats': [
    { title: 'Panel', link: '/dashboard' },
    { title: 'Chats', link: '/dashboard/chats' }
  ],
  '/dashboard/kanban': [
    { title: 'Panel', link: '/dashboard' },
    { title: 'Kanban', link: '/dashboard/kanban' }
  ],
  '/dashboard/products': [
    { title: 'Panel', link: '/dashboard' },
    { title: 'Productos', link: '/dashboard/products' }
  ],
  '/dashboard/business-profile': [
    { title: 'Panel', link: '/dashboard' },
    { title: 'Perfil de Empresa', link: '/dashboard/business-profile' }
  ],
  '/dashboard/profile': [
    { title: 'Panel', link: '/dashboard' },
    { title: 'Perfil', link: '/dashboard/profile' }
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
