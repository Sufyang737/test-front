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
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Heading
            title="Chat Templates"
            description="Manage your WhatsApp chat templates and variables."
          />
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </div>

        <Separator />

        <DataTable
          columns={columns}
          data={templates}
          loading={loading}
          error={error}
          onRetry={refreshTemplates}
        />

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