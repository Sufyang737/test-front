# Create Conversation API Documentation

## Overview

This API endpoint allows you to create new WhatsApp conversations and associate them with existing clients using their session ID. It provides functionality to initialize conversations with specific settings and metadata.

## Base URL

```
https://your-domain.com/api/chat/create
```

## Authentication

The endpoint uses admin authentication internally. No client-side authentication is required.

## Endpoint

### Create New Conversation

Creates a new conversation and associates it with an existing client.

```
POST /api/chat/create
```

### Request Body

```json
{
  "session_name": "client_session_id",
  "use_bot": true,
  "name": "Chat Name",
  "number_client": 1234567890,
  "category": "sales",
  "finished_chat": false,
  "chat_id": "custom_chat_id"
}
```

| Field         | Type    | Required | Description                                           |
|--------------|---------|----------|-------------------------------------------------------|
| session_name | string  | Yes      | Client's session ID (maps to session_id in database)  |
| use_bot      | boolean | No       | Whether to enable the bot (default: true)            |
| name         | string  | No       | Name of the conversation (default: "")               |
| number_client| number  | No       | Client's phone number (default: null)                |
| category     | string  | No       | Conversation category (default: "general")           |
| finished_chat| boolean | No       | Whether the chat is finished (default: false)        |
| chat_id      | string  | No       | Custom chat ID (auto-generated if not provided)      |

### Response

#### Success Response (200)

```json
{
  "success": true,
  "record": {
    "id": "record_id",
    "chatId": "chat_id",
    "useBot": true,
    "name": "Chat Name",
    "numberClient": 1234567890,
    "category": "sales",
    "finishedChat": false,
    "clientId": "client_id"
  }
}
```

#### Error Responses

- `400 Bad Request`: Session name is missing
```json
{
  "error": "Session name is required"
}
```

- `404 Not Found`: Client not found
```json
{
  "error": "Client not found"
}
```

- `403 Forbidden`: Permission error
```json
{
  "error": "Error de permisos",
  "details": "Token de admin inválido o expirado"
}
```

- `408 Request Timeout`: Request cancelled
```json
{
  "error": "La solicitud fue cancelada",
  "details": "Por favor, intenta de nuevo"
}
```

- `500 Internal Server Error`: Server error
```json
{
  "error": "Error procesando la solicitud",
  "details": "Error message"
}
```

## Code Examples

### JavaScript/TypeScript

```typescript
async function createConversation(sessionName: string, options = {}) {
  const response = await fetch('/api/chat/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      session_name: sessionName,
      ...options
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create conversation');
  }

  return response.json();
}

// Usage example
try {
  const result = await createConversation('client_session_123', {
    use_bot: true,
    name: 'Support Chat',
    number_client: 1234567890,
    category: 'support'
  });
  console.log('Conversation created:', result);
} catch (error) {
  console.error('Error creating conversation:', error);
}
```

### Python

```python
import requests
from typing import Optional, Dict, Any

def create_conversation(
    session_name: str,
    use_bot: Optional[bool] = None,
    name: Optional[str] = None,
    number_client: Optional[int] = None,
    category: Optional[str] = None,
    finished_chat: Optional[bool] = None,
    chat_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Create a new conversation for a client.
    
    Args:
        session_name (str): Client's session ID
        use_bot (bool, optional): Whether to enable the bot
        name (str, optional): Name of the conversation
        number_client (int, optional): Client's phone number
        category (str, optional): Conversation category
        finished_chat (bool, optional): Whether the chat is finished
        chat_id (str, optional): Custom chat ID
    
    Returns:
        dict: Created conversation data
    
    Raises:
        requests.exceptions.RequestException: If the request fails
    """
    data = {
        'session_name': session_name
    }
    
    # Add optional parameters if provided
    if use_bot is not None:
        data['use_bot'] = use_bot
    if name is not None:
        data['name'] = name
    if number_client is not None:
        data['number_client'] = number_client
    if category is not None:
        data['category'] = category
    if finished_chat is not None:
        data['finished_chat'] = finished_chat
    if chat_id is not None:
        data['chat_id'] = chat_id
    
    response = requests.post(
        'https://your-domain.com/api/chat/create',
        json=data
    )
    
    response.raise_for_status()
    return response.json()

# Usage example
try:
    result = create_conversation(
        session_name='client_session_123',
        use_bot=True,
        name='Support Chat',
        number_client=1234567890,
        category='support'
    )
    print('Conversation created:', result)
except requests.exceptions.RequestException as e:
    print('Error creating conversation:', e)
``` 