import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react';
import ProfileCreateForm from '@/features/profile/components/profile-create-form';
import { useToast } from '@/components/ui/use-toast';
import { getPocketBase } from '@/lib/pocketbase';
import { useAuth } from '@clerk/nextjs';

export interface ClientProfileProps {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  clientId: string;
  conversationId: string;
}

interface ErrorResponse {
  message: string;
}

export function ClientProfileDialog({
  isOpen,
  setIsOpen,
  clientId,
  conversationId
}: ClientProfileProps) {
  const { toast } = useToast();
  const { getToken } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const token = await getToken();
      const pb = await getPocketBase();

      if (!token) {
        toast({
          title: 'Error',
          description: 'Not authorized to fetch profile',
          variant: 'destructive'
        });
        return;
      }

      const record = await pb
        .collection('profiles')
        .getFirstListItem(`clientId="${clientId}"`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

      setProfile(record);
    } catch (error) {
      const err = error as ErrorResponse;
      toast({
        title: 'Error',
        description: err.message || 'Failed to fetch profile',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [clientId, getToken, toast]);

  useEffect(() => {
    if (isOpen) {
      fetchProfile();
    }
  }, [isOpen, fetchProfile]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl">
        <ProfileCreateForm
          clientId={clientId}
          conversationId={conversationId}
          initialData={profile}
          onSuccess={() => {
            setIsOpen(false);
            toast({
              title: 'Success',
              description: 'Profile updated successfully'
            });
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
