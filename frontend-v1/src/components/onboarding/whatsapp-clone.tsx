'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Image from 'next/image'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'

interface WhatsAppCloneProps {
  userId: string
}

export default function WhatsAppClone({ userId }: WhatsAppCloneProps) {
  const [qrCode, setQrCode] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState('')
  const { toast } = useToast()
  const router = useRouter()

  // Verificar el estado de la sesión cada 5 segundos
  useEffect(() => {
    let intervalId: NodeJS.Timeout

    const checkSession = async () => {
      try {
        const response = await fetch(`${process.env.WAHA_API_URL}/api/default/auth/status`)
        const data = await response.json()

        if (data.status === 'CONNECTED') {
          // Guardar el sessionId en PocketBase
          await saveSession(data.sessionId)
          
          toast({
            title: '¡Conexión exitosa!',
            description: 'Tu WhatsApp ha sido clonado correctamente.',
          })

          // Redirigir al dashboard
          router.push('/dashboard')
        }
      } catch (error) {
        console.error('Error checking session:', error)
      }
    }

    if (qrCode) {
      intervalId = setInterval(checkSession, 5000)
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [qrCode, router])

  const saveSession = async (sessionId: string) => {
    try {
      const response = await fetch('/api/whatsapp/save-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      })

      if (!response.ok) {
        throw new Error('Error saving session')
      }
    } catch (error) {
      console.error('Error saving session:', error)
      toast({
        title: 'Error',
        description: 'No se pudo guardar la sesión. Por favor intenta nuevamente.',
        variant: 'destructive',
      })
    }
  }

  const getQRCode = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/whatsapp/qr')
      if (!response.ok) throw new Error('Error al obtener el código QR')
      
      const data = await response.json()
      setQrCode(data.qrCode)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo obtener el código QR. Por favor intenta nuevamente.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const requestCode = async () => {
    if (!phoneNumber) {
      toast({
        title: 'Error',
        description: 'Por favor ingresa tu número de teléfono',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch('/api/whatsapp/request-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber }),
      })

      if (!response.ok) throw new Error('Error al solicitar el código')

      toast({
        title: 'Código enviado',
        description: 'Te hemos enviado un código por WhatsApp',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo enviar el código. Por favor intenta nuevamente.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Clonar WhatsApp</CardTitle>
        <CardDescription>
          Elige cómo quieres clonar tu WhatsApp
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="qr" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="qr">Código QR</TabsTrigger>
            <TabsTrigger value="code">Código por WhatsApp</TabsTrigger>
          </TabsList>
          <TabsContent value="qr" className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
              {qrCode ? (
                <div className="relative w-64 h-64">
                  <Image
                    src={qrCode}
                    alt="WhatsApp QR Code"
                    fill
                    className="object-contain"
                  />
                </div>
              ) : (
                <Button
                  onClick={getQRCode}
                  disabled={isLoading}
                >
                  {isLoading ? 'Generando...' : 'Generar código QR'}
                </Button>
              )}
            </div>
          </TabsContent>
          <TabsContent value="code" className="space-y-4">
            <div className="flex flex-col space-y-4">
              <Input
                type="tel"
                placeholder="Número de teléfono (con código de país)"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
              <Button
                onClick={requestCode}
                disabled={isLoading}
              >
                {isLoading ? 'Enviando...' : 'Solicitar código'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
} 