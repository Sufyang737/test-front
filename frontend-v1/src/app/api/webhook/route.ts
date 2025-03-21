import { NextResponse } from 'next/server';
import { sendMessage } from '@/utils/sendMessage';

// Verification token - should match what you set in WAHA
const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN || 'your_verify_token';

interface WhatsAppMessage {
  id: string;
  from: string;
  to: string;
  body: string;
  fromMe: boolean;
  hasMedia: boolean;
  timestamp: number;
  _data?: {
    notifyName?: string;
  };
}

// Helper function to log requests
function logRequest(method: string, url: string, body: any) {
  console.log(`\n🔍 Request Details:`);
  console.log(`Method: ${method}`);
  console.log(`URL: ${url}`);
  console.log(`Body:`, body);
}

// GET handler for webhook verification
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  
  console.log('\n🔐 Webhook Verification Request');
  console.log('Query params:', Object.fromEntries(searchParams.entries()));

  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Webhook verified successfully');
    return new Response(challenge, { status: 200 });
  }

  console.log('❌ Webhook verification failed');
  return new Response('Verification failed', { status: 403 });
}

// POST handler for incoming messages
export async function POST(req: Request) {
  console.log('\n📥 Incoming Webhook Request');
  
  try {
    const rawBody = await req.text();
    logRequest('POST', req.url, rawBody);

    const data = JSON.parse(rawBody);
    console.log('\n📦 Parsed Webhook Data:', JSON.stringify(data, null, 2));

    // Handle messages
    if (data.messages && Array.isArray(data.messages)) {
      for (const message of data.messages) {
        console.log('\n📋 Processing Message:', message);
        
        // Remove @c.us or any other domain from the number
        const cleanNumber = message.from.split('@')[0];
        const messageBody = message.body;

        // Handle media messages
        if (message.hasMedia) {
          console.log('📎 Media message detected');
          await sendMessage(cleanNumber, 'Disculpa, no puedo procesar mensajes multimedia.', 'laconchadetumadre');
          continue;
        }

        // Handle empty messages
        if (!messageBody?.trim()) {
          console.log('⚠️ Empty message detected');
          await sendMessage(cleanNumber, 'Disculpa, el mensaje no puede estar vacío.', 'laconchadetumadre');
          continue;
        }

        // Handle reactions
        if (messageBody === "😀" || messageBody === "😕" || messageBody === "😭") {
          console.log('🎭 Reaction detected:', messageBody);
          await sendMessage(cleanNumber, 'Gracias por tu feedback!', 'laconchadetumadre');
          continue;
        }

        // Echo the message back
        console.log('💬 Processing regular message');
        await sendMessage(cleanNumber, `Recibí tu mensaje: ${messageBody}`, 'laconchadetumadre');
      }
    }

    return NextResponse.json({ 
      message: "Messages processed successfully" 
    }, { 
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });

  } catch (error) {
    console.error('❌ Webhook error:', error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS(req: Request) {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
} 