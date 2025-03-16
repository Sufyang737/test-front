import { BusinessProfileForm } from "@/features/profile/components/business-profile-form"
import { Card, CardContent } from "@/components/ui/card"
import { Building2, Clock, Share2, Store } from "lucide-react"

export default function BusinessProfileOnboarding() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 p-2 mb-4">
            <Store className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
            Configura tu Empresa
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Último paso: personaliza la información de tu negocio para brindar la mejor experiencia a tus clientes
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,2fr] gap-8 max-w-7xl mx-auto">
          <div className="space-y-6">
            <Card className="border-0 bg-white/5 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="rounded-full bg-blue-500/10 p-3">
                    <Building2 className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Información Básica</h3>
                    <p className="text-gray-400 text-sm">
                      Configura el nombre y descripción de tu empresa para que tus clientes te identifiquen fácilmente.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white/5 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="rounded-full bg-indigo-500/10 p-3">
                    <Clock className="h-6 w-6 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Horarios de Atención</h3>
                    <p className="text-gray-400 text-sm">
                      Establece tus horarios de atención para cada día de la semana y mantén informados a tus clientes.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white/5 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="rounded-full bg-purple-500/10 p-3">
                    <Share2 className="h-6 w-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Redes Sociales</h3>
                    <p className="text-gray-400 text-sm">
                      Conecta tus redes sociales para aumentar tu presencia online y facilitar el contacto con tus clientes.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 bg-white/5 backdrop-blur-sm">
            <CardContent className="p-8">
              <BusinessProfileForm onboardingMode={true} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 