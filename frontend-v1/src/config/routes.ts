import {
  LayoutDashboard,
  MessageSquare,
  Store,
  Settings,
  Building2,
  HelpCircle,
  Users,
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
        label: "Ayuda",
        icon: HelpCircle,
        href: "/dashboard/help",
      }
    ],
  }
] 