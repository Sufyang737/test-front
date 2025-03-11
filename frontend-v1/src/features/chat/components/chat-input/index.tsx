'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Send, Smile } from 'lucide-react'
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface ChatInputProps {
  onSend: (message: string) => Promise<void>
  disabled?: boolean
  loading?: boolean
}

export function ChatInput({ onSend, disabled, loading }: ChatInputProps) {
  const [message, setMessage] = useState('')
  const [rows, setRows] = useState(1)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || disabled) return

    try {
      await onSend(message.trim())
      setMessage('')
      setRows(1)
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target
    setMessage(textarea.value)
    
    // Auto-resize textarea
    const newRows = textarea.value.split('\n').length
    setRows(Math.min(Math.max(1, newRows), 5))
  }

  const addEmoji = (emoji: any) => {
    setMessage(prev => prev + emoji.native)
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <div className="flex-1 flex items-end gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              disabled={disabled}
            >
              <Smile className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            side="top" 
            align="start"
            className="w-auto p-0"
          >
            <Picker
              data={data}
              onEmojiSelect={addEmoji}
              theme="light"
              previewPosition="none"
            />
          </PopoverContent>
        </Popover>

        <Textarea
          value={message}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={disabled}
          rows={rows}
          className="min-h-0 resize-none"
        />
      </div>

      <Button 
        type="submit" 
        size="icon" 
        disabled={!message.trim() || disabled}
        className="h-9 w-9"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </form>
  )
} 