export interface TemplateVariable {
  name: string
  description: string
  example: string
  category: 'client' | 'product' | 'support' | 'custom'
}

export const DEFAULT_VARIABLES: TemplateVariable[] = [
  // Client Variables
  {
    name: 'client_name',
    description: 'Full name of the client',
    example: 'John Doe',
    category: 'client'
  },
  {
    name: 'client_first_name',
    description: 'First name of the client',
    example: 'John',
    category: 'client'
  },
  {
    name: 'client_phone',
    description: 'Phone number of the client',
    example: '+1234567890',
    category: 'client'
  },

  // Product Variables
  {
    name: 'product_name',
    description: 'Name of the product',
    example: 'Premium Package',
    category: 'product'
  },
  {
    name: 'product_price',
    description: 'Price of the product',
    example: '$99.99',
    category: 'product'
  },
  {
    name: 'product_description',
    description: 'Description of the product',
    example: 'Our premium service package includes...',
    category: 'product'
  },
  {
    name: 'product_url',
    description: 'URL to the product page',
    example: 'https://example.com/products/premium',
    category: 'product'
  },

  // Support Variables
  {
    name: 'agent_name',
    description: 'Name of the support agent',
    example: 'Sarah Smith',
    category: 'support'
  },
  {
    name: 'ticket_number',
    description: 'Support ticket reference number',
    example: 'TK-12345',
    category: 'support'
  },
  {
    name: 'company_name',
    description: 'Name of your company',
    example: 'Acme Inc',
    category: 'support'
  },
  {
    name: 'support_hours',
    description: 'Business hours for support',
    example: '9 AM - 6 PM EST',
    category: 'support'
  },
  {
    name: 'support_email',
    description: 'Support email address',
    example: 'support@example.com',
    category: 'support'
  }
]

export const DEFAULT_TEMPLATES = [
  {
    name_template: 'Welcome Message',
    template: 'Hello {client_first_name}! Welcome to {company_name}. I\'m {agent_name}, and I\'ll be assisting you today. How can I help you?',
    tags: 'welcome,greeting,introduction',
    variables: 'client_first_name,company_name,agent_name'
  },
  {
    name_template: 'Product Information',
    template: 'Thank you for your interest in {product_name}! The price is {product_price}. You can find more details here: {product_url}\n\n{product_description}',
    tags: 'product,sales,information',
    variables: 'product_name,product_price,product_url,product_description'
  },
  {
    name_template: 'Support Ticket Created',
    template: 'Hi {client_name}, your support ticket #{ticket_number} has been created. Our team will review it during our business hours ({support_hours}). For urgent matters, please email us at {support_email}.',
    tags: 'support,ticket,confirmation',
    variables: 'client_name,ticket_number,support_hours,support_email'
  }
] 