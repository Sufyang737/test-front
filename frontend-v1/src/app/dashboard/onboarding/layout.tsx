import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session.userId) {
    redirect('/sign-in')
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-gray-900 to-gray-800">
      {children}
    </div>
  )
} 