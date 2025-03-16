import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getOrCreateClient } from '@/lib/utils/pocketbase';

export async function POST(req: Request) {
  try {
    console.log('📥 Iniciando webhook de Clerk...')
    
    // Get the headers
    const headersList = await headers();
    const svix_id = headersList.get("svix-id");
    const svix_timestamp = headersList.get("svix-timestamp");
    const svix_signature = headersList.get("svix-signature");

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
      console.error('❌ Error: Faltan headers de Svix', {
        svix_id,
        svix_timestamp,
        svix_signature
      });
      return new Response('Error: Faltan headers de Svix', {
        status: 400
      });
    }

    // Get the body
    const payload = await req.json();
    const body = JSON.stringify(payload);
    console.log('📦 Payload recibido:', payload);

    // Create a new Svix instance with your secret.
    const wh = new Webhook(process.env.WEBHOOK_SECRET || '');

    let evt: WebhookEvent;

    // Verify the payload with the headers
    try {
      evt = wh.verify(body, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature
      }) as WebhookEvent;
    } catch (err) {
      console.error('❌ Error verificando webhook:', err);
      return new Response('Error verificando webhook', {
        status: 400
      });
    }

    // Get the ID and type
    const { id } = evt.data;
    const eventType = evt.type;

    console.log(`🎯 Webhook recibido - ID: ${id}, Tipo: ${eventType}`);
    console.log('📄 Datos completos del evento:', evt.data);

    // Handle the event
    if (eventType === 'user.created' || eventType === 'user.updated') {
      try {
        const { id: userId, first_name, last_name, username, email_addresses } = evt.data;
        console.log('👤 Datos del usuario:', {
          userId,
          first_name,
          last_name,
          username,
          email: email_addresses?.[0]?.email_address
        });

        // Crear o actualizar el cliente en PocketBase
        console.log('🔄 Intentando crear/actualizar cliente en PocketBase...');
        const client = await getOrCreateClient(userId, {
          first_name: first_name || undefined,
          last_name: last_name || undefined,
          username: username || email_addresses?.[0]?.email_address || undefined
        });

        if (client) {
          console.log('✅ Cliente creado/actualizado exitosamente:', client);
          return NextResponse.json({
            success: true,
            message: 'Cliente creado/actualizado exitosamente',
            client
          });
        } else {
          console.error('❌ Error: No se pudo crear/actualizar el cliente');
          return NextResponse.json({
            success: false,
            message: 'No se pudo crear/actualizar el cliente'
          }, { status: 500 });
        }

      } catch (error) {
        console.error('❌ Error procesando webhook:', error);
        console.error('Stack trace:', (error as Error).stack);
        return NextResponse.json({
          success: false,
          message: 'Error procesando webhook',
          error: error instanceof Error ? error.message : 'Error desconocido'
        }, { status: 500 });
      }
    }

    console.log('✅ Webhook procesado exitosamente');
    return NextResponse.json({
      success: true,
      message: 'Webhook procesado exitosamente'
    });

  } catch (error) {
    console.error('❌ Error general procesando webhook:', error);
    console.error('Stack trace:', (error as Error).stack);
    return NextResponse.json({
      success: false,
      message: 'Error general procesando webhook',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
} 