'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { routes } from '@/config/routes'
import { Separator } from '@/components/ui/separator'
import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { getCompanyProfile } from '@/lib/utils/pocketbase'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Building2, Settings } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface CompanyData {
  name: string;
  description: string;
  clientName?: string;
}

export default function Sidebar() {
  const pathname = usePathname()
  const { userId, isLoaded, isSignedIn } = useAuth()
  const [companyData, setCompanyData] = useState<CompanyData>({
    name: 'Cargando...',
    description: 'Cargando...'
  })

  useEffect(() => {
    async function loadCompanyData() {
      if (!isLoaded) return;
      if (!isSignedIn || !userId) return;

      try {
        const data = await getCompanyProfile(userId);
        
        if (data?.profile && data?.client) {
          setCompanyData({
            name: data.profile.name_company,
            description: 'Business Dashboard',
            clientName: `${data.client.first_name} ${data.client.last_name}`
          });
        } else {
          setCompanyData({
            name: 'Configura tu Empresa',
            description: 'Click para configurar'
          });
        }
      } catch (error) {
        setCompanyData({
          name: 'Error al cargar',
          description: 'Intenta de nuevo'
        });
      }
    }

    loadCompanyData();
  }, [userId, isLoaded, isSignedIn]);

  return (
    <div className="w-[240px] flex flex-col fixed inset-y-0 z-50 bg-background">
      <div className="border-r h-[60px] flex items-center px-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link 
                href="/dashboard/business-profile" 
                className={cn(
                  "flex items-center gap-2 w-full p-2 rounded-lg transition-colors",
                  companyData.name === 'Configura tu Empresa' 
                    ? "hover:bg-primary/10" 
                    : "hover:opacity-80"
                )}
              >
                <Avatar>
                  <AvatarFallback 
                    className={cn(
                      companyData.name === 'Configura tu Empresa' 
                        ? "bg-primary/10 text-primary animate-pulse" 
                        : "bg-primary/10"
                    )}
                  >
                    {companyData.name === 'Configura tu Empresa' ? (
                      <Building2 className="h-4 w-4" />
                    ) : (
                      companyData.name.charAt(0).toUpperCase()
                    )}
                  </AvatarFallback>
                </Avatar>
                <div className="overflow-hidden flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold leading-none truncate">
                      {companyData.name}
                    </h2>
                    {companyData.name === 'Configura tu Empresa' && (
                      <Settings className="h-4 w-4 text-muted-foreground animate-spin-slow" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {companyData.clientName || companyData.description}
                  </p>
                </div>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">
              {companyData.name === 'Configura tu Empresa' 
                ? "Haz clic para configurar tu empresa"
                : "Editar perfil de empresa"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <ScrollArea className="flex flex-col flex-1 border-r">
        <div className="flex flex-col gap-4 p-2">
          {routes.map((section) => (
            <div key={section.section} className="flex flex-col gap-1">
              <p className="text-xs font-medium px-2 py-1 text-muted-foreground">
                {section.section}
              </p>
              {section.routes.map((route) => (
                <Button
                  key={route.href}
                  variant="ghost"
                  className={cn(
                    'justify-start gap-2 px-2 text-sm h-9',
                    pathname === route.href && 'bg-accent'
                  )}
                  asChild
                >
                  <Link href={route.href}>
                    <route.icon className="h-4 w-4" />
                    {route.label}
                  </Link>
                </Button>
              ))}
              <Separator className="mt-2" />
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
} 