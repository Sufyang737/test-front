'use client';

import { XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DataTableResetFilterProps {
  onReset: () => void;
}

export function DataTableResetFilter({ onReset }: DataTableResetFilterProps) {
  return (
    <Button
      variant="ghost"
      onClick={onReset}
      className="h-8 px-2 lg:px-3"
    >
      Reset
      <XIcon className="ml-2 h-4 w-4" />
    </Button>
  );
}
