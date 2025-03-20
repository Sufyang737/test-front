import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const WAHA_API_URL = process.env.NEXT_PUBLIC_WAHA_API_URL;

export async function POST(request: NextRequest) {
  try {
    if (!WAHA_API_URL) {
      throw new Error('WAHA_API_URL no está definida');
    }

    const body = await request.json();
    const { contactId, message } = body;

    if (!contactId || !message) {
      return NextResponse.json(
        { error: 'Se requiere contactId y message' },
        { status: 400 }
      );
    }

    const response = await fetch(`${WAHA_API_URL}/api/sendText`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chatId: contactId,
        text: message
      }),
    });

    if (!response.ok) {
      throw new Error(`Error al enviar mensaje: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error en /api/messages/send:', error);
    return NextResponse.json(
      { error: 'Error al enviar mensaje' },
      { status: 500 }
    );
  }
} 