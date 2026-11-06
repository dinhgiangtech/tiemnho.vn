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
import { navGroups } from '@/config/nav-config';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';
import { Icons } from '@/components/icons';
import { Logo } from '@/components/common/logo';
import { useQuery } from '@tanstack/react-query';
import { profileQueryOptions } from '@/features/tiemnho/api/queries';
import { logoutAction } from '@/app/actions/auth-actions';
import {
  Store,
  ShoppingBag,
  Users,
  QrCode,
  Palette,
  ArrowUpRight,
  LayoutDashboard
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Ánh xạ icon tiêu chuẩn tương ứng
const NAV_ICON_MAP: Record<
  string,
  React.ComponentType<{ className?: string; strokeWidth?: number }>
> = {
  dashboard: LayoutDashboard,
  store: Store,
  palette: Palette,
  shoppingBag: ShoppingBag,
  users: Users,
  qrcode: QrCode
};

export default function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: profile } = useQuery(profileQueryOptions());

  const displayName = profile?.displayName || 'Chủ Tiệm';
  const username = profile?.username || 'tiemnho';
  const avatarUrl = profile?.avatarUrl || '/default-avatar.svg';
  const shopUrl = `/@${username}`;

  // Kiểm tra trạng thái active chính xác theo route
  const checkIsActive = (url: string) => {
    if (url === '/dashboard/overview') {
      return pathname === '/dashboard/overview' || pathname === '/dashboard';
    }
    if (url === '/dashboard/products') {
      return pathname === '/dashboard/products' || pathname.startsWith('/dashboard/products/');
    }
    if (url === '/dashboard/settings/storefront') {
      return pathname === '/dashboard/settings/storefront';
    }
    if (url === '/dashboard/orders') {
      return pathname === '/dashboard/orders' || pathname.startsWith('/dashboard/orders/');
    }
    if (url === '/dashboard/customers') {
      return (
        pathname === '/dashboard/customers' ||
        pathname === '/dashboard/leads' ||
        pathname.startsWith('/dashboard/leads/')
      );
    }
    if (url === '/dashboard/settings') {
      return (
        (pathname === '/dashboard/settings' || pathname.startsWith('/dashboard/settings')) &&
        pathname !== '/dashboard/settings/storefront'
      );
    }
    return pathname === url;
  };

  const mainNavItems = navGroups[0]?.items || [];

  return (
    <Sidebar collapsible='icon' className='border-r border-sidebar-border'>
      {/* 1. Header: Logo Tiệm Nhỏ */}
      <SidebarHeader className='border-b border-sidebar-border/70 px-4 py-3.5'>
        <div className='flex items-center justify-between'>
          <Logo size='md' href='/dashboard/products' showIconBadge={true} />
        </div>
      </SidebarHeader>

      {/* 2. Content: Danh sách menu điều hướng */}
      <SidebarContent className='overflow-x-hidden px-3 py-4'>
        <SidebarGroup className='p-0'>
          <SidebarMenu className='gap-1.5'>
            {mainNavItems.map((item) => {
              const IconComponent =
                item.icon && NAV_ICON_MAP[item.icon] ? NAV_ICON_MAP[item.icon] : Store;
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

      {/* 3. Footer: Nút Ghé tiệm (@username) & Hồ sơ Creator */}
      <SidebarFooter className='border-t border-sidebar-border/70 p-3 space-y-2'>
        {/* Nút Ghé tiệm công khai */}
        <a
          href={shopUrl}
          target='_blank'
          rel='noreferrer'
          className='group/public flex items-center justify-between w-full px-3 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200/80 dark:bg-neutral-800/80 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 transition-colors text-xs font-semibold'
          title='Mở trang Tiệm công khai của bạn'
        >
          <div className='flex items-center gap-2 truncate'>
            <Icons.world className='w-4 h-4 text-neutral-500 shrink-0' />
            <span className='truncate'>Ghé tiệm (@{username})</span>
          </div>
          <ArrowUpRight className='w-3.5 h-3.5 text-neutral-400 group-hover/public:translate-x-0.5 group-hover/public:-translate-y-0.5 transition-transform shrink-0' />
        </a>

        {/* Dropdown tài khoản */}
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton
                    size='lg'
                    className='h-12 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors'
                  />
                }
              >
                <div className='h-8 w-8 rounded-full overflow-hidden shrink-0 border border-border bg-neutral-100'>
                  <img src={avatarUrl} alt={displayName} className='h-full w-full object-cover' />
                </div>
                <div className='flex flex-col min-w-0 text-left flex-1'>
                  <span className='truncate text-xs font-bold text-sidebar-foreground'>
                    {displayName}
                  </span>
                  <span className='truncate text-[10px] text-emerald-500 font-semibold'>
                    ● VietQR Hoạt động
                  </span>
                </div>
                <Icons.chevronsDown className='ml-auto size-4 text-muted-foreground' />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className='w-60 rounded-xl p-1.5'
                side='top'
                align='start'
                sideOffset={8}
              >
                <DropdownMenuGroup>
                  <DropdownMenuLabel className='p-2 font-normal'>
                    <div className='flex items-center gap-2.5'>
                      <div className='h-9 w-9 rounded-full overflow-hidden shrink-0 border border-border'>
                        <img
                          src={avatarUrl}
                          alt={displayName}
                          className='h-full w-full object-cover'
                        />
                      </div>
                      <div className='flex flex-col min-w-0'>
                        <span className='font-bold text-xs text-foreground'>{displayName}</span>
                        <span className='text-[11px] text-muted-foreground'>@{username}</span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => window.open(shopUrl, '_blank')}>
                    <Icons.externalLink className='mr-2 h-4 w-4 text-primary' />
                    Ghé tiệm (@{username})
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/dashboard/settings/storefront')}>
                    <Icons.palette className='mr-2 h-4 w-4' />
                    Thiết kế tiệm
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/dashboard/settings/payment')}>
                    <Icons.qrcode className='mr-2 h-4 w-4' />
                    Nhận tiền QR
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => router.push('/')}>
                    <Icons.world className='mr-2 h-4 w-4' />
                    Trang chủ Tiệm Nhỏ
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => logoutAction()}
                    className='text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer font-semibold'
                  >
                    <Icons.logout className='mr-2 h-4 w-4' />
                    Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
