import { BusinessProfileForm } from '@/features/business-profile/components/business-profile-form';
import { PageContainer } from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Perfil de Empresa",
  description: "Configura el perfil de tu empresa",
}

export default function BusinessProfilePage() {
  return (
    <PageContainer>
      <div className="w-full space-y-4">
        <Heading 
          title="Perfil de Empresa" 
          description="Gestiona la información y configuración de tu empresa."
        />
        <Separator />
        <BusinessProfileForm />
      </div>
    </PageContainer>
  );
}