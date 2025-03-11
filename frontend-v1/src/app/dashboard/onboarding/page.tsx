import { redirect } from 'next/navigation'
import { auth, currentUser } from '@clerk/nextjs/server'
import { Button } from '@/components/ui/button'
import { WhatsAppQR } from '@/components/whatsapp/qr-code'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2, ArrowRight } from 'lucide-react'
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

  // Get session name from user data
  const sessionName = user.username || 
                     user.emailAddresses[0]?.emailAddress?.split('@')[0] || 
                     `user_${userId}`

  // Check WAHA session status and update PocketBase if working
  let isWorking = false
  try {
    const sessionResponse = await fetch(`${WAHA_API_URL}/api/sessions/${sessionName}`)
    const sessionData = await sessionResponse.json()
    
    isWorking = sessionData.engine?.state === 'CONNECTED' || sessionData.status === 'WORKING'

    if (isWorking) {
      // Find client record
      const records = await pb.collection('clients').getList(1, 1, {
        filter: `clerk_id = "${userId}"`
      })

      if (records.items.length > 0) {
        const client = records.items[0]
        // Update client with session name
        await pb.collection('clients').update(client.id, {
          session_id: sessionName
        })
      }
    }
  } catch (error) {
    console.error('Error checking WAHA status or updating PocketBase:', error)
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center space-y-8">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                WhatsApp Setup
              </h1>
              <p className="text-muted-foreground">
                Conecta tu WhatsApp para comenzar a usar el dashboard
              </p>
            </div>

            {isWorking ? (
              <div className="flex flex-col items-center justify-center space-y-6 w-full max-w-md mx-auto p-6 rounded-lg bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950/30 dark:to-blue-950/30">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30">
                  <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-center space-y-2">
                  <h2 className="text-xl font-semibold text-green-600 dark:text-green-400">
                    ¡WhatsApp Conectado!
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Tu WhatsApp está listo para usar. Puedes acceder al dashboard para comenzar.
                  </p>
                </div>
                <Button className="w-full max-w-xs group" asChild>
                  <a href="/dashboard" className="flex items-center justify-center gap-2">
                    Ir al Dashboard
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </a>
                </Button>
              </div>
            ) : (
              <div className="w-full max-w-md">
                <WhatsAppQR />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 