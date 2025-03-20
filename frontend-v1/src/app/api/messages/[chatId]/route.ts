import { NextResponse } from 'next/server';
import PocketBase from 'pocketbase';
import { headers } from 'next/headers';

const WAHA_API_URL = process.env.NEXT_PUBLIC_WAHA_API_URL;
const POCKETBASE_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://ai-agent-database.srv.clostech.tech';
const POCKETBASE_ADMIN_TOKEN = process.env.NEXT_PUBLIC_POCKETBASE_ADMIN_TOKEN;

export async function GET(request: Request, { params }: { params: { chatId: string } }) {
  console.log('🔍 Iniciando obtención de mensajes...');
  console.log('📡 URL de WAHA:', WAHA_API_URL);
  console.log('📡 URL de PocketBase:', POCKETBASE_URL);
  
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

      const { chatId } = params;
      console.log('💬 Chat ID:', chatId);

      // 2. Hacer la petición a WAHA con el session_id y chatId correctos
      const url = `${WAHA_API_URL}/api/${client.session_id}/chats/${chatId}/messages`;
      console.log('📡 Haciendo petición a WAHA:', url);
      
      const response = await fetch(url);
      console.log('📥 Estado de la respuesta de WAHA:', response.status, response.statusText);
      
      if (!response.ok) {
        console.error('❌ Error en la respuesta de WAHA:', response.status, response.statusText);
        throw new Error(`Error al obtener mensajes: ${response.statusText}`);
      }

      const rawData = await response.json();
      console.log('📦 Datos crudos recibidos de WAHA:', JSON.stringify(rawData, null, 2));

      // Verificar si rawData es un array
      if (!Array.isArray(rawData)) {
        console.error('❌ Los datos recibidos no son un array:', typeof rawData);
        console.error('Datos recibidos:', rawData);
        return NextResponse.json({ error: 'Formato de datos inválido' }, { status: 500 });
      }
      
      // Transformar los datos al formato que espera nuestro frontend
      const messages = rawData.map((message: any) => ({
        id: message.id,
        body: message.body,
        fromMe: message.fromMe,
        timestamp: message.timestamp
      }));

      console.log('✅ Mensajes procesados:', messages.length);
      return NextResponse.json(messages);
    } finally {
      // Limpiar la autenticación después de usarla
      pb.authStore.clear();
    }
  } catch (error) {
    console.error('❌ Error en /api/messages/[chatId]:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace available');
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al obtener mensajes' },
      { status: 500 }
    );
  }
} 