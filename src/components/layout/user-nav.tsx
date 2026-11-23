'use client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { profileQueryOptions } from '@/features/tiemnho/api/queries';
import { logoutAction } from '@/app/actions/auth-actions';

export function UserNav() {
  const router = useRouter();
  const { data: profile } = useQuery(profileQueryOptions());

  const displayName = profile?.displayName || 'Chủ Tiệm';
  const username = profile?.username || 'tiemnho';
  const avatarUrl = profile?.avatarUrl || '/default-avatar.svg';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant='ghost'
            className='relative h-8 w-8 rounded-full overflow-hidden p-0 border border-neutral-200 dark:border-neutral-800'
          />
        }
      >
        <img src={avatarUrl} alt={displayName} className='h-8 w-8 rounded-full object-cover' />
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-56' align='end' sideOffset={10}>
        <DropdownMenuGroup>
          <DropdownMenuLabel className='font-normal'>
            <div className='flex flex-col space-y-1'>
              <p className='text-sm leading-none font-semibold'>{displayName}</p>
              <p className='text-muted-foreground text-xs leading-none'>@{username}</p>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push('/dashboard/settings/storefront')}>
            Thiết kế tiệm
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push('/dashboard/settings/payment')}>
            Cấu hình VietQR
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push('/admin/overview')}>
            Khu vực Quản trị (Admin)
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => logoutAction()}
            className='text-destructive cursor-pointer font-semibold'
          >
            Đăng xuất
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
