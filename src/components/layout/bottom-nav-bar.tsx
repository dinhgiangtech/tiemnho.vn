'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Store, Palette, ShoppingBag, Users, QrCode } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavTabItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  isActiveRoute: (pathname: string) => boolean;
}

const BOTTOM_NAV_ITEMS: NavTabItem[] = [
  {
    title: 'Tổng quan',
    url: '/dashboard/overview',
    icon: LayoutDashboard,
    isActiveRoute: (pathname: string) =>
      pathname === '/dashboard/overview' || pathname === '/dashboard'
  },
  {
    title: 'Tiệm',
    url: '/dashboard/products',
    icon: Store,
    isActiveRoute: (pathname: string) =>
      pathname === '/dashboard/products' || pathname.startsWith('/dashboard/products/')
  },
  {
    title: 'Thiết kế',
    url: '/dashboard/settings/storefront',
    icon: Palette,
    isActiveRoute: (pathname: string) => pathname === '/dashboard/settings/storefront'
  },
  {
    title: 'Đơn hàng',
    url: '/dashboard/orders',
    icon: ShoppingBag,
    isActiveRoute: (pathname: string) =>
      pathname === '/dashboard/orders' || pathname.startsWith('/dashboard/orders/')
  },
  {
    title: 'Khách',
    url: '/dashboard/customers',
    icon: Users,
    isActiveRoute: (pathname: string) =>
      pathname === '/dashboard/customers' ||
      pathname === '/dashboard/leads' ||
      pathname.startsWith('/dashboard/leads/')
  },
  {
    title: 'Nhận tiền',
    url: '/dashboard/settings',
    icon: QrCode,
    isActiveRoute: (pathname: string) =>
      (pathname === '/dashboard/settings' || pathname.startsWith('/dashboard/settings')) &&
      pathname !== '/dashboard/settings/storefront'
  }
];

export function BottomNavBar() {
  const pathname = usePathname();

  // Ẩn thanh BottomNavBar khi đang ở trong các màn hình form tạo/sửa chi tiết để nhường chỗ cho thanh hành động dính đáy
  const isFormPage =
    pathname === '/dashboard/products/create' ||
    pathname.startsWith('/dashboard/products/create') ||
    pathname.includes('/edit');

  if (isFormPage) {
    return null;
  }

  return (
    <nav
      aria-label='Thanh điều hướng chính trên di động'
      className='fixed bottom-0 left-0 right-0 z-[999] h-16 w-full bg-background/95 backdrop-blur-md border-t border-border px-1 grid grid-cols-6 items-center md:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.08)] select-none'
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {BOTTOM_NAV_ITEMS.map((item) => {
        const active = item.isActiveRoute(pathname);
        const IconComponent = item.icon;

        return (
          <Link
            key={item.url}
            href={item.url}
            className={cn(
              'flex flex-col items-center justify-center gap-1 py-1 w-full rounded-xl transition-all duration-150 active:scale-95 relative',
              active
                ? 'text-primary font-bold'
                : 'text-muted-foreground hover:text-foreground font-medium'
            )}
          >
            {active && <span className='absolute top-0 h-0.5 w-6 rounded-full bg-primary' />}
            <IconComponent
              className={cn(
                'w-5 h-5 transition-transform shrink-0',
                active ? 'text-primary scale-105' : 'text-muted-foreground'
              )}
              strokeWidth={active ? 2.2 : 1.75}
            />
            <span
              className={cn(
                'text-[10px] sm:text-[11px] leading-tight tracking-[0.01em] truncate max-w-full text-center px-0.5',
                active ? 'text-primary font-bold' : 'text-muted-foreground'
              )}
            >
              {item.title}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
