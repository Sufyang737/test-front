import { redirect } from 'next/navigation';
import { auth, currentUser } from '@clerk/nextjs/server';
import PocketBase from 'pocketbase';
import OverviewPage from "@/features/overview/components/overview";

const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);

export default async function DashboardPage() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    redirect('/sign-in');
  }

  try {
    // Check if user has completed onboarding
    const records = await pb.collection('clients').getList(1, 1, {
      filter: `clerk_id = "${userId}" && session_id != ""`,
    });

    // If user hasn't completed onboarding (no session_id), redirect to onboarding
    if (records.items.length === 0 || !records.items[0].session_id) {
      redirect('/dashboard/onboarding');
    }
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    // If there's an error, assume user needs onboarding
    redirect('/dashboard/onboarding');
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="w-full">
        <OverviewPage />
      </div>
    </div>
  );
}
