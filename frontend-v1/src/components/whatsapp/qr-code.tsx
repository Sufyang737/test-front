'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { CheckCircle, Loader2, AlertCircle, RefreshCcw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { getPocketBase, authPocketBase, getClientByClerkId, updateClient, getAllClients } from '@/lib/pocketbase'

const WAHA_API_URL = process.env.NEXT_PUBLIC_WAHA_API_URL

export function WhatsAppQR() {
  const [isLoading, setIsLoading] = useState(true)
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [phone, setPhone] = useState<string | null>(null)
  const [shouldPoll, setShouldPoll] = useState(false)
  const [clientId, setClientId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [sessionName, setSessionName] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()
  const { userId, isLoaded, isSignedIn, getToken } = useAuth()

  const findClient = async () => {
    try {
      console.log('🔍 Iniciando búsqueda de cliente...')

      if (!isLoaded) {
        console.log('⏳ Clerk todavía no está listo')
        return false
      }

      if (!isSignedIn || !userId) {
        console.log('❌ Usuario no autenticado')
        router.push('/sign-in')
        return false
      }

      const response = await fetch('/api/whatsapp/status')
      if (!response.ok) {
        throw new Error('Error obteniendo estado')
      }

      const data = await response.json()
      console.log('📊 Estado actual:', data)

      if (data.error) {
        console.error('❌ Error del servidor:', data.error)
        return false
      }

      if (data.status === 'CONNECTED' && data.client) {
        console.log('✅ Cliente encontrado y WhatsApp conectado')
        setClientId(data.client.id)
        setStatus('WORKING')
        setPhone(data.phone)
        router.push('/dashboard')
        return true
      }

      if (data.client) {
        console.log('✅ Cliente encontrado:', data.client)
        setClientId(data.client.id)
        return true
      }

      console.log('❌ No se encontró el cliente')
      return false

    } catch (error) {
      console.error('❌ Error buscando cliente:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const createSession = async () => {
    try {
      console.log('🔍 Verificando sesión existente...');
      const statusResponse = await fetch('/api/whatsapp/status');
      const statusData = await statusResponse.json();

      // Si encontramos una sesión existente y WORKING, la usamos
      if (statusData.sessionFound && statusData.status === 'WORKING' && statusData.client?.username) {
        console.log('✅ Sesión activa encontrada:', statusData.client.username);
        setSessionName(statusData.client.username);
        setStatus('WORKING');
        router.push('/dashboard');
        return;
      }

      // Si hay una sesión existente pero no está WORKING, la eliminamos
      if (statusData.sessionFound && statusData.client?.username) {
        console.log('🗑️ Eliminando sesión no activa:', statusData.client.username);
        await fetch('/api/whatsapp/session', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            sessionName: statusData.client.username
          })
        });
      }

      console.log('🔧 Creando nueva sesión...');
      const response = await fetch('/api/whatsapp/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionName: statusData.client?.username // Usamos el username directamente
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create session');
      }

      const data = await response.json();
      console.log('✨ Sesión creada:', data);
      
      setSessionName(statusData.client?.username);
      setShouldPoll(true);
      await getQR();
    } catch (error) {
      console.error('❌ Error creando sesión:', error);
      setError('No se pudo crear la sesión de WhatsApp');
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo crear la sesión de WhatsApp"
      });
    }
  }

  const getQR = async () => {
    try {
      console.log('🎯 Obteniendo QR...')
      const response = await fetch('/api/whatsapp/qr')
      if (!response.ok) {
        throw new Error('Failed to get QR')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      setQrUrl(url)
      console.log('✅ QR obtenido')
      
    } catch (error) {
      console.error('❌ Error obteniendo QR:', error)
      setError('No se pudo obtener el código QR')
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo obtener el código QR"
      })
    }
  }

  const checkStatus = async () => {
    if (status === 'WORKING') {
      console.log('✅ Ya está en WORKING, no chequeo más')
      setShouldPoll(false)
      return
    }

    try {
      console.log('🔄 Verificando estado...')
      const statusResponse = await fetch('/api/whatsapp/status')
      if (!statusResponse.ok) {
        throw new Error('Failed to check status')
      }

      const data = await statusResponse.json()
      console.log('📊 Status response completa:', JSON.stringify(data, null, 2))
      
      setStatus(data.status)
      
      if (data.status === 'WORKING' || data.engine?.state === 'CONNECTED') {
        console.log('🎉 WhatsApp conectado!')
        setShouldPoll(false)

        // Intentamos obtener el nombre de la sesión de varias fuentes posibles
        const finalSessionName = sessionName || data.session_id || data.name
        console.log('📝 Nombre de sesión final que vamos a usar:', finalSessionName)
        
        if (!finalSessionName) {
          console.error('❌ No se pudo obtener el nombre de la sesión')
          return
        }

        setIsUpdating(true)
        try {
          console.log('💾 Guardando en PocketBase...')
          await updatePocketBase(finalSessionName)
          
          toast({
            title: "¡WhatsApp Conectado!",
            description: "Tu WhatsApp está listo para usar",
          })

          setTimeout(() => {
            router.push('/dashboard/onboarding/business-profile')
          }, 1500)
        } catch (error) {
          console.error('Error durante la actualización:', error)
          toast({
            variant: "destructive",
            title: "Error",
            description: "Hubo un problema al guardar la información"
          })
        } finally {
          setIsUpdating(false)
        }
        return
      }
      
    } catch (error) {
      console.error('❌ Error verificando estado:', error)
    }
  }

  const updatePocketBase = async (sessionId: string) => {
    try {
      console.log('💾 Iniciando actualización en PocketBase...');
      console.log('📝 Datos exactos a guardar:', {
        sessionId,
        userId,
        clientId
      });

      if (!userId) {
        throw new Error('No hay userId para actualizar');
      }

      // Solo actualizamos si la sesión está activa
      const statusResponse = await fetch('/api/whatsapp/status');
      const statusData = await statusResponse.json();
      
      if (statusData.status !== 'WORKING') {
        console.log('⚠️ No se actualiza PocketBase porque la sesión no está activa');
        return;
      }

      const client = await getClientByClerkId(userId);
      
      if (!client) {
        console.error('❌ No se encontró el cliente en la base de datos');
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se encontró tu perfil en la base de datos"
        });
        throw new Error('No se encontró el cliente en la base de datos');
      }

      console.log('✅ Cliente encontrado, actualizando:', client);
      const updated = await updateClient(client.id, {
        session_id: sessionId,
        phone_client: statusData.me?.id ? parseInt(statusData.me.id) : 0,
        updated: new Date().toISOString()
      });
      
      console.log('✅ Cliente actualizado exitosamente:', updated);
      return updated;
    } catch (error) {
      console.error('❌ Error actualizando PocketBase:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Error actualizando la información"
      });
      throw error;
    }
  }

  useEffect(() => {
    if (isLoaded && userId) {
      findClient()
    }
  }, [isLoaded, userId])

  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    let intervalId: NodeJS.Timeout

    if (shouldPoll && status !== 'WORKING') {
      console.log('🔄 Iniciando polling...')
      timeoutId = setTimeout(() => {
        checkStatus()
        intervalId = setInterval(() => {
          if (shouldPoll && status !== 'WORKING') {
            checkStatus()
          }
        }, 2000)
      }, 5000)
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
      if (intervalId) clearInterval(intervalId)
    }
  }, [shouldPoll, status])

  // Mostrar loading mientras Clerk se inicializa
  if (!isLoaded) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center p-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center space-x-2"
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            <p>Inicializando...</p>
          </motion.div>
        </CardContent>
      </Card>
    )
  }

  // Si no está autenticado, no mostramos nada (la redirección se maneja en findClient)
  if (!isSignedIn) {
    return null
  }

  // Si el estado es WORKING, no mostramos nada
  if (status === 'WORKING') {
    return null
  }

  // Si estamos actualizando PocketBase, mostramos un loader especial
  if (isUpdating) {
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center space-y-4"
          >
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30">
              <Loader2 className="w-8 h-8 text-green-600 dark:text-green-400 animate-spin" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold text-green-600 dark:text-green-400">
                ¡WhatsApp Conectado!
              </h2>
              <p className="text-sm text-muted-foreground">
                Guardando la información...
              </p>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Conectar WhatsApp</CardTitle>
        <CardDescription>
          Escanea el código QR con tu WhatsApp para comenzar
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center space-y-4">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center space-x-2"
            >
              <Loader2 className="h-4 w-4 animate-spin" />
              <p>Cargando...</p>
            </motion.div>
          ) : error ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center space-y-4"
            >
              <AlertCircle className="h-8 w-8 text-destructive" />
              <p className="text-sm text-muted-foreground text-center">{error}</p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setError(null)
                  createSession()
                }}
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Reintentar
              </Button>
            </motion.div>
          ) : qrUrl ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative flex flex-col items-center gap-4"
            >
              <img 
                src={qrUrl} 
                alt="WhatsApp QR Code"
                className="w-64 h-64"
                key={qrUrl}
              />
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Escanea el código QR con WhatsApp
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setQrUrl(null)
                    setStatus(null)
                    setShouldPoll(false)
                    setError(null)
                  }}
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Button onClick={createSession}>
                Conectar WhatsApp
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
} 
