import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getOrCreateClient } from '@/lib/utils/pocketbase';

export async function POST(req: Request) {
  try {
    // Get the headers
    const headersList = await headers();
    const svix_id = headersList.get("svix-id");
    const svix_timestamp = headersList.get("svix-timestamp");
    const svix_signature = headersList.get("svix-signature");

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
      console.error('Missing svix headers');
      return new Response('Error occured -- no svix headers', {
        status: 400
      });
    }

    // Get the body
    const payload = await req.json();
    const body = JSON.stringify(payload);

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
      console.error('Error verifying webhook:', err);
      return new Response('Error occured', {
        status: 400
      });
    }

    // Get the ID and type
    const { id } = evt.data;
    const eventType = evt.type;

    console.log(`Webhook with ID: ${id} and type: ${eventType}`);

    // Handle the event
    if (eventType === 'user.created' || eventType === 'user.updated') {
      try {
        const { id: userId, first_name, last_name, username } = evt.data;

        // Crear o actualizar el cliente en PocketBase
        const client = await getOrCreateClient(userId, {
          first_name: first_name || undefined,
          last_name: last_name || undefined,
          username: username || undefined
        });

        if (client) {
          console.log('Client created/updated successfully:', client);
          return NextResponse.json({
            success: true,
            message: 'Client created/updated successfully',
            client
          });
        } else {
          console.error('Failed to create/update client');
          return NextResponse.json({
            success: false,
            message: 'Failed to create/update client'
          }, { status: 500 });
        }

      } catch (error) {
        console.error('Error processing webhook:', error);
        return NextResponse.json({
          success: false,
          message: 'Error processing webhook'
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully'
    });

  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({
      success: false,
      message: 'Error processing webhook'
    }, { status: 500 });
  }
} 