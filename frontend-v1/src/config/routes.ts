import {
  LayoutDashboard,
  MessageSquare,
  Store,
  Settings,
  Building2,
  HelpCircle,
  Users,
  Smartphone,
  ShoppingBag,
  FileText,
  KanbanSquare
} from "lucide-react"

interface Route {
  label: string
  icon: any
  href: string
}

interface RouteSection {
  section: string
  routes: Route[]
}

export const routes: RouteSection[] = [
  {
    section: "General",
    routes: [
      {
        label: "Dashboard",
        icon: LayoutDashboard,
        href: "/dashboard",
      }
    ],
  },
  {
    section: "WhatsApp",
    routes: [
      {
        label: "Chats",
        icon: MessageSquare,
        href: "/dashboard/chats",
      },
      {
        label: "Contacts",
        icon: Users,
        href: "/dashboard/contacts",
      },
      {
        label: "Dispositivo",
        icon: Smartphone,
        href: "/dashboard/device",
      }
    ],
  },
  {
    section: "Negocio",
    routes: [
      {
        label: "Productos",
        icon: Store,
        href: "/dashboard/products",
      },
      {
        label: "Pedidos",
        icon: ShoppingBag,
        href: "/dashboard/orders",
      },
      {
        label: "Catálogo",
        icon: FileText,
        href: "/dashboard/catalog",
      },
      {
        label: "Templates",
        icon: KanbanSquare,
        href: "/dashboard/templates",
      }
    ],
  },
  {
    section: "Configuración",
    routes: [
      {
        label: "Perfil de Empresa",
        icon: Building2,
        href: "/dashboard/business-profile",
      },
      {
        label: "Configuración",
        icon: Settings,
        href: "/dashboard/settings",
      }
    ],
  },
  {
    section: "Ayuda",
    routes: [
      {
        label: "Centro de Ayuda",
        icon: HelpCircle,
        href: "/dashboard/help",
      }
    ],
  }
] 