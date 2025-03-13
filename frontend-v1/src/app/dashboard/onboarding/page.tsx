import { redirect } from 'next/navigation'
import { auth, currentUser } from '@clerk/nextjs/server'
import { Button } from '@/components/ui/button'
import { WhatsAppQR } from '@/components/whatsapp/qr-code'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2, ArrowRight, Smartphone } from 'lucide-react'
import PocketBase from 'pocketbase'

const WAHA_API_URL = process.env.NEXT_PUBLIC_WAHA_API_URL
const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL)

export default async function OnboardingPage() {
  const session = await auth()
  const user = await currentUser()
  const userId = session?.userId

  if (!userId || !user) {
    redirect('/sign-in')
  }

  const sessionName = user.username || 
                     user.emailAddresses[0]?.emailAddress?.split('@')[0] || 
                     `user_${userId}`

  let isWorking = false
  try {
    const sessionResponse = await fetch(`${WAHA_API_URL}/api/sessions/${sessionName}`)
    const sessionData = await sessionResponse.json()
    
    isWorking = sessionData.engine?.state === 'CONNECTED' || sessionData.status === 'WORKING'

    if (isWorking) {
      const records = await pb.collection('clients').getList(1, 1, {
        filter: `clerk_id = "${userId}"`
      })

      if (records.items.length > 0) {
        const client = records.items[0]
        await pb.collection('clients').update(client.id, {
          session_id: sessionName
        })
      }
    }
  } catch (error) {
    console.error('Error checking WAHA status or updating PocketBase:', error)
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-xl border-0 bg-black/20">
        <CardContent className="p-8">
          <div className="flex flex-col items-center space-y-8">
            <div className="flex flex-col items-center space-y-2 text-center">
              <div className="rounded-full bg-white/10 p-3">
                <Smartphone className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white">Conecta tu WhatsApp</h1>
              <p className="text-gray-300 max-w-md">
                Escanea el código QR con tu WhatsApp para comenzar a usar todas las funcionalidades
              </p>
            </div>

            {isWorking ? (
              <div className="w-full space-y-6">
                <div className="flex flex-col items-center space-y-4">
                  <div className="rounded-full bg-green-500/20 p-3">
                    <CheckCircle2 className="h-8 w-8 text-green-400" />
                  </div>
                  <div className="text-center">
                    <h2 className="text-xl font-semibold text-green-400">
                      ¡WhatsApp Conectado!
                    </h2>
                    <p className="mt-1 text-sm text-gray-300">
                      Todo está listo para comenzar
                    </p>
                  </div>
                </div>
                <Button 
                  className="w-full bg-white text-black hover:bg-white/90" 
                  size="lg" 
                  asChild
                >
                  <a href="/dashboard" className="flex items-center justify-center gap-2">
                    Ir al Dashboard
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            ) : (
              <div className="w-full space-y-6">
                <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                  <WhatsAppQR />
                </div>
                <div className="text-sm text-gray-300">
                  <ol className="list-decimal space-y-2 pl-4">
                    <li>Abre WhatsApp en tu teléfono</li>
                    <li>Toca Menú o Configuración y selecciona WhatsApp Web</li>
                    <li>Apunta tu teléfono hacia esta pantalla para escanear el código QR</li>
                  </ol>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 