'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { CheckCircle, Loader2, AlertCircle, RefreshCcw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import PocketBase from 'pocketbase'

const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL)
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

  // Autenticar PocketBase con el token de Clerk
  const authPocketBase = async () => {
    try {
      const token = await getToken();
      if (!token) {
        console.error('❌ No se pudo obtener el token de Clerk');
        throw new Error('No auth token available');
      }
      
      console.log('🔑 Token obtenido, autenticando con PocketBase...');
      pb.authStore.save(token, null);
      
      // Verificar que la autenticación fue exitosa
      if (!pb.authStore.isValid) {
        console.error('❌ Token no válido para PocketBase');
        throw new Error('Invalid PocketBase authentication');
      }
      
      console.log('✅ Autenticación con PocketBase exitosa');
      return true;
    } catch (error) {
      console.error('❌ Error en autenticación:', error);
      throw error;
    }
  };

  // Buscar el cliente en PocketBase
  const findClient = async () => {
    try {
      console.log('🔍 Buscando cliente...')
      console.log('Auth status:', { isLoaded, isSignedIn, userId })

      if (!isLoaded) {
        console.log('⏳ Clerk todavía no está listo')
        return false
      }

      if (!isSignedIn || !userId) {
        console.log('❌ Usuario no autenticado')
        router.push('/sign-in')
        return false
      }

      await authPocketBase();

      const records = await pb.collection('clients').getList(1, 1, {
        filter: `clerk_id = "${userId}"`
      })
      
      console.log('📄 Resultado completo de la búsqueda:', {
        totalItems: records.totalItems,
        page: records.page,
        perPage: records.perPage,
        items: records.items,
        filter: `clerk_id = "${userId}"`
      })
      
      if (records.items.length > 0) {
        const client = records.items[0]
        console.log('👤 Cliente encontrado:', client)
        setClientId(client.id)
        
        // Si ya tiene una sesión activa, verificar en WAHA
        if (client.session_id) {
          try {
            const wahaResponse = await fetch(`${WAHA_API_URL}/api/sessions/${client.session_id}`);
            if (wahaResponse.ok) {
              const wahaData = await wahaResponse.json();
              if (wahaData.status === 'WORKING' || wahaData.engine?.state === 'CONNECTED') {
                console.log('✅ Cliente ya tiene sesión activa y funcionando')
                setStatus('WORKING')
                setPhone(client.phone_client?.toString() || null)
                router.push('/dashboard')
                return true
              }
            }
          } catch (error) {
            console.log('Error verificando sesión en WAHA:', error)
          }
        }
      }
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
      console.log('🔧 Creando sesión...')
      const response = await fetch('/api/whatsapp/session', {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to create session')
      }

      const data = await response.json()
      console.log('✨ Sesión creada (data completa):', data)
      console.log('✨ session.name:', data.name)
      console.log('✨ session.session:', data.session)
      console.log('✨ session completo:', JSON.stringify(data, null, 2))
      
      // Guardamos el nombre de la sesión cuando la creamos
      const sessionName = data.session || data.name || data.session_id
      console.log('✨ Nombre de sesión que vamos a usar:', sessionName)
      setSessionName(sessionName)
      setShouldPoll(true)
      await getQR()
    } catch (error) {
      console.error('❌ Error creando sesión:', error)
      setError('No se pudo crear la sesión de WhatsApp')
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo crear la sesión de WhatsApp"
      })
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
            router.push('/dashboard')
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
      console.log('💾 Iniciando actualización en PocketBase...')
      console.log('📝 Datos exactos a guardar:', {
        sessionId,
        userId,
        clientId
      })

      if (!userId) {
        throw new Error('No hay userId para actualizar')
      }

      await authPocketBase();

      // Primero buscamos el cliente existente
      console.log('🔍 Buscando cliente existente...')
      console.log('🔑 userId:', userId)
      
      const records = await pb.collection('clients').getList(1, 1, {
        filter: `clerk_id = "${userId}"`
      })
      
      console.log('📄 Resultado completo de la búsqueda:', {
        totalItems: records.totalItems,
        page: records.page,
        perPage: records.perPage,
        items: records.items,
        filter: `clerk_id = "${userId}"`
      })
      
      if (records.items.length > 0) {
        const client = records.items[0]
        console.log('✅ Cliente encontrado, actualizando:', client)
        setClientId(client.id)
        
        const updated = await pb.collection('clients').update(client.id, {
          session_id: sessionId,
          phone_client: 0,
          updated: new Date().toISOString()
        })
        console.log('✅ Cliente actualizado:', updated)
        return updated
      } else {
        console.error('❌ No se encontró el cliente para actualizar')
        throw new Error('No se encontró el cliente para actualizar')
      }
    } catch (error) {
      console.error('❌ Error actualizando PocketBase:', error)
      throw error
    }
  }

  const fetchClient = async () => {
    try {
      // Asegurarnos de estar autenticados antes de cualquier operación
      await authPocketBase();
      
      console.log('🔍 Buscando cliente directo por clerk_id:', userId);
      
      const records = await pb.collection('clients').getList(1, 1, {
        filter: `clerk_id = "${userId}"`
      });
      
      console.log('📄 Resultado de búsqueda:', {
        totalItems: records.totalItems,
        authStoreToken: pb.authStore.token ? 'Present' : 'Missing',
        authStoreIsValid: pb.authStore.isValid
      });
      
      if (records.items.length > 0) {
        const clientRecord = records.items[0];
        console.log('✅ Cliente encontrado:', clientRecord);
        setClientId(clientRecord.id);
        return clientRecord;
      } else {
        console.log('❌ Cliente no encontrado');
        return null;
      }
    } catch (error) {
      console.error('❌ Error en fetchClient:', error);
      // Verificar si es un error de autenticación
      if (error.status === 401 || error.status === 403) {
        console.log('🔄 Error de autenticación, reintentando...');
        await authPocketBase(); // Reintentar autenticación
      }
      throw error;
    }
  };

  useEffect(() => {
    if (isLoaded && userId) {
      findClient()
      
      // Fetch directo del cliente
      fetchClient();
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
