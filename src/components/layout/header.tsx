'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { SidebarTrigger } from '../ui/sidebar';
import { Separator } from '../ui/separator';
import { Breadcrumbs } from '../breadcrumbs';
import SearchInput from '../search-input';
import { ThemeSelector } from '../themes/theme-selector';
import { ThemeModeToggle } from '../themes/theme-mode-toggle';
import CtaGithub from './cta-github';
import { NotificationCenter } from '@/features/notifications/components/notification-center';
import { UserNav } from './user-nav';
import { Logo } from '@/components/common/logo';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();

  // Hiển thị nút quay lại khi đang ở các trang con
  const canGoBack =
    pathname !== '/dashboard' &&
    pathname !== '/dashboard/overview' &&
    pathname !== '/dashboard/products' &&
    pathname !== '/dashboard/settings/storefront' &&
    pathname !== '/dashboard/orders' &&
    pathname !== '/dashboard/customers' &&
    pathname !== '/dashboard/settings';

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/dashboard/products');
    }
  };

  return (
    <header className='bg-background/60 sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-2 backdrop-blur-md md:h-14 border-b border-border/40'>
      <div className='flex items-center gap-2 px-4'>
        <div className='hidden md:flex items-center'>
          <SidebarTrigger className='-ml-1' />
          <Separator orientation='vertical' className='h-4 data-vertical:self-center ml-2 mr-1' />
        </div>

        {/* Nút quay lại (Back Button) Tiếng Việt */}
        {canGoBack && (
          <>
            <Button
              variant='ghost'
              size='sm'
              onClick={handleBack}
              className='h-8 w-8 p-0 rounded-lg text-neutral-800 hover:text-neutral-900 dark:text-neutral-200 dark:hover:text-white cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors'
              title='Quay lại'
            >
              <ArrowLeft className='w-4 h-4 stroke-[2.5]' />
            </Button>
            <Separator orientation='vertical' className='h-4 data-vertical:self-center' />
          </>
        )}

        <div className='flex md:hidden items-center mr-1'>
          <Logo size='sm' showIconBadge={true} href='/dashboard/products' />
          <Separator orientation='vertical' className='mx-2 h-4 data-vertical:self-center' />
        </div>
        <Breadcrumbs />
      </div>

      <div className='flex items-center gap-2 px-4'>
        <CtaGithub />
        <div className='hidden md:flex'>
          <SearchInput />
        </div>
        <ThemeModeToggle />
        <div className='hidden sm:block'>
          <ThemeSelector />
        </div>
        <NotificationCenter />
        <UserNav />
      </div>
    </header>
  );
}
