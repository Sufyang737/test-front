import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import PocketBase from 'pocketbase';
import OverviewPage from "@/features/overview/components/overview";
import { PageContainer } from '@/components/layout/page-container';

const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);

export default async function DashboardPage() {
  const { userId } = await auth();
  
  if (!userId) {
    return redirect('/sign-in');
  }

  let shouldRedirect = false;
  
  try {
    const records = await pb.collection('clients').getList(1, 1, {
      filter: `clerk_id = "${userId}"`,
    });

    shouldRedirect = records.items.length === 0;

    if (shouldRedirect) {
      return redirect('/dashboard/onboarding');
    }

    return (
      <PageContainer>
        <OverviewPage />
      </PageContainer>
    );
  } catch (error) {
    console.error('Error loading dashboard:', error);
    // En caso de error, mostramos el dashboard en lugar de redirigir
    return (
      <PageContainer>
        <OverviewPage />
      </PageContainer>
    );
  }
}
