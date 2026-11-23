'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail
} from '@/components/ui/sidebar';
import { adminNavGroups } from '@/config/admin-nav-config';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';
import { Icons } from '@/components/icons';
import { logoutAction } from '@/app/actions/auth-actions';
import {
  ShieldAlert,
  Users,
  Store,
  ShoppingBag,
  LayoutDashboard,
  ArrowLeft,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ADMIN_ICON_MAP: Record<
  string,
  React.ComponentType<{ className?: string; strokeWidth?: number }>
> = {
  dashboard: LayoutDashboard,
  users: Users,
  store: Store,
  shoppingBag: ShoppingBag,
  page: FileText
};

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const checkIsActive = (url: string) => {
    if (url === '/admin/overview') {
      return pathname === '/admin/overview' || pathname === '/admin';
    }
    return pathname.startsWith(url);
  };

  const navItems = adminNavGroups[0]?.items || [];

  return (
    <Sidebar collapsible='icon' className='border-r border-sidebar-border bg-sidebar'>
      {/* 1. Header: Badge Admin & Logo */}
      <SidebarHeader className='border-b border-sidebar-border/70 px-4 py-3.5'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2.5'>
            <div className='w-8 h-8 rounded-lg bg-red-500/10 text-red-600 flex items-center justify-center font-bold'>
              <ShieldCheck className='w-5 h-5 text-red-600' />
            </div>
            <div className='flex flex-col'>
              <span className='font-bold text-sm tracking-tight'>SUPER ADMIN</span>
              <span className='text-[10px] text-muted-foreground font-mono'>
                tiemnho.vn platform
              </span>
            </div>
          </div>
        </div>
      </SidebarHeader>

      {/* 2. Content: Danh sách menu Admin */}
      <SidebarContent className='overflow-x-hidden px-3 py-4'>
        <SidebarGroup className='p-0'>
          <SidebarMenu className='gap-1.5'>
            {navItems.map((item) => {
              const IconComponent =
                item.icon && ADMIN_ICON_MAP[item.icon]
                  ? ADMIN_ICON_MAP[item.icon]
                  : LayoutDashboard;
              const isActive = checkIsActive(item.url);

              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    render={<Link href={item.url} aria-label={item.title} />}
                    tooltip={item.title}
                    isActive={isActive}
                    className={cn(
                      'h-11 px-3.5 rounded-xl transition-all font-semibold text-sm flex items-center gap-3 cursor-pointer',
                      isActive
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs'
                        : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                    )}
                  >
                    <IconComponent
                      className={cn(
                        'w-5 h-5 shrink-0 transition-transform',
                        isActive ? 'text-primary-foreground' : 'text-sidebar-foreground/60'
                      )}
                      strokeWidth={isActive ? 2.2 : 1.75}
                    />
                    <span className='truncate font-medium tracking-[0.01em]'>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* 3. Footer: Quay lại Creator Dashboard */}
      <SidebarFooter className='p-3 border-t border-sidebar-border/70 space-y-2'>
        <Link
          href='/dashboard/overview'
          className='flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg text-xs font-medium border border-border bg-background hover:bg-muted transition-colors text-muted-foreground hover:text-foreground'
        >
          <ArrowLeft className='w-3.5 h-3.5' />
          <span>Về Dashboard Creator</span>
        </Link>

        <button
          onClick={async () => {
            await logoutAction();
            router.push('/login');
          }}
          className='flex items-center justify-center gap-2 w-full py-1.5 px-3 rounded-lg text-xs text-destructive hover:bg-destructive/10 transition-colors'
        >
          <Icons.logout className='w-3.5 h-3.5' />
          <span>Đăng xuất</span>
        </button>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
