import { redirect } from 'next/navigation';
import { auth, currentUser } from '@clerk/nextjs/server';
import PocketBase from 'pocketbase';
import OverviewPage from "@/features/overview/components/overview";
import { PageContainer } from '@/components/layout/page-container';

const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
const WAHA_API_URL = process.env.NEXT_PUBLIC_WAHA_API_URL;

export default async function DashboardPage() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    redirect('/sign-in');
  }

  try {
    // Buscar el cliente
    const records = await pb.collection('clients').getList(1, 1, {
      filter: `clerk_id = "${userId}"`,
    });

    // Si no hay cliente, redirigir a onboarding
    if (records.items.length === 0) {
      redirect('/dashboard/onboarding');
    }

    const client = records.items[0];

    // Si no hay session_id, redirigir a onboarding
    if (!client.session_id) {
      redirect('/dashboard/onboarding');
    }

    // Verificar estado de la sesión
    try {
      const sessionResponse = await fetch(`${WAHA_API_URL}/api/sessions/${client.session_id}`);
      const sessionData = await sessionResponse.json();

      // Si la sesión no está activa, redirigir a onboarding
      if (!sessionData.status || (sessionData.status !== 'WORKING' && sessionData.engine?.state !== 'CONNECTED')) {
        redirect('/dashboard/onboarding');
      }
    } catch (error) {
      console.error('Error verificando estado de sesión:', error);
      // Si hay error al verificar la sesión, mostramos el dashboard de todos modos
      // para evitar un bucle de redirección
    }

    // Si llegamos aquí, mostramos el dashboard
    return (
      <PageContainer>
        <OverviewPage />
      </PageContainer>
    );

  } catch (error) {
    console.error('Error general:', error);
    // Si hay un error general, mostramos el dashboard en lugar de redirigir
    return (
      <PageContainer>
        <OverviewPage />
      </PageContainer>
    );
  }
}
