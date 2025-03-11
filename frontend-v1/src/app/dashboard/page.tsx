import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import OverviewPage from "@/features/overview/components/overview";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.userId) {
    redirect("/sign-in");
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="w-full">
        <OverviewPage />
      </div>
    </div>
  );
}
