import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Send, Smile, FileText, Bot } from 'lucide-react'
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useTemplates } from '@/features/templates/hooks/use-templates'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { ClipboardIcon } from '@radix-ui/react-icons'

interface ChatInputProps {
  onSendMessage: (content: string, file?: File) => Promise<void>
  disabled?: boolean
  loading?: boolean
  botEnabled?: boolean
}

export function ChatInput({ 
  onSendMessage, 
  disabled, 
  loading,
  botEnabled = false
}: ChatInputProps) {
  const [message, setMessage] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [showTemplates, setShowTemplates] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [variables, setVariables] = useState<Record<string, string>>({})
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { templates, loading: loadingTemplates } = useTemplates()

  const handleSendMessage = async () => {
    if (!message.trim() && !file) return
    if (loading) return

    try {
      await onSendMessage(message.trim(), file || undefined)
      setMessage('')
      setFile(null)
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
    }
  }

  const handleAttachClick = () => {
    fileInputRef.current?.click()
  }

  const insertEmoji = (emoji: any) => {
    setMessage(prev => prev + emoji.native)
  }

  const handleTemplateSelect = (template: any) => {
    setSelectedTemplate(template)
    // Extract variables from template
    const matches = template.template.match(/\{([^}]+)\}/g) || []
    const uniqueVars = [...new Set(matches.map((m: string) => m.slice(1, -1)))]
    const initialVars = Object.fromEntries(uniqueVars.map(v => [v, '']))
    setVariables(initialVars)
  }

  const applyTemplate = () => {
    if (!selectedTemplate) return

    let finalMessage = selectedTemplate.template
    Object.entries(variables).forEach(([key, value]) => {
      finalMessage = finalMessage.replace(new RegExp(`\\{${key}\\}`, 'g'), value)
    })

    setMessage(finalMessage)
    setShowTemplates(false)
    setSelectedTemplate(null)
    setVariables({})
  }

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`
    }
  }, [message])

  return (
    <div className="p-4 bg-background border-t">
      <div className="flex items-end gap-2 max-w-4xl mx-auto">
        {/* Botón de adjuntar archivo */}
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 shrink-0"
          onClick={handleAttachClick}
          disabled={disabled || loading || botEnabled}
        >
          <ClipboardIcon className="h-5 w-5" />
        </Button>

        {/* Emoji picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0"
              disabled={disabled || loading || botEnabled}
            >
              <Smile className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            side="top"
            align="start"
            className="w-auto p-0 bg-transparent border-none"
          >
            <Picker
              data={data}
              onEmojiSelect={insertEmoji}
              theme="light"
            />
          </PopoverContent>
        </Popover>

        {/* Input oculto para archivos */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
          accept="image/*,video/*,audio/*,application/pdf"
        />

        {/* Área de texto */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={botEnabled ? "Chat bloqueado - Bot activo" : "Escribe un mensaje..."}
            disabled={disabled || loading || botEnabled}
            className={cn(
              "min-h-[40px] max-h-[150px] py-2.5 pr-12 resize-none",
              "scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
            )}
          />

          {/* Archivo adjunto */}
          {file && (
            <div className="absolute -top-8 left-0 right-12 bg-background border rounded-lg p-2 text-sm flex items-center justify-between">
              <span className="truncate">{file.name}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setFile(null)}
              >
                ×
              </Button>
            </div>
          )}

          {/* Templates button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 bottom-2 h-6 w-6"
            onClick={() => setShowTemplates(true)}
            disabled={disabled || loading || botEnabled}
          >
            <FileText className="h-4 w-4" />
          </Button>
        </div>

        {/* Botón de enviar */}
        <Button
          size="icon"
          className="h-10 w-10 shrink-0"
          onClick={handleSendMessage}
          disabled={disabled || loading || (!message.trim() && !file) || botEnabled}
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>

      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate ? 'Fill Template Variables' : 'Select Template'}
            </DialogTitle>
          </DialogHeader>

          {selectedTemplate ? (
            <div className="space-y-4">
              <div className="p-4 border rounded-lg bg-muted/50">
                <p className="whitespace-pre-wrap">{selectedTemplate.template}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {selectedTemplate.variables.split(',').map((variable: string) => (
                    <Badge key={variable} variant="secondary">
                      {variable.trim()}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 py-4">
                {Object.entries(variables).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={key}>{key}</Label>
                    <Input
                      id={key}
                      value={value}
                      onChange={(e) => setVariables(prev => ({
                        ...prev,
                        [key]: e.target.value
                      }))}
                      placeholder={`Enter ${key}`}
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSelectedTemplate(null)
                    setVariables({})
                  }}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={applyTemplate}
                  disabled={Object.values(variables).some(v => !v)}
                >
                  Apply Template
                </Button>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="grid gap-4 p-2">
                {loadingTemplates ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : templates.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No templates found
                  </div>
                ) : (
                  templates.map((template) => (
                    <div
                      key={template.id}
                      className={cn(
                        "p-4 border rounded-lg cursor-pointer transition-colors",
                        "hover:border-primary/50"
                      )}
                      onClick={() => handleTemplateSelect(template)}
                    >
                      <h3 className="font-medium">{template.name_template}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {template.template}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {template.variables.split(',').map((variable) => (
                          <Badge key={variable} variant="secondary">
                            {variable.trim()}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 