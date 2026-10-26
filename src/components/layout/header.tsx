import React from 'react';
import { SidebarTrigger } from '../ui/sidebar';
import { Separator } from '../ui/separator';
import { Breadcrumbs } from '../breadcrumbs';
import SearchInput from '../search-input';
import { ThemeSelector } from '../themes/theme-selector';
import { ThemeModeToggle } from '../themes/theme-mode-toggle';
import CtaGithub from './cta-github';
import { NotificationCenter } from '@/features/notifications/components/notification-center';
import { UserButton } from '@clerk/nextjs';
import { Logo } from '@/components/common/logo';

export default function Header() {
  return (
    <header className='bg-background/60 sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-2 backdrop-blur-md md:h-14 border-b border-border/40'>
      <div className='flex items-center gap-2.5 px-4'>
        <SidebarTrigger className='-ml-1' />
        <Separator orientation='vertical' className='mr-1.5 h-4 data-vertical:self-center' />
        <div className='flex md:hidden items-center mr-1'>
          <Logo size='sm' showIconBadge={true} href='/dashboard/overview' />
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
        <UserButton />
      </div>
    </header>
  );
}
