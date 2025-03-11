import * as React from 'react';

export type SidebarContext = {
  state: 'expanded' | 'collapsed';
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
};

export const SidebarContext = React.createContext<SidebarContext | null>(null);

export interface SidebarProviderProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultOpen?: boolean;
}

export interface SidebarGroupProps extends React.HTMLAttributes<HTMLDivElement> {}

export interface SidebarGroupLabelProps extends React.HTMLAttributes<HTMLDivElement> {}

export interface SidebarMenuProps extends React.HTMLAttributes<HTMLDivElement> {}

export interface SidebarMenuItemProps extends React.HTMLAttributes<HTMLDivElement> {}

export interface SidebarMenuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isActive?: boolean;
}

export interface SidebarMenuSubProps extends React.HTMLAttributes<HTMLDivElement> {}

export interface SidebarMenuSubItemProps extends React.HTMLAttributes<HTMLDivElement> {}

export interface SidebarMenuSubButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isActive?: boolean;
} 