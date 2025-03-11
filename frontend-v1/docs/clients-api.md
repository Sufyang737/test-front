# Clients API Documentation

## Overview

This API allows you to retrieve client session information using their WhatsApp chat ID. The process involves a two-step lookup:
1. First, it finds the conversation record using the chat ID
2. Then, it retrieves the client's session information using the client ID from the conversation

## Base URL

```
https://your-domain.com/api/clients
```

## Authentication

All endpoints require authentication using a valid session token. Include the authentication token in the request headers:

```
Authorization: Bearer <your_token>
```

## Endpoints

### 1. View Client Session by Chat ID

Retrieves client session information using a WhatsApp chat ID through a conversation lookup.

```
GET /api/clients/view?chatId={chatId}
```

#### Parameters

| Parameter | Type   | Required | Description                                    |
|-----------|--------|----------|------------------------------------------------|
| chatId    | string | Yes      | The WhatsApp chat ID from the conversation    |

#### Response

```json
{
  "success": true,
  "record": {
    "id": "RECORD_ID",
    "session_id": "SESSION_ID"
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

3. Client Not Found:
```json
{
  "error": "Client not found"
}
```

#### Status Codes

- `200`: Success
- `400`: Bad Request (missing chatId)
- `403`: Error de permisos
- `404`: Conversation or Client not found
- `408`: Request timeout
- `500`: Internal Server Error

#### Examples

1. Buscar session_id por chatId:
```bash
curl "http://localhost:3000/api/clients/view?chatId=123456789@c.us"
```

Success Response:
```json
{
  "success": true,
  "record": {
    "id": "abc123",
    "session_id": "xyz789"
  }
}
```

#### TypeScript Example

```typescript
async function getClientSession(chatId: string): Promise<string | null> {
  try {
    const response = await fetch(`/api/clients/view?chatId=${chatId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch client session');
    }
    
    const data = await response.json();
    return data.record.session_id;
  } catch (error) {
    console.error('Error fetching client session:', error);
    return null;
  }
}

// Uso
const sessionId = await getClientSession('123456789@c.us');
if (sessionId) {
  console.log('Session ID:', sessionId);
} else {
  console.log('No session found for this chat');
}
```

## Notes

1. El endpoint busca primero en la tabla `conversation` usando el `chatId`
2. Luego usa el `client_id` encontrado para buscar en la tabla `clients`
3. Solo devuelve el ID del cliente y su session_id por seguridad
4. Ambas búsquedas deben ser exitosas para obtener el session_id 