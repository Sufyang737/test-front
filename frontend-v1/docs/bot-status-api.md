# Bot Status API Documentation

## Overview

This API allows you to manage the bot status for WhatsApp conversations. It provides endpoints to check, update, and toggle the bot status for specific chats.

## Base URL

```
https://your-domain.com/api/chat/bot-status
```

## Authentication

All endpoints require authentication using a valid session token. Include the authentication token in the request headers:

```
Authorization: Bearer <your_token>
```

## Endpoints

### 1. Check Chat Existence

Verifica si existe un chat específico en la base de datos.

```
GET /api/chat/bot-status?chatId={chatId}
```

#### Parameters

| Parameter | Type   | Required | Description                                    |
|-----------|--------|----------|------------------------------------------------|
| chatId    | string | No       | The WhatsApp chat ID (format: number@c.us)    |

#### Response

```json
{
  "exists": boolean
}
```

Donde:
- `exists`: `true` si el chat existe, `false` si no existe o no se proporcionó chatId

#### Status Codes

- `200`: Success (incluso cuando el chat no existe)
- `403`: Error de permisos
- `408`: Request timeout
- `500`: Internal Server Error

#### Examples

1. Verificar un chat específico:
```bash
curl "http://localhost:3000/api/chat/bot-status?chatId=123456789@c.us"
```

Response:
```json
{
  "exists": false
}
```

2. Consulta sin chatId:
```bash
curl "http://localhost:3000/api/chat/bot-status"
```

Response:
```json
{
  "exists": false
}
```

#### TypeScript Example

```typescript
async function checkChatExists(chatId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/chat/bot-status?chatId=${chatId}`);
    const data = await response.json();
    return data.exists;
  } catch (error) {
    console.error('Error checking chat existence:', error);
    return false;
  }
}

// Uso
const exists = await checkChatExists('123456789@c.us');
console.log('Chat exists:', exists);
```

### 2. Get Bot Status

Retrieves the current bot status for a specific chat.

```
GET /api/chat/bot-status?chatId={chatId}
```

#### Parameters

| Parameter | Type   | Required | Description                                    |
|-----------|--------|----------|------------------------------------------------|
| chatId    | string | Yes      | The WhatsApp chat ID (format: number@c.us)    |

#### Response

```json
{
  "chatId": "1234567890@c.us",
  "useBot": true,
  "category": "support"
}
```

#### Status Codes

- `200`: Success
- `400`: Bad Request (missing chatId)
- `401`: Unauthorized
- `404`: Chat not found
- `500`: Internal Server Error

#### Python Example

```python
import requests

def get_bot_status(chat_id: str, token: str) -> dict:
    headers = {
        'Authorization': f'Bearer {token}'
    }
    
    response = requests.get(
        f'https://your-domain.com/api/chat/bot-status',
        params={'chatId': chat_id},
        headers=headers
    )
    
    response.raise_for_status()
    return response.json()
```

### 3. Update Bot Status

Updates the bot status and category for a specific chat.

```
POST /api/chat/bot-status
```

#### Request Body

```json
{
  "chatId": "1234567890@c.us",
  "useBot": true,
  "category": "support"
}
```

| Field    | Type    | Required | Description                                    |
|----------|---------|----------|------------------------------------------------|
| chatId   | string  | Yes      | The WhatsApp chat ID (format: number@c.us)    |
| useBot   | boolean | No       | Whether to enable the bot for this chat       |
| category | string  | No       | Chat category (default: "general")            |

#### Response

```json
{
  "chatId": "1234567890@c.us",
  "useBot": true,
  "category": "support"
}
```

#### Status Codes

- `200`: Success
- `400`: Bad Request (missing chatId)
- `401`: Unauthorized
- `404`: Chat not found
- `500`: Internal Server Error

#### Python Example

```python
import requests

def update_bot_status(chat_id: str, use_bot: bool, category: str, token: str) -> dict:
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    data = {
        'chatId': chat_id,
        'useBot': use_bot,
        'category': category
    }
    
    response = requests.post(
        'https://your-domain.com/api/chat/bot-status',
        json=data,
        headers=headers
    )
    
    response.raise_for_status()
    return response.json()
```

### 4. Toggle Bot Status

Toggles the bot status (on/off) for a specific chat.

```
PATCH /api/chat/bot-status?chatId={chatId}
```

#### Parameters

| Parameter | Type   | Required | Description                                    |
|-----------|--------|----------|------------------------------------------------|
| chatId    | string | Yes      | The WhatsApp chat ID (format: number@c.us)    |

#### Response

```json
{
  "chatId": "1234567890@c.us",
  "useBot": false,
  "category": "support"
}
```

#### Status Codes

- `200`: Success
- `400`: Bad Request (missing chatId)
- `401`: Unauthorized
- `404`: Chat not found
- `500`: Internal Server Error

#### Python Example

```python
import requests

def toggle_bot_status(chat_id: str, token: str) -> dict:
    headers = {
        'Authorization': f'Bearer {token}'
    }
    
    response = requests.patch(
        'https://your-domain.com/api/chat/bot-status',
        params={'chatId': chat_id},
        headers=headers
    )
    
    response.raise_for_status()
    return response.json()
```

## Complete Python Integration Example

```python
from dataclasses import dataclass
from typing import Optional
import requests

@dataclass
class BotStatus:
    chat_id: str
    use_bot: bool
    category: str

class BotStatusAPI:
    def __init__(self, base_url: str, token: str):
        self.base_url = base_url.rstrip('/')
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
    
    def get_status(self, chat_id: str) -> BotStatus:
        """Get bot status for a specific chat."""
        response = requests.get(
            f'{self.base_url}/api/chat/bot-status',
            params={'chatId': chat_id},
            headers=self.headers
        )
        response.raise_for_status()
        data = response.json()
        return BotStatus(
            chat_id=data['chatId'],
            use_bot=data['useBot'],
            category=data['category']
        )
    
    def update_status(
        self, 
        chat_id: str, 
        use_bot: bool, 
        category: Optional[str] = None
    ) -> BotStatus:
        """Update bot status and category."""
        data = {
            'chatId': chat_id,
            'useBot': use_bot
        }
        if category:
            data['category'] = category
            
        response = requests.post(
            f'{self.base_url}/api/chat/bot-status',
            json=data,
            headers=self.headers
        )
        response.raise_for_status()
        data = response.json()
        return BotStatus(
            chat_id=data['chatId'],
            use_bot=data['useBot'],
            category=data['category']
        )
    
    def toggle_status(self, chat_id: str) -> BotStatus:
        """Toggle bot status for a specific chat."""
        response = requests.patch(
            f'{self.base_url}/api/chat/bot-status',
            params={'chatId': chat_id},
            headers=self.headers
        )
        response.raise_for_status()
        data = response.json()
        return BotStatus(
            chat_id=data['chatId'],
            use_bot=data['useBot'],
            category=data['category']
        )

# Usage example
if __name__ == '__main__':
    api = BotStatusAPI(
        base_url='https://your-domain.com',
        token='your_auth_token'
    )
    
    # Get status
    status = api.get_status('1234567890@c.us')
    print(f'Bot enabled: {status.use_bot}')
    
    # Update status
    new_status = api.update_status(
        chat_id='1234567890@c.us',
        use_bot=True,
        category='support'
    )
    print(f'Updated status: {new_status}')
    
    # Toggle status
    toggled = api.toggle_status('1234567890@c.us')
    print(f'Bot is now: {"enabled" if toggled.use_bot else "disabled"}')
```

## Error Handling

The API uses standard HTTP status codes and returns error messages in JSON format:

```json
{
  "error": "Error message description"
}
```

### Common Errors

1. Missing Chat ID
```json
{
  "error": "Chat ID is required"
}
```

2. Unauthorized Access
```json
{
  "error": "Unauthorized"
}
```

3. Chat Not Found
```json
{
  "error": "Conversation not found"
}
```

### Python Error Handling Example

```python
from requests.exceptions import RequestException

def safe_get_bot_status(chat_id: str, token: str) -> dict:
    try:
        return get_bot_status(chat_id, token)
    except RequestException as e:
        if e.response is not None:
            if e.response.status_code == 401:
                print("Authentication failed")
            elif e.response.status_code == 404:
                print("Chat not found")
            else:
                print(f"Error: {e.response.json().get('error', 'Unknown error')}")
        else:
            print("Network error occurred")
        return None
```

## Notes

1. All timestamps are in ISO 8601 format
2. Chat IDs should be in the format `number@c.us`
3. Categories are case-sensitive
4. The bot status is persistent across sessions
5. Changes to bot status take effect immediately 