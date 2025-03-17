'use client'

import { useState } from 'react'
import { Heading } from '@/components/ui/heading'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { DataTable } from '@/components/ui/data-table'
import { columns } from './columns'
import { useTemplates } from '@/features/templates/hooks/use-templates'
import { CreateTemplate } from '@/features/templates/components/create-template'
import { PageContainer } from '@/components/layout/page-container'
import { Separator } from '@/components/ui/separator'

export default function TemplatesPage() {
  const [open, setOpen] = useState(false)
  const { templates, loading, error, refreshTemplates } = useTemplates()

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight">Plantillas de Chat</h2>
            <p className="text-sm text-muted-foreground">
              Crea y gestiona plantillas para agilizar tu comunicación.
            </p>
          </div>
          <Button 
            onClick={() => setOpen(true)}
            className="transition-all duration-200 hover:shadow-lg"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Plantilla
          </Button>
        </div>

        <Separator className="my-6" />

        <div className="rounded-lg border bg-card p-4">
          <DataTable
            columns={columns}
            data={templates}
            loading={loading}
            error={error}
            onRetry={refreshTemplates}
          />
        </div>

        <CreateTemplate 
          open={open} 
          onClose={() => setOpen(false)}
          onSuccess={() => {
            setOpen(false)
            refreshTemplates()
          }}
        />
      </div>
    </PageContainer>
  )
} 