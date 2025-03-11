import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useTemplates } from '../hooks/use-templates'
import { Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DEFAULT_VARIABLES, DEFAULT_TEMPLATES, TemplateVariable } from '../config/default-variables'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

interface CreateTemplateProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CreateTemplate({ open, onClose, onSuccess }: CreateTemplateProps) {
  const { createTemplate } = useTemplates()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name_template: '',
    template: '',
    tags: '',
    variables: ''
  })
  const [selectedCategory, setSelectedCategory] = useState<TemplateVariable['category']>('client')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError(null)

      await createTemplate(formData)
      onSuccess()
      
      // Reset form
      setFormData({
        name_template: '',
        template: '',
        tags: '',
        variables: ''
      })
      setSelectedCategory('client')
      setSelectedTemplate('')
    } catch (error) {
      console.error('Error creating template:', error)
      setError(error instanceof Error ? error.message : 'Failed to create template')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleTemplateSelect = (templateName: string) => {
    const template = DEFAULT_TEMPLATES.find(t => t.name_template === templateName)
    if (template) {
      setFormData({
        name_template: template.name_template,
        template: template.template,
        tags: template.tags,
        variables: template.variables
      })
      setSelectedTemplate(templateName)
    }
  }

  const insertVariable = (variable: TemplateVariable) => {
    const variableName = `{${variable.name}}`
    const textarea = document.getElementById('template') as HTMLTextAreaElement
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const text = textarea.value
      const before = text.substring(0, start)
      const after = text.substring(end)
      
      const newText = before + variableName + after
      setFormData(prev => ({
        ...prev,
        template: newText,
        variables: prev.variables ? `${prev.variables},${variable.name}` : variable.name
      }))
      
      // Set cursor position after the inserted variable
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + variableName.length, start + variableName.length)
      }, 0)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Create New Template</DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="custom" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="custom">Custom Template</TabsTrigger>
            <TabsTrigger value="preset">Preset Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="preset" className="space-y-4">
            <div className="grid gap-4">
              {DEFAULT_TEMPLATES.map((template) => (
                <div
                  key={template.name_template}
                  className={cn(
                    "p-4 border rounded-lg cursor-pointer transition-colors",
                    selectedTemplate === template.name_template
                      ? "border-primary bg-primary/5"
                      : "hover:border-primary/50"
                  )}
                  onClick={() => handleTemplateSelect(template.name_template)}
                >
                  <h3 className="font-medium">{template.name_template}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{template.template}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {template.variables.split(',').map((variable) => (
                      <Badge key={variable} variant="secondary">
                        {variable.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="custom">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name_template">Template Name</Label>
                    <Input
                      id="name_template"
                      name="name_template"
                      placeholder="Enter template name"
                      value={formData.name_template}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="template">Template Content</Label>
                    <Textarea
                      id="template"
                      name="template"
                      placeholder="Type your message here..."
                      value={formData.template}
                      onChange={handleChange}
                      required
                      className="min-h-[200px] font-mono"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tags">
                      Tags
                      <span className="text-sm text-muted-foreground ml-1">
                        (Comma separated)
                      </span>
                    </Label>
                    <Input
                      id="tags"
                      name="tags"
                      placeholder="welcome, product, support"
                      value={formData.tags}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Variable Categories</Label>
                    <Select
                      value={selectedCategory}
                      onValueChange={(value) => setSelectedCategory(value as TemplateVariable['category'])}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="client">Client Variables</SelectItem>
                        <SelectItem value="product">Product Variables</SelectItem>
                        <SelectItem value="support">Support Variables</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Available Variables</Label>
                    <ScrollArea className="h-[300px] rounded-md border p-4">
                      <div className="space-y-2">
                        {DEFAULT_VARIABLES
                          .filter(v => v.category === selectedCategory)
                          .map((variable) => (
                            <div
                              key={variable.name}
                              className="p-2 rounded-lg hover:bg-muted cursor-pointer"
                              onClick={() => insertVariable(variable)}
                            >
                              <div className="font-medium">{variable.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {variable.description}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                Example: {variable.example}
                              </div>
                            </div>
                          ))}
                      </div>
                    </ScrollArea>
                  </div>

                  <div className="space-y-2">
                    <Label>Used Variables</Label>
                    <div className="flex flex-wrap gap-1 min-h-[2.5rem] p-2 rounded-md border">
                      {formData.variables.split(',').filter(Boolean).map((variable) => (
                        <Badge key={variable} variant="secondary">
                          {variable.trim()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Template
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
} 