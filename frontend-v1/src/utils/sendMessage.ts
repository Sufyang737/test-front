export async function sendMessage(to: string, message: string, session: string = 'default') {
  const WAHA_API_URL = process.env.NEXT_PUBLIC_WAHA_API_URL;
  if (!WAHA_API_URL) {
    throw new Error('WAHA_API_URL not configured');
  }

  try {
    const response = await fetch(`${WAHA_API_URL}/api/${session}/messages/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chatId: `${to}@c.us`,
        text: message,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error sending message: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Message sent:', data);
    return data;

  } catch (error) {
    console.error('❌ Error sending message:', error);
    throw error;
  }
} 