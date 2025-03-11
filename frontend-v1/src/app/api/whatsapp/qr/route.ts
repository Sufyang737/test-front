import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'

const WAHA_API_URL = process.env.NEXT_PUBLIC_WAHA_API_URL

export async function GET() {
  try {
    const session = await auth()
    const user = await currentUser()
    
    if (!session?.userId || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Usar el username o email como nombre de sesión
    const sessionName = user.username || 
                       user.emailAddresses[0]?.emailAddress?.split('@')[0] || 
                       `user_${session.userId}`

    // Obtener el QR como PNG
    const qrResponse = await fetch(`${WAHA_API_URL}/api/${sessionName}/auth/qr`)
    if (!qrResponse.ok) {
      const error = await qrResponse.text()
      console.error('Failed to get QR:', error)
      return NextResponse.json({ error: 'Failed to get QR code' }, { status: 500 })
    }

    // Devolver la imagen directamente
    const headers = new Headers()
    headers.set('Content-Type', 'image/png')
    
    return new NextResponse(qrResponse.body, {
      status: 200,
      headers
    })

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 