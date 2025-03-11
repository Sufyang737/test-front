'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { getCompanyProfile } from '@/lib/utils/pocketbase'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { Building2 } from 'lucide-react'

export function CompanyLogo() {
  const { userId } = useAuth()
  const [companyName, setCompanyName] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [hasProfile, setHasProfile] = useState(true)

  useEffect(() => {
    async function loadCompanyProfile() {
      if (!userId) {
        setIsLoading(false)
        return
      }

      try {
        const result = await getCompanyProfile(userId)
        if (result?.profile) {
          setCompanyName(result.profile.name_company)
          setHasProfile(true)
        } else {
          setCompanyName('Configura tu Empresa')
          setHasProfile(false)
        }
      } catch (error) {
        console.error('Error loading company profile:', error)
        setCompanyName('Error al cargar')
        setHasProfile(false)
      } finally {
        setIsLoading(false)
      }
    }

    loadCompanyProfile()
  }, [userId])

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="space-y-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    )
  }

  if (!hasProfile) {
    return (
      <Link href="/dashboard/business-profile" className="flex items-center gap-2 hover:opacity-80">
        <Avatar>
          <AvatarFallback className="bg-primary/10">
            <Building2 className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-sm font-medium leading-none text-primary">{companyName}</h2>
          <p className="text-xs text-muted-foreground">Click para configurar</p>
        </div>
      </Link>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Avatar>
        <AvatarFallback>
          {companyName.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div>
        <h2 className="text-lg font-semibold leading-none">{companyName}</h2>
        <p className="text-xs text-muted-foreground">Business Dashboard</p>
      </div>
    </div>
  )
} 