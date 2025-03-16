import { PageContainer } from '@/components/layout/page-container';
import ProfileCreateForm from './profile-create-form';
import { useAuth } from '@clerk/nextjs';

export default function ProfileViewPage() {
  const { userId } = useAuth();

  if (!userId) {
    return (
      <PageContainer>
        <div className='w-full space-y-4'>
          <p>Please sign in to view your profile.</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className='w-full space-y-4'>
        <ProfileCreateForm 
          initialData={null} 
          clientId={userId}
          conversationId="profile-view"
        />
      </div>
    </PageContainer>
  );
}
