import PocketBase from 'pocketbase';

const POCKETBASE_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';
const ADMIN_TOKEN = process.env.NEXT_PUBLIC_POCKETBASE_ADMIN_TOKEN;

// Singleton instance
const pb = new PocketBase(POCKETBASE_URL);

export function getPocketBase() {
  return pb;
}

// Función auxiliar para autenticar como admin
async function authenticateAsAdmin() {
  if (!ADMIN_TOKEN) {
    console.error('❌ Token de admin no configurado en las variables de entorno');
    throw new Error('Token de admin no configurado');
  }

  try {
    console.log('🔐 Intentando autenticar con token de admin...');
    pb.authStore.clear();
    pb.authStore.save(ADMIN_TOKEN, null);
    
    if (!pb.authStore.isValid) {
      console.error('❌ Token de admin inválido');
      throw new Error('Token de admin inválido');
    }
    
    console.log('✅ Autenticación con token de admin exitosa');
    return true;
  } catch (error) {
    console.error('❌ Error en autenticación con token de admin:', error);
    pb.authStore.clear();
    throw error;
  }
}

// Función auxiliar para ejecutar operaciones con autenticación de admin
async function withAdminAuth<T>(operation: (pb: PocketBase) => Promise<T>): Promise<T> {
  try {
    await authenticateAsAdmin();
    return await operation(pb);
  } finally {
    pb.authStore.clear();
  }
}

export async function authPocketBase(token: string) {
  try {
    console.log('🔐 Iniciando autenticación con PocketBase...');
    
    if (!token) {
      throw new Error('Token no proporcionado para autenticación');
    }

    pb.authStore.clear();
    pb.authStore.save(token, null);
    
    if (!pb.authStore.isValid) {
      throw new Error('La autenticación con PocketBase no es válida después de guardar el token');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error en authPocketBase:', error);
    pb.authStore.clear();
    throw error;
  }
}

export async function getClientByClerkId(clerkId: string) {
  try {
    console.log('🔍 Buscando cliente con clerk_id:', clerkId);
    
    // Primero intentar con la autenticación actual
    if (pb.authStore.isValid) {
      try {
        console.log('🔄 Intentando buscar con autenticación actual...');
        const records = await pb.collection('clients').getList(1, 1, {
          filter: `clerk_id = "${clerkId}"`,
          sort: '-created'
        });
        
        if (records.totalItems > 0) {
          console.log('✅ Cliente encontrado con auth actual:', records.items[0]);
          return records.items[0];
        }
      } catch (error) {
        console.log('⚠️ No se pudo obtener con auth actual, intentando con admin...');
      }
    }

    // Si no funciona con la auth actual, intentar con admin
    return await withAdminAuth(async () => {
      console.log('🔄 Buscando cliente con autenticación de admin...');
      const records = await pb.collection('clients').getList(1, 1, {
        filter: `clerk_id = "${clerkId}"`,
        sort: '-created'
      });
      
      if (records.totalItems === 0) {
        console.log('❌ No se encontró ningún cliente con clerk_id:', clerkId);
        return null;
      }

      console.log('✅ Cliente encontrado con admin auth:', records.items[0]);
      return records.items[0];
    });
  } catch (error) {
    console.error('❌ Error buscando cliente por clerk_id:', error);
    throw error;
  }
}

export async function getAllClients() {
  return withAdminAuth(async () => {
    try {
      console.log('📊 Obteniendo todos los clientes como admin...');
      const records = await pb.collection('clients').getFullList({
        sort: '-created'
      });
      
      console.log('📋 Total de clientes:', records.length);
      return records;
    } catch (error) {
      console.error('❌ Error obteniendo todos los clientes:', error);
      return [];
    }
  });
}

export async function createClient(data: any) {
  return withAdminAuth(async () => {
    try {
      return await pb.collection('clients').create(data);
    } catch (error) {
      console.error('Error creating client:', error);
      throw error;
    }
  });
}

export async function updateClient(id: string, data: any) {
  return withAdminAuth(async () => {
    try {
      console.log('🔄 Actualizando cliente con ID:', id);
      console.log('📝 Datos a actualizar:', data);
      
      const record = await pb.collection('clients').update(id, data);
      console.log('✅ Cliente actualizado exitosamente:', record);
      return record;
    } catch (error) {
      console.error('❌ Error actualizando cliente:', error);
      throw error;
    }
  });
}

interface BusinessProfileData {
  client_id: string;
  name_company: string;
  description: string;
  instagram?: string;
  facebook?: string;
  website?: string;
  x?: string;
  opening_hours: string;
}

export const getBusinessProfile = async (clerkId: string) => {
  return withAdminAuth(async () => {
    try {
      console.log('🔍 Buscando perfil de empresa para clerk_id:', clerkId);
      
      // Primero obtener el client_id usando el clerk_id
      const client = await getClientByClerkId(clerkId);
      if (!client) {
        console.log('❌ No se encontró el cliente para clerk_id:', clerkId);
        throw new Error('Cliente no encontrado');
      }

      console.log('✅ Cliente encontrado:', client.id);

      // Buscar el perfil usando el client_id
      const records = await pb.collection('client_profile').getList(1, 1, {
        filter: `client_id = "${client.id}"`,
      });

      if (records.items.length === 0) {
        console.log('ℹ️ No se encontró perfil de empresa para el cliente');
        return null;
      }

      console.log('✅ Perfil de empresa encontrado:', records.items[0]);
      return records.items[0];
    } catch (error) {
      console.error('❌ Error obteniendo perfil de empresa:', error);
      throw new Error('Error al obtener el perfil de empresa');
    }
  });
}

export const createOrUpdateBusinessProfile = async (clerkId: string, data: Omit<BusinessProfileData, 'client_id'>) => {
  return withAdminAuth(async () => {
    try {
      console.log('🔄 Creando/actualizando perfil de empresa para clerk_id:', clerkId);
      
      // Obtener el client_id usando el clerk_id
      const client = await getClientByClerkId(clerkId);
      if (!client) {
        console.error('❌ Cliente no encontrado para clerk_id:', clerkId);
        throw new Error('Cliente no encontrado');
      }

      // Verificar si ya existe un perfil
      const existingProfile = await pb.collection('client_profile').getList(1, 1, {
        filter: `client_id = "${client.id}"`,
      });

      // Preparar los datos con el formato correcto
      const formattedData = {
        client_id: client.id,
        name_company: data.name_company,
        description: data.description,
        opening_hours: data.opening_hours,
        instagram: data.instagram && data.instagram !== "" ? ensureHttps(data.instagram) : "",
        facebook: data.facebook && data.facebook !== "" ? ensureHttps(data.facebook) : "",
        website: data.website && data.website !== "" ? ensureHttps(data.website) : "",
        x: data.x && data.x !== "" ? ensureHttps(data.x) : "",
      };

      let record;
      if (existingProfile.items.length > 0) {
        // Actualizar perfil existente
        console.log('🔄 Actualizando perfil existente');
        record = await pb.collection('client_profile').update(
          existingProfile.items[0].id, 
          formattedData
        );
        console.log('✅ Perfil actualizado:', record);
      } else {
        // Crear nuevo perfil
        console.log('✨ Creando nuevo perfil');
        record = await pb.collection('client_profile').create(formattedData);
        console.log('✅ Perfil creado:', record);
      }

      return { success: true, data: record };
    } catch (error) {
      console.error('❌ Error en createOrUpdateBusinessProfile:', error);
      throw error;
    }
  });
}

function ensureHttps(url: string): string {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  return url;
}

export { pb } 