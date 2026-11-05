import * as React from 'react';
import { cn } from '@/lib/utils';

export function DefaultAvatar({ className }: { className?: string }) {
  return (
    <svg
      viewBox='0 0 168 168'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      className={cn('w-full h-full shrink-0 select-none', className)}
      aria-label='Default Avatar'
    >
      <rect width='168' height='168' className='fill-[#E4E6EB] dark:fill-[#3A3B3C]' />
      <path
        d='M84 32C68.536 32 56 44.536 56 60C56 75.464 68.536 88 84 88C99.464 88 112 75.464 112 60C112 44.536 99.464 32 84 32Z'
        className='fill-[#8A8D91] dark:fill-[#B0B3B8]'
      />
      <path
        d='M84 98C61.909 98 42.667 112.569 36.85 133.228C49.197 146.544 65.626 155 84 155C102.374 155 118.803 146.544 131.15 133.228C125.333 112.569 106.091 98 84 98Z'
        className='fill-[#8A8D91] dark:fill-[#B0B3B8]'
      />
    </svg>
  );
}

export const DEFAULT_AVATAR_URL = '/default-avatar.svg';
