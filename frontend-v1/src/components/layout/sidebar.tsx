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
import { Building2 } from 'lucide-react'

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
      console.log('🔐 Estado de autenticación:', {
        isLoaded,
        isSignedIn,
        userId
      });

      if (!isLoaded) {
        console.log('⏳ Auth todavía no está cargado');
        return;
      }

      if (!isSignedIn || !userId) {
        console.log('❌ Usuario no autenticado o sin userId');
        return;
      }

      try {
        console.log('🔄 Iniciando carga de datos para usuario:', userId);
        const data = await getCompanyProfile(userId);
        
        // Log completo de la respuesta
        console.log('📦 Respuesta completa:', {
          data,
          hasProfile: !!data?.profile,
          hasClient: !!data?.client,
          profileData: data?.profile,
          clientData: data?.client
        });

        if (data?.profile && data?.client) {
          const newCompanyData = {
            name: data.profile.name_company,
            description: 'Business Dashboard',
            clientName: `${data.client.first_name} ${data.client.last_name}`
          };
          
          console.log('✅ Actualizando estado con:', newCompanyData);
          setCompanyData(newCompanyData);
        } else {
          console.log('⚠️ No se encontró perfil de empresa');
          setCompanyData({
            name: 'Configura tu Empresa',
            description: 'Click para configurar'
          });
        }
      } catch (error) {
        console.error('❌ Error completo:', error);
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
        <Link href="/dashboard/business-profile" className="flex items-center gap-2 hover:opacity-80 w-full">
          <Avatar>
            <AvatarFallback className="bg-primary/10">
              {companyData.name === 'Configura tu Empresa' ? (
                <Building2 className="h-4 w-4" />
              ) : (
                companyData.name.charAt(0).toUpperCase()
              )}
            </AvatarFallback>
          </Avatar>
          <div className="overflow-hidden">
            <h2 className="text-lg font-semibold leading-none truncate">{companyData.name}</h2>
            <p className="text-xs text-muted-foreground truncate">
              {companyData.clientName || companyData.description}
            </p>
          </div>
        </Link>
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