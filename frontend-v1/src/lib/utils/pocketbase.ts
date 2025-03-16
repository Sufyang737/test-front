import PocketBase from 'pocketbase'

export const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL)

export async function getOrCreateClient(userId: string, userData: { 
  first_name?: string, 
  last_name?: string, 
  username?: string 
}) {
  try {
    console.log('🔍 Buscando cliente existente con clerk_id:', userId);
    console.log('📄 Datos de usuario recibidos:', userData);

    // Intentar obtener el cliente existente
    try {
      const client = await pb.collection('clients').getFirstListItem(`clerk_id="${userId}"`)
      console.log('✅ Cliente existente encontrado:', client);
      return client;
    } catch (error) {
      if ((error as any)?.status !== 404) {
        console.error('❌ Error inesperado buscando cliente:', error);
        throw error;
      }
      console.log('ℹ️ Cliente no encontrado, procediendo a crear uno nuevo');
    }

    // Si el cliente no existe, crearlo
    // Usar valores por defecto si no se proporcionan first_name y last_name
    const data = {
      first_name: userData.first_name || 'User',
      last_name: userData.last_name || userId.slice(0, 8),
      clerk_id: userId,
      username: userData.username || `user_${userId}`,
      phone_client: null,
      session_id: ''
    }

    console.log('📝 Creando nuevo cliente con datos:', data);
    const newClient = await pb.collection('clients').create(data)
    console.log('✅ Nuevo cliente creado:', newClient);
    return newClient;
  } catch (error) {
    console.error('❌ Error en getOrCreateClient:', error);
    throw error;
  }
}

export async function getCompanyProfile(clerkId: string) {
    console.log('🔍 Starting getCompanyProfile with clerkId:', clerkId);
    
    try {
        // Primero obtener el cliente por clerk_id
        console.log('👤 Buscando cliente con clerk_id:', clerkId);
        const client = await pb.collection('clients').getFirstListItem(`clerk_id="${clerkId}"`);
        console.log('✅ Cliente encontrado:', JSON.stringify(client, null, 2));

        if (!client) {
            console.log('❌ No se encontró cliente');
            return null;
        }

        // Luego obtener el perfil de la empresa usando el ID del cliente
        console.log('🏢 Buscando perfil de empresa para client_id:', client.id);
        const profile = await pb.collection('client_profile').getFirstListItem(
            `client_id="${client.id}"`,
            {
                expand: 'client_id',
                fields: 'id,client_id,name_company,description,instagram,facebook,website,x,opening_hours'
            }
        );
        console.log('✅ Perfil encontrado:', JSON.stringify(profile, null, 2));

        const result = {
            profile,
            client
        };
        console.log('🎉 Resultado final:', JSON.stringify(result, null, 2));

        return result;
    } catch (error: any) {
        console.error('❌ Error en getCompanyProfile:', {
            status: error.status,
            message: error.message,
            data: error.data
        });
        if (error.status === 404) {
            return null;
        }
        throw error;
    }
} 