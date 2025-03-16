<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://user-images.githubusercontent.com/9113740/201498864-2a900c64-d88f-4ed4-b5cf-770bcb57e1f5.png">
  <source media="(prefers-color-scheme: light)" srcset="https://user-images.githubusercontent.com/9113740/201498152-b171abb8-9225-487a-821c-6ff49ee48579.png">
</picture>

<div align="center"><strong>Next.js Admin Dashboard Starter Template With Shadcn-ui</strong></div>
<div align="center">Built with the Next.js 15 App Router</div>
<br />
<div align="center">
<a href="https://dub.sh/shadcn-dashboard">View Demo</a>
<span>
</div>

## Overview

This is a starter template using the following stack:

- Framework - [Next.js 15](https://nextjs.org/13)
- Language - [TypeScript](https://www.typescriptlang.org)
- Styling - [Tailwind CSS](https://tailwindcss.com)
- Components - [Shadcn-ui](https://ui.shadcn.com)
- Schema Validations - [Zod](https://zod.dev)
- State Management - [Zustand](https://zustand-demo.pmnd.rs)
- Search params state manager - [Nuqs](https://nuqs.47ng.com/)
- Auth - [Auth.js](https://authjs.dev/)
- Tables - [Tanstack Tables](https://ui.shadcn.com/docs/components/data-table)
- Forms - [React Hook Form](https://ui.shadcn.com/docs/components/form)
- Command+k interface - [kbar](https://kbar.vercel.app/)
- Linting - [ESLint](https://eslint.org)
- Pre-commit Hooks - [Husky](https://typicode.github.io/husky/)
- Formatting - [Prettier](https://prettier.io)

_If you are looking for a React admin dashboard starter, here is the [repo](https://github.com/Kiranism/react-shadcn-dashboard-starter)._

## Pages

| Pages                                                                                 | Specifications                                                                                                                                                 |
| :------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Signup](https://next-shadcn-dashboard-starter.vercel.app/)                           | Authentication with **NextAuth** supports Social logins and email logins (Enter dummy email for demo).                                                         |
| [Dashboard (Overview)](https://next-shadcn-dashboard-starter.vercel.app/dashboard)    | Cards with recharts graphs for analytics.Parallel routes in the overview sections with independent loading, error handling, and isolated component rendering . |
| [Product](https://next-shadcn-dashboard-starter.vercel.app/dashboard/product)         | Tanstack tables with server side searching, filter, pagination by Nuqs which is a Type-safe search params state manager in nextjs                              |
| [Product/new](https://next-shadcn-dashboard-starter.vercel.app/dashboard/product/new) | A Product Form with shadcn form (react-hook-form + zod).                                                                                                       |
| [Profile](https://next-shadcn-dashboard-starter.vercel.app/dashboard/profile)         | Mutistep dynamic forms using react-hook-form and zod for form validation.                                                                                      |
| [Kanban Board](https://next-shadcn-dashboard-starter.vercel.app/dashboard/kanban)     | A Drag n Drop task management board with dnd-kit and zustand to persist state locally.                                                                         |
| [Not Found](https://next-shadcn-dashboard-starter.vercel.app/dashboard/notfound)      | Not Found Page Added in the root level                                                                                                                         |
| -                                                                                     | -                                                                                                                                                              |

## Feature based organization

```plaintext
src/
├── app/ # Next.js App Router directory
│ ├── (auth)/ # Auth route group
│ │ ├── (signin)/
│ ├── (dashboard)/ # Dashboard route group
│ │ ├── layout.tsx
│ │ ├── loading.tsx
│ │ └── page.tsx
│ └── api/ # API routes
│
├── components/ # Shared components
│ ├── ui/ # UI components (buttons, inputs, etc.)
│ └── layout/ # Layout components (header, sidebar, etc.)
│
├── features/ # Feature-based modules
│ ├── feature/
│ │ ├── components/ # Feature-specific components
│ │ ├── actions/ # Server actions
│ │ ├── schemas/ # Form validation schemas
│ │ └── utils/ # Feature-specific utilities
│ │
├── lib/ # Core utilities and configurations
│ ├── auth/ # Auth configuration
│ ├── db/ # Database utilities
│ └── utils/ # Shared utilities
│
├── hooks/ # Custom hooks
│ └── use-debounce.ts
│
├── stores/ # Zustand stores
│ └── dashboard-store.ts
│
└── types/ # TypeScript types
└── index.ts
```

## Getting Started

> [!NOTE]  
> We are using **Next 15** with **React 19**, follow these steps:

Clone the repo:

```
git clone https://github.com/Kiranism/next-shadcn-dashboard-starter.git
```

- `pnpm install` ( we have legacy-peer-deps=true added in the .npmrc)
- Create a `.env.local` file by copying the example environment file:
  `cp env.example.txt .env.local`
- Add the required environment variables to the `.env.local` file.
- `pnpm run dev`

You should now be able to access the application at http://localhost:3000.

> [!WARNING]
> After cloning or forking the repository, be cautious when pulling or syncing with the latest changes, as this may result in breaking conflicts.

Cheers! 🥂

## Clerk Webhook Integration

This project includes a webhook handler for Clerk authentication events that automatically syncs user data with PocketBase.

### Setup Instructions

1. Environment Variables
Add these variables to your `.env.local`:
```bash
WEBHOOK_SECRET=your_clerk_webhook_secret
POCKETBASE_URL=your_pocketbase_url
POCKETBASE_ADMIN_EMAIL=your_admin_email
POCKETBASE_ADMIN_PASSWORD=your_admin_password
```

2. Clerk Dashboard Configuration
- Go to your Clerk Dashboard
- Navigate to Webhooks
- Create a new webhook endpoint
- Set the Endpoint URL to: `https://your-domain.com/api/webhooks/clerk`
- Select the following events:
  - user.created
  - user.updated
  - user.deleted
- Save the webhook and copy the signing secret
- Add the signing secret to your `.env.local` as `WEBHOOK_SECRET`

3. PocketBase Configuration
- Create a collection named `clients` with the following schema:
```typescript
{
  "id": "string",
  "first_name": "string",
  "last_name": "string",
  "clerk_id": "string",
  "username": "string",
  "phone_client": "number?",
  "session_id": "string?"
}
```

### Webhook Functionality

The webhook handles the following events:

1. `user.created`:
- Creates a new client record in PocketBase
- Maps Clerk user data to PocketBase fields
- Sets default empty values for `phone_client` and `session_id`

2. `user.updated`:
- Updates the corresponding client record in PocketBase
- Only updates the fields that have changed
- Maintains existing `phone_client` and `session_id` values

3. `user.deleted`:
- Removes the corresponding client record from PocketBase

### Data Mapping

Clerk to PocketBase field mapping:
```typescript
{
  first_name: userData.first_name || '',
  last_name: userData.last_name || '',
  clerk_id: userData.id,
  username: userData.username || userData.email_addresses[0]?.email_address || '',
  phone_client: null,  // To be filled during onboarding
  session_id: ''       // To be filled during onboarding
}
```

## WhatsApp Integration

This project includes a WhatsApp integration using WAHA (WhatsApp HTTP API) that allows users to connect their WhatsApp account and manage it through the dashboard.

### Session Management

#### Session Creation and Handling
- **Single Session Policy**: Only one active session per user is allowed
- **Session Naming**: Uses client's username as unique session identifier
- **Automatic Cleanup**: Inactive sessions are automatically deleted before creating new ones
- **Status Verification**: Sessions are only saved when they are in WORKING state
- **Phone Number Storage**: Automatically stores the connected WhatsApp phone number

#### Session States
- `SCAN_QR_CODE`: Initial state, waiting for QR code scan
- `WORKING`: Session is active and connected
- `FAILED`: Session creation or connection failed

#### Session Lifecycle
1. **Verification**: Checks for existing sessions
   - If active session found: Redirects to dashboard
   - If inactive session found: Deletes it
2. **Creation**: Creates new session with user's username
3. **Connection**: Displays QR code for WhatsApp connection
4. **Storage**: Only saves session data when connection is successful

### Features

#### WhatsApp Connection
- Users can connect their WhatsApp account through a QR code
- The connection process is managed through a user-friendly interface
- Once connected, the phone number is automatically stored in PocketBase
- The session is persistent and can be reused
- Automatic redirection to dashboard after successful connection

#### Connection Status
- Real-time connection status monitoring
- Automatic session recovery
- Visual feedback of connection state
- Success animations and notifications
- Prevention of duplicate sessions

#### Webhook Events
The integration listens to the following webhook events:
- `session.status`: Updates on session connection state
- `message`: Incoming and outgoing messages
- `message.waiting`: Messages waiting to be sent
- `poll.vote`: Poll vote notifications

### Component Usage

The WhatsApp QR component can be used in any page:

```tsx
import { WhatsAppQR } from '@/components/whatsapp/qr-code'

export default function YourPage() {
  return (
    <div>
      <WhatsAppQR />
    </div>
  )
}
```

### API Endpoints

#### `POST /api/whatsapp/session`
Creates a new WhatsApp session with the following configuration:
- Unique session name per user
- Automatic start on creation
- Webhook configuration for events

### Chat Management

#### `POST /api/chat/create`
Creates a new conversation and associates it with an existing client:
- Uses session ID to identify the client
- Configurable bot settings and metadata
- Automatic chat ID generation
- Optional category assignment

Example usage:
```typescript
const response = await fetch('/api/chat/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    session_name: 'client_session_123',
    use_bot: true,
    name: 'Support Chat',
    category: 'support'
  })
});
```

For detailed API documentation, see:
- [Create Conversation API](docs/create-conversation-api.md)
- [Bot Status API](docs/bot-status-api.md)

## Next.js Admin Dashboard with WhatsApp Product Integration

## Product Management Module

The product management module allows users to:
- View a list of products with search and filtering
- Add new products individually or via CSV import
- Edit existing products
- Delete products

### Features

1. **Product List**
   - Responsive data table with sorting and filtering
   - Search functionality
   - Loading states with skeleton UI
   - Truncated descriptions and URLs for better readability
   - Quick actions (edit/delete) for each product

2. **Add Product**
   - Form validation using Zod
   - Required fields: name, URL, description, price
   - Price formatting and validation
   - Client association through Clerk authentication

3. **CSV Import**
   - Bulk import products via CSV
   - CSV template download
   - Validation of CSV format and data
   - Progress tracking for imports
   - Error handling for failed imports

4. **Security**
   - Client-specific product isolation
   - Authentication via Clerk
   - PocketBase rules for data access control
   - Secure URL handling

### Technical Implementation

1. **Data Model**
   ```typescript
   type Product = {
     id: string
     name: string
     url: string
     description: string
     price: number
     client_id: string
     created: string
     updated: string
   }
   ```

2. **PocketBase Rules**
   ```javascript
   // List/Search rule
   @request.auth.id != "" && (@request.auth.client_id = client_id)

   // View rule
   @request.auth.id != "" && (@request.auth.client_id = client_id)

   // Create rule
   @request.auth.id != "" && @request.auth.client_id != ""

   // Update rule
   @request.auth.id != "" && @request.auth.client_id = client_id

   // Delete rule
   @request.auth.id != "" && @request.auth.client_id = client_id
   ```

3. **Components**
   - `ProductList`: Main product listing with search and filters
   - `ProductForm`: Form for adding/editing individual products
   - `ProductCSVUpload`: CSV import functionality
   - `DataTable`: Reusable table component with loading states

### Usage Flow

1. **View Products**
   - Navigate to `/dashboard/products`
   - Use search bar to filter products
   - Click column headers to sort
   - View truncated content with full text on hover

2. **Add Single Product**
   - Click "Add Product" button
   - Fill in required fields
   - Submit form
   - Redirect to product list on success

3. **Import via CSV**
   - Click "Add Product" button
   - Switch to CSV tab
   - Download template (optional)
   - Upload CSV file
   - Review import results

4. **Edit Product**
   - Click "Edit" on product row
   - Modify fields in form
   - Save changes
   - Return to product list

5. **Delete Product**
   - Click "Delete" on product row
   - Confirm deletion
   - Product removed from list

### Error Handling

The module includes comprehensive error handling for:
- Network issues
- Invalid data
- Authentication errors
- CSV format issues
- Concurrent requests
- Request cancellation

### Dependencies

- `@tanstack/react-table`: Data table functionality
- `@clerk/nextjs`: Authentication
- `pocketbase`: Backend and database
- `zod`: Form validation
- `shadcn/ui`: UI components

### Environment Variables

```bash
NEXT_PUBLIC_POCKETBASE_URL=your_pocketbase_url
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret
```

# Next.js Dashboard with WhatsApp Integration

Este dashboard integra WhatsApp usando WAHA (WhatsApp HTTP API) y gestiona los clientes usando PocketBase.

## Características Principales

### Integración de WhatsApp

#### Onboarding y Conexión
- **QR Code Setup**: Interfaz para escanear código QR y conectar WhatsApp
- **Estado Automático**: Verificación automática del estado de conexión
- **Persistencia**: Almacenamiento del ID de sesión en PocketBase
- **Redirección Inteligente**: Redirección automática al dashboard cuando está conectado

#### Gestión de Sesiones
- Verificación del estado de WAHA
- Almacenamiento de session_id en la base de datos
- Manejo de estados de conexión (CONNECTED, WORKING)
- Recuperación automática de sesiones existentes

### Base de Datos (PocketBase)

#### Colección 'clients'
```typescript
interface Client {
  id: string;
  first_name: string;
  last_name: string;
  clerk_id: string;
  username: string;
  phone_client: number | null;
  session_id: string;
  created: string;
  updated: string;
}
```

#### Operaciones Principales
1. **Actualización de Cliente**
```typescript
// Actualizar session_id del cliente
await pb.collection('clients').update(clientId, {
  session_id: sessionName
});
```

2. **Búsqueda de Cliente**
```typescript
// Buscar cliente por clerk_id
const records = await pb.collection('clients').getList(1, 1, {
  filter: `clerk_id = "${userId}"`
});
```

### Flujo de Autenticación

1. Usuario se registra/inicia sesión con Clerk
2. Se crea/actualiza registro en colección 'clients'
3. Usuario escanea QR de WhatsApp
4. Sistema verifica estado de conexión
5. Al conectar:
   - Se guarda session_id en PocketBase
   - Se redirige al dashboard

### Endpoints API

#### WhatsApp Status
- **GET** `/api/whatsapp/status`
  - Verifica estado de conexión
  - Retorna: { status, engine, sessionData }

#### WhatsApp Session
- **POST** `/api/whatsapp/session`
  - Crea nueva sesión de WhatsApp
  - Configura webhooks y eventos

## Variables de Entorno

```env
NEXT_PUBLIC_WAHA_API_URL=your_waha_api_url
NEXT_PUBLIC_POCKETBASE_URL=your_pocketbase_url
NEXT_PUBLIC_APP_URL=your_app_url
```

## Componentes Principales

### WhatsAppQR
```typescript
import { WhatsAppQR } from '@/components/whatsapp/qr-code'
```
Componente para mostrar y gestionar el código QR de WhatsApp.

### OnboardingPage
```typescript
import { OnboardingPage } from '@/app/dashboard/onboarding/page'
```
Página de configuración inicial de WhatsApp con UI moderna y responsive.

## Seguridad

- Autenticación mediante Clerk
- Verificación de sesiones de usuario
- Validación de estados de conexión
- Almacenamiento seguro de IDs de sesión

## Estado de Conexión

El sistema verifica dos condiciones para considerar una conexión activa:
1. `engine.state === 'CONNECTED'`
2. `status === 'WORKING'`

Cuando cualquiera de estas condiciones se cumple:
- Se actualiza el registro del cliente
- Se muestra la interfaz de conexión exitosa
- Se habilita el acceso al dashboard

## Chat Module

The chat module provides a complete WhatsApp chat interface integrated with WAHA API.

### Features

#### Chat Interface
- **Modern UI/UX**: Responsive design with mobile-first approach
- **Real-time Updates**: Auto-polling for new messages and chats
- **Message Types**: Support for text messages with emoji picker
- **Message Status**: Visual indicators for sent, delivered, and read messages
- **Chat Organization**: Recent chats list with unread message badges
- **Visual Feedback**: Loading states and error handling
- **Auto-resize**: Dynamic textarea sizing for message input

#### Chat Components

1. **Chat List**
   - Recent chats with contact info
   - Last message preview
   - Unread message counter
   - Timestamp for last message
   - Avatar with fallback initials
   - Active chat highlighting
   - Empty state handling

2. **Chat Messages**
   - Message bubbles with different styles for sent/received
   - Date separators for message groups
   - Message timestamps
   - Read/delivered indicators
   - Message status updates
   - Pre-wrap formatting for multiline messages

3. **Chat Input**
   - Emoji picker integration
   - Auto-expanding textarea
   - Send button with loading state
   - Enter to send (Shift + Enter for new line)
   - Character limit handling

### Technical Implementation

1. **State Management**
```typescript
interface ChatState {
  chats: Chat[]
  activeChat: string | null
  loading: boolean
  error: string | null
}

interface Message {
  id: string
  content: string
  timestamp: string
  sender: {
    id: string
    type: 'user' | 'contact'
  }
  status: 'sent' | 'delivered' | 'read'
}
```

2. **API Integration**
- Real-time chat updates using polling
- Message sending with status tracking
- Error handling and retry mechanisms
- Session management
- Contact information syncing

3. **UI Components**
```typescript
// Chat list with modern styling
<ChatList
  chats={chats}
  activeChat={activeChat}
  onChatSelect={handleChatSelect}
/>

// Message display with bubbles
<ChatMessages
  messages={messages}
  userId={currentUser}
/>

// Enhanced input with emoji support
<ChatInput
  onSend={handleSend}
  disabled={sending}
  loading={sending}
/>
```

### Usage

1. **Starting a Chat**
   - Select a contact from the chat list
   - View chat history automatically
   - Send messages with emoji support
   - See message status updates

2. **Managing Conversations**
   - Switch between active chats
   - Track unread messages
   - View message history
   - Monitor message status

3. **Error Handling**
   - Network error recovery
   - Failed message retry
   - Session expiration handling
   - Loading state indicators

### Dependencies

```json
{
  "@emoji-mart/data": "latest",
  "@emoji-mart/react": "latest",
  "date-fns": "latest",
  "lucide-react": "latest"
}
```

### Environment Setup

```env
NEXT_PUBLIC_WAHA_API_URL=your_waha_api_url
```

### Best Practices

1. **Performance**
   - Efficient message polling
   - Optimized re-renders
   - Lazy loading of emoji picker
   - Debounced chat updates

2. **User Experience**
   - Responsive design
   - Loading states
   - Error feedback
   - Visual confirmation
   - Keyboard shortcuts

3. **Accessibility**
   - ARIA labels
   - Keyboard navigation
   - Focus management
   - Screen reader support

4. **Security**
   - Session validation
   - Input sanitization
   - Error handling
   - Rate limiting

## WhatsApp Chat Integration

The dashboard includes a complete WhatsApp chat integration using WAHA (WhatsApp HTTP API) with a modern and responsive UI.

### Features

#### Chat Interface
- **Modern UI/UX**: Responsive design with mobile-first approach
- **Real-time Updates**: Auto-polling for new messages and chats
- **Message Types**: Support for text messages with emoji picker
- **Message Status**: Visual indicators for sent, delivered, and read messages
- **Chat Organization**: Recent chats list with unread message badges
- **Visual Feedback**: Loading states and error handling
- **Auto-resize**: Dynamic textarea sizing for message input

#### Chat Components

1. **Chat List**
   - Recent chats with contact info
   - Last message preview
   - Unread message counter
   - Timestamp for last message
   - Avatar with fallback initials
   - Active chat highlighting
   - Empty state handling

2. **Chat Messages**
   - Message bubbles with different styles for sent/received
   - Date separators for message groups
   - Message timestamps
   - Read/delivered indicators
   - Message status updates
   - Pre-wrap formatting for multiline messages

3. **Chat Input**
   - Emoji picker integration
   - Auto-expanding textarea
   - Send button with loading state
   - Enter to send (Shift + Enter for new line)
   - Character limit handling

### Technical Implementation

1. **State Management**
```typescript
interface ChatState {
  chats: Chat[]
  activeChat: string | null
  loading: boolean
  error: string | null
}

interface Message {
  id: string
  content: string
  timestamp: string
  sender: {
    id: string
    type: 'user' | 'contact'
  }
  status: 'sent' | 'delivered' | 'read'
}
```

2. **API Integration**
- Real-time chat updates using polling
- Message sending with status tracking
- Error handling and retry mechanisms
- Session management
- Contact information syncing

3. **UI Components**
```typescript
// Chat list with modern styling
<ChatList
  chats={chats}
  activeChat={activeChat}
  onChatSelect={handleChatSelect}
/>

// Message display with bubbles
<ChatMessages
  messages={messages}
  userId={currentUser}
/>

// Enhanced input with emoji support
<ChatInput
  onSend={handleSend}
  disabled={sending}
  loading={sending}
/>
```

### Usage

1. **Starting a Chat**
   - Select a contact from the chat list
   - View chat history automatically
   - Send messages with emoji support
   - See message status updates

2. **Managing Conversations**
   - Switch between active chats
   - Track unread messages
   - View message history
   - Monitor message status

3. **Error Handling**
   - Network error recovery
   - Failed message retry
   - Session expiration handling
   - Loading state indicators

### Dependencies

```json
{
  "@emoji-mart/data": "latest",
  "@emoji-mart/react": "latest",
  "date-fns": "latest",
  "lucide-react": "latest"
}
```

### Environment Setup

```env
NEXT_PUBLIC_WAHA_API_URL=your_waha_api_url
```

### Best Practices

1. **Performance**
   - Efficient message polling
   - Optimized re-renders
   - Lazy loading of emoji picker
   - Debounced chat updates

2. **User Experience**
   - Responsive design
   - Loading states
   - Error feedback
   - Visual confirmation
   - Keyboard shortcuts

3. **Accessibility**
   - ARIA labels
   - Keyboard navigation
   - Focus management
   - Screen reader support

4. **Security**
   - Session validation
   - Input sanitization
   - Error handling
   - Rate limiting

## WhatsApp Profile Search

The dashboard includes a powerful WhatsApp profile search feature that allows users to look up contact information and recent messages by phone number.

### Features

#### Profile Search
- **Contact Verification**: Checks if phone number is registered on WhatsApp
- **Contact Information**: Displays name, phone, profile picture, and about info
- **Recent Messages**: Shows latest messages with the contact
- **Real-time Status**: Message delivery and read status indicators
- **Clean UI**: Modern and responsive design with loading states

#### Search Component
1. **Input Field**
   - Phone number validation
   - Auto-formatting
   - Enter key support
   - Loading state indicator

2. **Profile Card**
   - Avatar with fallback to initials
   - Contact details section
   - About information
   - Recent messages list

3. **Message Display**
   - Message bubbles with timestamps
   - Sent/received message styling
   - Status indicators for sent messages
   - Date formatting

### Technical Implementation

1. **Profile Search Function**
```typescript
interface WhatsAppProfile {
  contact: {
    id: string
    phone: string
    name: string
    picture?: string
    about?: string
    exists: boolean
  }
  recentMessages: {
    id: string
    content: string
    timestamp: string
    sender: {
      id: string
      type: 'user' | 'contact'
    }
    status: 'sent' | 'delivered' | 'read'
  }[]
}

const searchWhatsAppProfile = async (phone: string) => {
  // Validates and searches for WhatsApp profile
  // Returns contact info and recent messages
}
```

2. **API Integration**
- Contact existence verification
- Profile information retrieval
- Message history fetching
- Status updates tracking

3. **UI Components**
```typescript
<ProfileSearch />  // Main search component
<Card />           // Profile display card
<Avatar />         // Contact avatar
<Input />          // Phone number input
<Button />         // Search button
```

### Usage

1. **Accessing the Search**
   - Navigate to `/dashboard/search`
   - Enter a phone number (without +, spaces, or hyphens)
   - Click search or press Enter

2. **Viewing Results**
   - Contact information appears in a card
   - Profile picture (if available)
   - About information (if set)
   - Recent messages list
   - Message status indicators

3. **Error Handling**
   - Invalid phone number format
   - Non-existent WhatsApp number
   - Network errors
   - Loading states

### Dependencies
```json
{
  "date-fns": "latest",
  "lucide-react": "latest",
  "@/components/ui": "local"
}
```

### Best Practices

1. **Performance**
   - Efficient API calls
   - Optimized image loading
   - Responsive design
   - Loading states

2. **User Experience**
   - Clear error messages
   - Visual feedback
   - Keyboard support
   - Mobile-friendly

3. **Security**
   - Phone number validation
   - Session verification
   - Error handling
   - Rate limiting

## API Endpoints

### WhatsApp Integration Endpoints

[Previous WhatsApp endpoints content remains the same...]

### Products API

#### Get User Products
- **URL**: `/api/products/user-products`
- **Method**: `GET`
- **Query Parameters**: 
  - `session_name` (required): User's session identifier

##### Success Response (200 OK)
```json
{
    "success": true,
    "products": [
        {
            "id": "string",
            "name": "string",
            "url": "string",
            "description": "string",
            "price": "string",
            "client_id": "string",
            "created": "string",
            "updated": "string"
        }
    ]
}
```

##### Error Responses
- **400 Bad Request**: Missing session_name
- **404 Not Found**: Client not found
- **403 Forbidden**: Invalid admin token
- **500 Internal Server Error**: Server errors

##### Python Implementation Example
```python
import requests

def get_user_products(session_name):
    """
    Fetch all products for a specific user.
    
    Args:
        session_name (str): User's session identifier
        
    Returns:
        dict: JSON response with user's products
        
    Raises:
        requests.exceptions.RequestException: On API request failure
    """
    try:
        url = "https://your-domain.com/api/products/user-products"
        params = {"session_name": session_name}
        
        response = requests.get(url, params=params)
        response.raise_for_status()
        return response.json()
        
    except requests.exceptions.RequestException as e:
        print(f"Error fetching products: {str(e)}")
        raise

# Usage example
try:
    result = get_user_products("user_session_id")
    if result.get("success"):
        products = result["products"]
        print(f"Found {len(products)} products")
        for product in products:
            print(f"Product: {product['name']}")
            print(f"Price: {product['price']}")
            print("---")
except Exception as e:
    print(f"Error: {str(e)}")
```

##### Product Fields

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique product identifier |
| name | string | Product name |
| url | string | Product URL |
| description | string | Product description |
| price | string | Product price |
| client_id | string | Owner's client ID |
| created | string | Creation timestamp (ISO 8601) |
| updated | string | Last update timestamp (ISO 8601) |

##### Notes
- Uses admin authentication internally
- Limited to 50 products per request
- Timestamps in ISO 8601 format
- URLs are complete and valid
- No authentication token needed in requests

[Rest of the existing README content remains the same...]

## Environment Variables

```bash
# Existing variables remain...

# Products API Variables
POCKETBASE_TOKEN_ADMIN=your_pocketbase_admin_token
```

## Security Considerations

### Products API Security
- Admin token authentication
- Rate limiting on requests
- Input validation for session_name
- Secure error handling
- No sensitive data exposure

[Rest of the existing README content remains the same...]

## WhatsApp Bot Status API

The dashboard includes endpoints to manage and check WhatsApp bot status for conversations.

### Bot Status Endpoints

#### 1. Check Chat Existence
Verifies if a chat exists in the system.

```
GET /api/chat/bot-status?chatId={chatId}
```

Response:
```json
{
  "exists": true/false
}
```

#### 2. Check Bot Usage
Checks if a specific chat is using the bot and its category.

```
GET /api/chat/bot-usage?chatId={chatId}
```

Response:
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

### Features

- **Chat Existence Verification**: Quick check if a chat exists
- **Bot Usage Status**: Check if bot is enabled for a chat
- **Category Information**: Get chat category
- **Error Handling**: Comprehensive error responses
- **Status Codes**: Standard HTTP status codes
- **Simple Integration**: Easy to use with fetch or axios

### TypeScript Examples

```typescript
// Check if chat exists
async function checkChatExists(chatId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/chat/bot-status?chatId=${chatId}`);
    const data = await response.json();
    return data.exists;
  } catch (error) {
    console.error('Error checking chat:', error);
    return false;
  }
}

// Check bot usage
async function checkBotUsage(chatId: string): Promise<{useBot: boolean, category: string} | null> {
  try {
    const response = await fetch(`/api/chat/bot-usage?chatId=${chatId}`);
    if (!response.ok) throw new Error('Failed to check bot usage');
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
```

### Environment Setup

Add these variables to your `.env.local`:
```bash
NEXT_PUBLIC_POCKETBASE_URL=your_pocketbase_url
POCKETBASE_TOKEN_ADMIN=your_pocketbase_admin_token
```

### PocketBase Configuration

The bot status feature requires these collections:

#### conversation Collection
```typescript
{
  "id": "string",
  "client_id": "string",
  "use_bot": "boolean",
  "category": "string",
  "chat_id": "string",
  "finished_chat": "boolean"
}
```

### API Documentation

For detailed API documentation, see:
- [Bot Status API](docs/bot-status-api.md)
- [Bot Usage API](docs/bot-usage-api.md)

### Error Handling

Common error responses:
```json
// Missing Chat ID
{
  "error": "Chat ID is required"
}

// Conversation Not Found
{
  "error": "Conversation not found"
}

// Permission Error
{
  "error": "Error de permisos",
  "details": "Token de admin inválido o expirado"
}
```

### Best Practices

1. **Error Handling**
   - Always check response status
   - Handle network errors gracefully
   - Provide meaningful error messages

2. **Security**
   - Use environment variables for sensitive data
   - Validate input parameters
   - Implement proper authentication

3. **Performance**
   - Cache responses when appropriate
   - Use proper status codes
   - Minimize database queries

## Contact Management Module

The contact management module provides a complete interface for managing contacts and leads with detailed information and status tracking.

### Features

#### Contact Management
- **Contact Information**: Store and manage contact details
  - Name and company information
  - Company description
  - Social media links (Instagram, Facebook, X/Twitter)
- **Status Tracking**: Visual indicators for contact status
  - Priority levels with color coding
  - Conversation status tracking
  - Request type categorization
  - Customer source tracking

#### Contact Interface
1. **Contact List**
   - Responsive data table with sorting and filtering
   - Visual status indicators with badges
   - Quick actions menu for each contact
   - Color-coded priority levels
   - Spanish language interface

2. **Contact Details**
   - Company information section
   - Social media links
   - Status indicators
   - Priority management
   - Source tracking

3. **Status Management**
   - Priority levels (Alta/Media/Baja)
   - Conversation status (Abierto/Cerrado/Pendiente)
   - Request types (Soporte Técnico/Ventas/Consulta General/Reclamo)
   - Customer sources (Referido/Redes Sociales/Sitio Web/WhatsApp)

### Technical Implementation

1. **Data Model**
```typescript
interface ContactData {
  id: string
  name_client: string
  name_company: string
  description_company?: string
  instagram?: string
  facebook?: string
  x?: string
  client_id: string
  details?: {
    id: string
    lead_id: string
    client_id: string
    priority: "high" | "medium" | "low"
    customer_source: "referral" | "social" | "website" | "whatsapp"
    conversation_status: "open" | "closed" | "pending"
    request_type: "technical support" | "sales" | "general inquiry" | "complaint"
  }
}
```

2. **PocketBase Collections**
   - `profile_lead`: Main contact information
   - `details_conversation`: Contact status and details

3. **Components**
   - `ContactsViewPage`: Main contact management interface
   - `ContactForm`: Form for editing contact information
   - `ContactActions`: Contact action menu
   - `columns`: Table column definitions with status badges

### Usage

1. **Viewing Contacts**
   - Navigate to the contacts section
   - View contact list with status indicators
   - Sort and filter contacts
   - See color-coded priorities and status badges

2. **Editing Contacts**
   - Click the actions menu on any contact
   - Select "Editar"
   - Modify contact information
   - Update status and details
   - Save changes

3. **Status Management**
   - Update priority levels with color indicators
   - Manage conversation status
   - Track request types
   - Monitor customer sources

### Dependencies

```json
{
  "@tanstack/react-table": "latest",
  "@clerk/nextjs": "latest",
  "pocketbase": "latest",
  "@hookform/resolvers/zod": "latest",
  "zod": "latest"
}
```

### Environment Setup

Add these variables to your `.env.local`:
```bash
NEXT_PUBLIC_POCKETBASE_URL=your_pocketbase_url
NEXT_PUBLIC_POCKETBASE_ADMIN_TOKEN=your_admin_token
```
