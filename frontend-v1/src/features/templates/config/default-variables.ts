export interface TemplateVariable {
  name: string
  description: string
  example: string
  category: 'client' | 'product' | 'support' | 'custom'
}

export const DEFAULT_VARIABLES: TemplateVariable[] = [
  // Variables del Cliente
  {
    name: 'client_name',
    description: 'Nombre completo del cliente',
    example: 'Juan Pérez',
    category: 'client'
  },
  {
    name: 'client_first_name',
    description: 'Nombre del cliente',
    example: 'Juan',
    category: 'client'
  },
  {
    name: 'client_phone',
    description: 'Número de teléfono del cliente',
    example: '+34123456789',
    category: 'client'
  },

  // Variables del Producto
  {
    name: 'product_name',
    description: 'Nombre del producto',
    example: 'Paquete Premium',
    category: 'product'
  },
  {
    name: 'product_price',
    description: 'Precio del producto',
    example: '99,99€',
    category: 'product'
  },
  {
    name: 'product_description',
    description: 'Descripción del producto',
    example: 'Nuestro paquete de servicio premium incluye...',
    category: 'product'
  },
  {
    name: 'product_url',
    description: 'URL de la página del producto',
    example: 'https://ejemplo.com/productos/premium',
    category: 'product'
  },

  // Variables de Soporte
  {
    name: 'agent_name',
    description: 'Nombre del agente de soporte',
    example: 'Sara García',
    category: 'support'
  },
  {
    name: 'ticket_number',
    description: 'Número de referencia del ticket de soporte',
    example: 'TK-12345',
    category: 'support'
  },
  {
    name: 'company_name',
    description: 'Nombre de tu empresa',
    example: 'Empresa S.A.',
    category: 'support'
  },
  {
    name: 'support_hours',
    description: 'Horario de atención al cliente',
    example: '9:00 - 18:00 CET',
    category: 'support'
  },
  {
    name: 'support_email',
    description: 'Correo electrónico de soporte',
    example: 'soporte@ejemplo.com',
    category: 'support'
  }
]

export const DEFAULT_TEMPLATES = [
  {
    name_template: 'Mensaje de Bienvenida',
    template: '¡Hola {client_first_name}! Bienvenido/a a {company_name}. Soy {agent_name} y estaré encantado/a de ayudarte hoy. ¿En qué puedo ayudarte?',
    tags: 'bienvenida,saludo,introducción',
    variables: 'client_first_name,company_name,agent_name'
  },
  {
    name_template: 'Información del Producto',
    template: '¡Gracias por tu interés en {product_name}! El precio es {product_price}. Puedes encontrar más detalles aquí: {product_url}\n\n{product_description}',
    tags: 'producto,ventas,información',
    variables: 'product_name,product_price,product_url,product_description'
  },
  {
    name_template: 'Ticket de Soporte Creado',
    template: 'Hola {client_name}, tu ticket de soporte #{ticket_number} ha sido creado. Nuestro equipo lo revisará durante nuestro horario de atención ({support_hours}). Para asuntos urgentes, por favor envíanos un correo a {support_email}.',
    tags: 'soporte,ticket,confirmación',
    variables: 'client_name,ticket_number,support_hours,support_email'
  }
] 