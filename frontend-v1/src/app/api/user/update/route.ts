import { auth } from '@clerk/nextjs';
import { NextResponse } from 'next/server';
import PocketBase from 'pocketbase';

// Initialize PocketBase with admin token
const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
pb.authStore.save(process.env.POCKETBASE_TOKEN_ADMIN || '');

export async function POST(req: Request) {
  try {
    console.log('📝 Iniciando actualización de perfil...');
    
    // Get the current user from Clerk
    const { userId } = auth();
    if (!userId) {
      console.error('❌ Error: Usuario no autenticado');
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Get the update data from the request
    const formData = await req.formData();
    const data: Record<string, any> = {};
    
    // Extract text fields
    ['first_name', 'last_name', 'username', 'phone_client'].forEach(field => {
      const value = formData.get(field);
      if (value) data[field] = value;
    });

    // Handle avatar file
    const avatarFile = formData.get('avatar') as File | null;
    
    try {
      // Primero buscar el registro existente por clerk_id
      const existingRecord = await pb.collection('clients').getFirstListItem(`clerk_id = "${userId}"`);
      
      if (!existingRecord) {
        console.error('❌ Error: Cliente no encontrado en PocketBase');
        return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
      }

      // Prepare update data - only include fields that are provided
      const updateData: Record<string, any> = {};
      if (data.first_name) updateData.first_name = data.first_name;
      if (data.last_name) updateData.last_name = data.last_name;
      if (data.username) updateData.username = data.username;
      if (data.phone_client) updateData.phone_client = data.phone_client;

      console.log('🔄 Actualizando cliente en PocketBase...', {
        id: existingRecord.id,
        updateData
      });

      // Update using the PocketBase ID, not the clerk_id
      const updatedRecord = await pb.collection('clients').update(existingRecord.id, updateData);
      console.log('✅ Cliente actualizado en PocketBase:', updatedRecord);

      // If there's an avatar file, update it in Clerk
      if (avatarFile) {
        console.log('🖼️ Actualizando avatar en Clerk...');
        
        // Convert File to Blob for Clerk's API
        const blob = new Blob([avatarFile], { type: avatarFile.type });

        // Update the user's avatar
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_CLERK_FRONTEND_API}/users/${userId}/profile_image`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
            },
            body: blob
          });

          if (!response.ok) {
            throw new Error('Failed to update avatar');
          }

          console.log('✅ Avatar actualizado en Clerk');
        } catch (error) {
          console.error('Error updating avatar:', error);
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Perfil actualizado correctamente',
        client: updatedRecord
      });

    } catch (error) {
      console.error('❌ Error actualizando cliente:', error);
      if (!pb.authStore.isValid) {
        return NextResponse.json({
          success: false,
          message: 'Error de autenticación con PocketBase: Token de admin inválido',
          error: 'Invalid admin token'
        }, { status: 401 });
      }
      return NextResponse.json({
        success: false,
        message: 'Error actualizando cliente',
        error: error instanceof Error ? error.message : 'Error desconocido'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Error general:', error);
    return NextResponse.json({
      success: false,
      message: 'Error general actualizando perfil',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
} 