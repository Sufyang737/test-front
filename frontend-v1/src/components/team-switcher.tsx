'use client';

import * as React from 'react';
import {
  CaretSortIcon,
  CheckIcon,
  PlusCircledIcon
} from '@radix-ui/react-icons';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Check, ChevronsUpDown, PlusCircle } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';

export const company = {
  name: 'Acme Inc',
  plan: 'Enterprise'
};

export function TeamSwitcher() {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <div className={cn(
      "flex items-center gap-2",
      isCollapsed ? "justify-center" : "w-full"
    )}>
      <Avatar className="h-7 w-7">
        <AvatarFallback>A</AvatarFallback>
      </Avatar>
      {!isCollapsed && (
        <div className="flex flex-col">
          <span className="text-sm font-medium">{company.name}</span>
          <span className="text-xs text-muted-foreground">{company.plan}</span>
        </div>
      )}
    </div>
  );
}
