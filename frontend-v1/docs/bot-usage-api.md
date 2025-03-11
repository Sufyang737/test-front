# Bot Usage API Documentation

## Overview

This API allows you to check if a specific WhatsApp chat is using the bot and its category.

## Base URL

```
https://your-domain.com/api/chat/bot-usage
```

## Authentication

All endpoints require authentication using a valid session token. Include the authentication token in the request headers:

```
Authorization: Bearer <your_token>
```

## Endpoints

### 1. Check Bot Usage Status

Retrieves whether a specific chat is using the bot and its category.

```
GET /api/chat/bot-usage?chatId={chatId}
```

#### Parameters

| Parameter | Type   | Required | Description                                    |
|-----------|--------|----------|------------------------------------------------|
| chatId    | string | Yes      | The WhatsApp chat ID (format: number@c.us)    |

#### Response

```json
{
  "success": true,
  "record": {
    "chatId": "123456789@c.us",
    "useBot": true,
    "category": "support"
  }
}
```

#### Error Responses

1. Missing Chat ID:
```json
{
  "error": "Chat ID is required"
}
```

2. Conversation Not Found:
```json
{
  "error": "Conversation not found"
}
```

#### Status Codes

- `200`: Success
- `400`: Bad Request (missing chatId)
- `403`: Error de permisos
- `404`: Conversation not found
- `408`: Request timeout
- `500`: Internal Server Error

#### Examples

1. Verificar uso del bot:
```bash
curl "http://localhost:3000/api/chat/bot-usage?chatId=123456789@c.us"
```

Success Response:
```json
{
  "success": true,
  "record": {
    "chatId": "123456789@c.us",
    "useBot": true,
    "category": "support"
  }
}
```

#### TypeScript Example

```typescript
async function checkBotUsage(chatId: string): Promise<{useBot: boolean, category: string} | null> {
  try {
    const response = await fetch(`/api/chat/bot-usage?chatId=${chatId}`);
    
    if (!response.ok) {
      throw new Error('Failed to check bot usage');
    }
    
    const data = await response.json();
    return {
      useBot: data.record.useBot,
      category: data.record.category
    };
  } catch (error) {
    console.error('Error checking bot usage:', error);
    return null;
  }
}

// Uso
const botStatus = await checkBotUsage('123456789@c.us');
if (botStatus) {
  console.log('Bot enabled:', botStatus.useBot);
  console.log('Category:', botStatus.category);
} else {
  console.log('Could not check bot status');
}
```

## Notes

1. El endpoint verifica si el chat existe y está usando el bot
2. También devuelve la categoría del chat
3. Si el chat no existe, devuelve un error 404 