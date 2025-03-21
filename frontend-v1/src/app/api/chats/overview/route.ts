import { NextResponse } from 'next/server';

const WAHA_API_URL = process.env.NEXT_PUBLIC_WAHA_API_URL;

if (!WAHA_API_URL) {
  throw new Error('WAHA_API_URL no está definida');
}

export async function GET() {
  try {
    const wahaUrl = `${WAHA_API_URL}/api/laconchadetumadre/chats/overview?limit=20`;
    console.log('📍 Obteniendo resumen de chats:', wahaUrl);

    const response = await fetch(wahaUrl);
    if (!response.ok) {
      throw new Error(`Error al obtener chats: ${response.status} ${response.statusText}`);
    }

    const chats = await response.json();
    console.log(`✅ Chats obtenidos: ${chats.length}`);

    // Formatear los chats para el frontend
    const formattedChats = chats.map((chat: any) => ({
      id: chat.id.split('@')[0], // Removemos el @g.us o @c.us
      name: chat.name || chat.id.split('@')[0],
      picture: chat.picture || null,
      lastMessage: chat.lastMessage ? {
        body: chat.lastMessage.body,
        timestamp: chat.lastMessage.timestamp * 1000, // Convertir a milisegundos
        fromMe: chat.lastMessage.fromMe,
        hasMedia: chat.lastMessage.hasMedia,
        from: chat.lastMessage.participant || chat.lastMessage.from
      } : null
    }));

    return NextResponse.json({
      status: 'ok',
      chats: formattedChats
    });

  } catch (error) {
    console.error('❌ Error obteniendo chats:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Error obteniendo chats'
      },
      { status: 500 }
    );
  }
} 