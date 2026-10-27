'use client';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail
} from '@/components/ui/sidebar';
import { navGroups } from '@/config/nav-config';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useFilteredNavGroups } from '@/hooks/use-nav';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';
import { Icons } from '@/components/icons';
import { Logo } from '@/components/common/logo';
import { useClerk } from '@clerk/nextjs';

export default function AppSidebar() {
  const pathname = usePathname();
  const { isOpen } = useMediaQuery();
  const router = useRouter();
  const { signOut } = useClerk();
  const filteredGroups = useFilteredNavGroups(navGroups);

  React.useEffect(() => {
    // Side effects based on sidebar state changes
  }, [isOpen]);

  return (
    <Sidebar collapsible='icon'>
      <SidebarHeader className='border-b border-sidebar-border px-3 py-3'>
        <div className='flex items-center justify-between px-1'>
          <Logo size='md' href='/dashboard/overview' showIconBadge={true} />
          <span className='rounded-full bg-zinc-100 dark:bg-zinc-800 border border-border/60 px-1.5 py-0.2 text-[10px] font-bold text-foreground'>
            PRO
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent className='overflow-x-hidden'>
        {filteredGroups.map((group) => (
          <SidebarGroup key={group.label || 'ungrouped'} className='py-0'>
            {group.label && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
            <SidebarMenu>
              {group.items.map((item) => {
                const Icon = item.icon ? Icons[item.icon] : Icons.logo;
                return item?.items && item?.items?.length > 0 ? (
                  <Collapsible
                    key={item.title}
                    defaultOpen={item.isActive}
                    render={<SidebarMenuItem />}
                  >
                    <CollapsibleTrigger
                      render={
                        <SidebarMenuButton
                          tooltip={item.title}
                          isActive={pathname === item.url}
                          className='group/collapsible'
                        />
                      }
                    >
                      {item.icon && (
                        <Icon
                          className={
                            pathname === item.url
                              ? 'w-4 h-4 text-[#FE2C55] shrink-0'
                              : 'w-4 h-4 text-neutral-500 dark:text-neutral-400 shrink-0'
                          }
                          strokeWidth={1.75}
                        />
                      )}
                      <span>{item.title}</span>
                      <Icons.chevronRight className='ml-auto h-4 w-4 transition-transform duration-200 group-data-panel-open/collapsible:rotate-90' />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items?.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              render={<Link href={subItem.url} aria-label={subItem.title} />}
                              isActive={pathname === subItem.url}
                            >
                              <span>{subItem.title}</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </Collapsible>
                ) : (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      render={<Link href={item.url} aria-label={item.title} />}
                      tooltip={item.title}
                      isActive={pathname === item.url}
                      className={
                        pathname === item.url
                          ? 'font-bold text-[#161823] dark:text-white bg-sidebar-accent'
                          : 'text-neutral-600 dark:text-neutral-400 hover:text-foreground'
                      }
                    >
                      <Icon
                        className={
                          pathname === item.url
                            ? 'w-4 h-4 text-[#FE2C55] shrink-0'
                            : 'w-4 h-4 text-neutral-500 dark:text-neutral-400 shrink-0'
                        }
                        strokeWidth={1.75}
                      />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className='border-t border-sidebar-border p-2'>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton
                    size='lg'
                    className='data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground'
                  />
                }
              >
                <div className='h-8 w-8 rounded-full overflow-hidden shrink-0 border border-border'>
                  <img
                    src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80'
                    alt='Giang Định'
                    className='h-full w-full object-cover'
                  />
                </div>
                <div className='flex flex-col min-w-0 text-left flex-1'>
                  <span className='truncate text-xs font-semibold text-sidebar-foreground'>
                    Giang Định
                  </span>
                  <span className='truncate text-[10px] text-emerald-500 font-medium'>
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
                          src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80'
                          alt='Giang Định'
                          className='h-full w-full object-cover'
                        />
                      </div>
                      <div className='flex flex-col min-w-0'>
                        <span className='font-semibold text-xs text-foreground'>Giang Định</span>
                        <span className='text-[11px] text-muted-foreground'>@giangdinh</span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => window.open('/@giangdinh', '_blank')}>
                    <Icons.externalLink className='mr-2 h-4 w-4 text-primary' />
                    Ghé tiệm (@giangdinh)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/dashboard/preview')}>
                    <Icons.deviceMobile className='mr-2 h-4 w-4' />
                    Xem trước tiệm
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/dashboard/settings/payment')}>
                    <Icons.qrcode className='mr-2 h-4 w-4' />
                    Cài đặt nhận tiền
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => router.push('/')}>
                    <Icons.world className='mr-2 h-4 w-4' />
                    Trang chủ Tiệm Nhỏ
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => signOut({ redirectUrl: '/' })}
                    className='text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer font-medium'
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
