import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import PocketBase from 'pocketbase';

const WAHA_API_URL = process.env.NEXT_PUBLIC_WAHA_API_URL;
const POCKETBASE_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://ai-agent-database.srv.clostech.tech';
const POCKETBASE_ADMIN_TOKEN = process.env.NEXT_PUBLIC_POCKETBASE_ADMIN_TOKEN;
const MESSAGES_PER_PAGE = 20;

export async function GET(
  request: Request,
  { params }: { params: { chatId: string } }
) {
  console.log('🔍 Iniciando obtención de mensajes...');
  
  try {
    if (!POCKETBASE_ADMIN_TOKEN) {
      throw new Error('POCKETBASE_ADMIN_TOKEN no está definido');
    }

    // Obtener el clerk_id del header
    const headersList = await headers();
    const clerk_id = await headersList.get('x-clerk-user-id');
    
    if (!clerk_id) {
      throw new Error('No se encontró el clerk_id en los headers');
    }

    // Obtener el número de página de la URL
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    console.log('📄 Página solicitada:', page);

    // Conectar a PocketBase
    const pb = new PocketBase(POCKETBASE_URL);
    pb.authStore.save(POCKETBASE_ADMIN_TOKEN);
    
    try {
      // Obtener el cliente
      const client = await pb.collection('clients').getFirstListItem(`clerk_id = "${clerk_id}"`, {
        fields: 'id,session_id'
      });

      if (!client?.session_id) {
        throw new Error('El cliente no tiene session_id configurado');
      }

      // Obtener mensajes de WAHA usando el endpoint correcto
      const wahaUrl = new URL(`${WAHA_API_URL}/api/messages`);
      wahaUrl.searchParams.append('chatId', params.chatId);
      wahaUrl.searchParams.append('session', client.session_id);
      wahaUrl.searchParams.append('limit', MESSAGES_PER_PAGE.toString());
      wahaUrl.searchParams.append('page', page.toString());
      
      console.log('📡 Haciendo petición a WAHA:', wahaUrl.toString());
      
      const response = await fetch(wahaUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error detallado:', errorText);
        throw new Error(`Error al obtener mensajes: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📦 Respuesta de WAHA:', data);
      
      // Transformar mensajes al formato necesario
      const messages = (Array.isArray(data) ? data : data.messages || []).map((msg: any) => ({
        id: msg.id,
        body: msg.body || msg.text || '',
        timestamp: msg.timestamp || Date.now(),
        fromMe: msg.fromMe || false
      }));

      return NextResponse.json({
        messages,
        hasMore: data.hasMore || false,
        total: data.total || messages.length
      });
    } finally {
      pb.authStore.clear();
    }
  } catch (error) {
    console.error('❌ Error al obtener mensajes:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al obtener mensajes' },
      { status: 500 }
    );
  }
} 