import { BusinessProfileForm } from "@/features/profile/components/business-profile-form"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Perfil de Empresa",
  description: "Configura el perfil de tu empresa",
}

export default function BusinessProfilePage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Perfil de Empresa</h2>
      </div>
      <div className="grid gap-4">
        <BusinessProfileForm />
      </div>
    </div>
  )
} 