import { NextResponse } from 'next/server';
import PocketBase from 'pocketbase';
import { headers } from 'next/headers';

const WAHA_API_URL = process.env.NEXT_PUBLIC_WAHA_API_URL;
const POCKETBASE_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://ai-agent-database.srv.clostech.tech';
const POCKETBASE_ADMIN_TOKEN = process.env.NEXT_PUBLIC_POCKETBASE_ADMIN_TOKEN;

export async function POST(request: Request) {
  console.log('🔍 Iniciando envío de mensaje...');
  console.log('📡 URL de WAHA:', WAHA_API_URL);
  
  try {
    if (!POCKETBASE_ADMIN_TOKEN) {
      console.error('❌ POCKETBASE_ADMIN_TOKEN no está definido');
      throw new Error('POCKETBASE_ADMIN_TOKEN no está definido');
    }

    // Obtener el clerk_id del header
    const headersList = await headers();
    const clerk_id = await headersList.get('x-clerk-user-id');
    console.log('👤 Clerk ID del usuario:', clerk_id);

    if (!clerk_id) {
      console.error('❌ No se encontró el clerk_id en los headers');
      throw new Error('No se encontró el clerk_id en los headers');
    }

    // Obtener datos del cuerpo de la petición
    const body = await request.json();
    const { contactId, message } = body;
    console.log('📨 Enviando mensaje a:', contactId);
    console.log('💬 Mensaje:', message);

    if (!contactId || !message) {
      throw new Error('Faltan datos requeridos (contactId o message)');
    }

    // Asegurarse de que el contactId tenga el formato correcto
    const formattedChatId = contactId.includes('@') ? contactId : `${contactId}@c.us`;
    console.log('📱 ChatId formateado:', formattedChatId);

    // 1. Obtener el cliente desde PocketBase usando el clerk_id
    console.log('🔄 Conectando a PocketBase...');
    const pb = new PocketBase(POCKETBASE_URL);
    
    // Autenticar con el token de admin
    pb.authStore.save(POCKETBASE_ADMIN_TOKEN);
    console.log('🔐 Autenticado con token de admin');
    
    try {
      const client = await pb.collection('clients').getFirstListItem(`clerk_id = "${clerk_id}"`, {
        fields: 'id,session_id'
      });

      console.log('📦 Cliente encontrado:', client);

      if (!client?.session_id) {
        console.error('❌ El cliente no tiene session_id');
        throw new Error('El cliente no tiene session_id configurado');
      }

      // 2. Enviar el mensaje usando la API de WAHA
      const url = `${WAHA_API_URL}/api/sendText`;
      console.log('📡 Haciendo petición a WAHA:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId: formattedChatId,
          text: message,
          session: client.session_id,
          linkPreview: true
        }),
      });

      console.log('📥 Estado de la respuesta de WAHA:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Error detallado de WAHA:', errorData);
        throw new Error(`Error al enviar mensaje: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Mensaje enviado:', data);
      
      return NextResponse.json(data);
    } finally {
      // Limpiar la autenticación después de usarla
      pb.authStore.clear();
    }
  } catch (error) {
    console.error('❌ Error en /api/messages/send:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace available');
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al enviar mensaje' },
      { status: 500 }
    );
  }
} 