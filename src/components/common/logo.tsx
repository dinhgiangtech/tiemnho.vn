import React from 'react';
import Link from 'next/link';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  showIconBadge?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  href = '/dashboard/overview',
  showIconBadge = true
}) => {
  const sizeMap = {
    sm: {
      svgSize: 24,
      textSize: 'text-[15px]',
      dotSize: 'w-1.5 h-1.5',
      gap: 'gap-2'
    },
    md: {
      svgSize: 28,
      textSize: 'text-[18px]',
      dotSize: 'w-2 h-2',
      gap: 'gap-2.5'
    },
    lg: {
      svgSize: 34,
      textSize: 'text-[22px]',
      dotSize: 'w-2.5 h-2.5',
      gap: 'gap-3'
    }
  };

  const currentSize = sizeMap[size];

  // Vector SVG túi mua sắm nguyên bản (không chứa chữ 't' bên trong):
  // - Quai túi uốn cong hình vòm cao
  // - Thân túi hình thang phẳng màu đen
  // - Hai khoen móc chữ U đục lỗ bo tròn miệng túi
  const OriginalBagIcon = (
    <svg
      width={currentSize.svgSize}
      height={currentSize.svgSize}
      viewBox='0 0 100 100'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      className='shrink-0 transition-transform duration-200 group-hover:scale-105'
    >
      {/* 1. Quai túi uốn cong hình vòm cao */}
      <path
        d='M34 26V20C34 11.16 41.16 4 50 4C58.84 4 66 11.16 66 20V26'
        stroke='#161823'
        className='stroke-[#161823] dark:stroke-neutral-100'
        strokeWidth='8'
        strokeLinecap='round'
      />

      {/* 2. Thân túi mua sắm hình thang màu đen */}
      <path
        d='M14 26H86L94 100H6L14 26Z'
        fill='#161823'
        className='fill-[#161823] dark:fill-neutral-100'
      />

      {/* 3. Hai khoen móc chữ U đục lỗ bo tròn miệng túi */}
      <path
        d='M30 26V36C30 38.2 31.8 40 34 40C36.2 40 38 38.2 38 36V26'
        stroke='white'
        className='stroke-white dark:stroke-zinc-900'
        strokeWidth='8'
        strokeLinecap='round'
      />
      <path
        d='M62 26V36C62 38.2 63.8 40 66 40C68.2 40 70 38.2 70 36V26'
        stroke='white'
        className='stroke-white dark:stroke-zinc-900'
        strokeWidth='8'
        strokeLinecap='round'
      />
    </svg>
  );

  const content = (
    <div
      className={`inline-flex items-center ${currentSize.gap} select-none group transition-opacity duration-200 hover:opacity-85 ${className}`}
    >
      {/* Icon túi mua sắm nguyên bản */}
      {showIconBadge && OriginalBagIcon}

      {/* Cụm chữ Wordmark 'tiệm nhỏ.' */}
      <div className='flex items-baseline tracking-[-0.035em]'>
        <span
          className={`${currentSize.textSize} font-extrabold text-[#161823] dark:text-neutral-100 leading-none`}
        >
          tiệm nhỏ
        </span>
        <span
          className={`inline-block ${currentSize.dotSize} rounded-full bg-[#FE2C55] ml-[3px] shrink-0 self-baseline`}
        />
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className='inline-flex items-center focus:outline-none'>
        {content}
      </Link>
    );
  }

  return content;
};

export default Logo;
