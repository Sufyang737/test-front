import PocketBase from 'pocketbase';

export const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);

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

// Function to get client record by clerk_id
async function getClientByClerkId(clerkId: string) {
    try {
        const records = await pb.collection('clients').getList(1, 1, {
            filter: `clerk_id = "${clerkId}"`,
        });

        if (records.items.length > 0) {
            return records.items[0];
        }
        return null;
    } catch (error) {
        console.error('Error getting client:', error);
        return null;
    }
}

export const getBusinessProfile = async (clerkId: string) => {
    try {
        const client = await getClientByClerkId(clerkId);
        if (!client) return null;

        const records = await pb.collection('client_profile').getList(1, 1, {
            filter: `client_id = "${client.id}"`,
        });

        return records.items.length > 0 ? records.items[0] : null;
    } catch (error) {
        console.error('Error getting business profile:', error);
        return null;
    }
}

export const createBusinessProfile = async (data: BusinessProfileData) => {
    try {
        console.log('Creating business profile with data:', JSON.stringify(data, null, 2));

        // Get the client record using clerk_id
        const client = await getClientByClerkId(data.client_id);
        
        if (!client) {
            throw new Error('Cliente no encontrado. Por favor, crea un perfil de cliente primero.');
        }

        // Ensure URLs are properly formatted and handle empty strings
        const formattedData = {
            ...data,
            client_id: client.id, // Use the PocketBase client ID instead of clerk_id
            instagram: data.instagram && data.instagram !== "" ? ensureHttps(data.instagram) : null,
            facebook: data.facebook && data.facebook !== "" ? ensureHttps(data.facebook) : null,
            website: data.website && data.website !== "" ? ensureHttps(data.website) : null,
            x: data.x && data.x !== "" ? ensureHttps(data.x) : null,
        };

        console.log('Formatted data:', JSON.stringify(formattedData, null, 2));

        // Validate required fields
        if (!formattedData.client_id) {
            throw new Error('client_id is required');
        }
        if (!formattedData.name_company) {
            throw new Error('name_company is required');
        }
        if (!formattedData.description) {
            throw new Error('description is required');
        }

        const record = await pb.collection('client_profile').create(formattedData);
        console.log('Created record:', JSON.stringify(record, null, 2));
        
        return { success: true, data: record };
    } catch (error: any) {
        console.error('Detailed error creating business profile:', {
            message: error.message,
            data: error.data ? JSON.stringify(error.data, null, 2) : undefined,
            status: error.status,
            response: error.response ? JSON.stringify(error.response, null, 2) : undefined
        });

        let errorMessage = error.message || 'Error al crear el perfil';
        if (error.data) {
            // Extract specific field errors if they exist
            const fieldErrors = Object.entries(error.data)
                .map(([field, message]) => `${field}: ${message}`)
                .join(', ');
            errorMessage = fieldErrors || error.message;
        }

        return { 
            success: false, 
            error: errorMessage,
            details: error.data || error.message 
        };
    }
}

// Helper function to ensure URLs have https://
function ensureHttps(url: string): string {
    if (!url) return url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return `https://${url}`;
    }
    return url;
} 