import PocketBase from 'pocketbase'

export const pb = new PocketBase('https://ai-agent-database.srv.clostech.tech')

export async function getOrCreateClient(userId: string, userData: { 
  first_name?: string, 
  last_name?: string, 
  username?: string 
}) {
  try {
    // Intentar obtener el cliente existente
    const client = await pb.collection('clients').getFirstListItem(`clerk_id="${userId}"`)
    return client
  } catch (error) {
    // Si el cliente no existe, crearlo
    if ((error as any)?.status === 404) {
      // Validar que tengamos los campos requeridos
      if (!userData.first_name || !userData.last_name) {
        throw new Error('first_name and last_name are required')
      }

      const data = {
        first_name: userData.first_name,
        last_name: userData.last_name,
        clerk_id: userId,
        username: userData.username || `user_${userId}`, // Usar un username predecible
        phone_client: null,
        session_id: ''
      }

      const newClient = await pb.collection('clients').create(data)
      return newClient
    }
    throw error
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