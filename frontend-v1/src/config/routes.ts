import {
  LayoutDashboard,
  MessageSquare,
  Store,
  KanbanSquare,
  Settings,
  Building2,
  BarChart3,
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
    section: "Overview",
    routes: [
      {
        label: "Dashboard",
        icon: LayoutDashboard,
        href: "/dashboard/overview",
      },
      {
        label: "Analytics",
        icon: BarChart3,
        href: "/dashboard",
      },
    ],
  },
  {
    section: "Business",
    routes: [
      {
        label: "Products",
        icon: Store,
        href: "/dashboard/products",
      },
      {
        label: "Chats",
        icon: MessageSquare,
        href: "/dashboard/chats",
      },
      {
        label: "Kanban",
        icon: KanbanSquare,
        href: "/dashboard/kanban",
      },
    ],
  },
  {
    section: "Settings",
    routes: [
      {
        label: "Business Profile",
        icon: Building2,
        href: "/dashboard/business-profile",
      },
      {
        label: "Settings",
        icon: Settings,
        href: "/dashboard/profile",
      },
    ],
  },
] 