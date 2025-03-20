import { NextResponse } from 'next/server';

const WAHA_API_URL = process.env.NEXT_PUBLIC_WAHA_API_URL;
const WEBHOOK_URL = process.env.NEXT_PUBLIC_APP_URL + '/api/webhooks/waha';

export async function POST(request: Request) {
  console.log('🔧 Configurando webhook de WAHA...');
  
  try {
    if (!WAHA_API_URL) {
      throw new Error('WAHA_API_URL no está definida');
    }

    if (!WEBHOOK_URL) {
      throw new Error('WEBHOOK_URL no está definida');
    }

    console.log('📡 URL de WAHA:', WAHA_API_URL);
    console.log('🎯 URL del Webhook:', WEBHOOK_URL);

    // Configurar el webhook en WAHA
    const response = await fetch(`${WAHA_API_URL}/api/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: WEBHOOK_URL,
        events: [
          'message',
          'message.ack',
          'message.reaction',
          'presence.update'
        ]
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Error al configurar webhook:', errorData);
      throw new Error(`Error al configurar webhook: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Webhook configurado:', data);

    return NextResponse.json({ status: 'ok', data });
  } catch (error) {
    console.error('❌ Error en setup webhook:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error configurando webhook' },
      { status: 500 }
    );
  }
} 