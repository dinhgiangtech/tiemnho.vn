'use client';

import * as React from 'react';
import { CreatorProfile, Product, PaymentConfig } from '@/constants/mock-tiemnho';
import { StorefrontView } from '../storefront/storefront-view';
import { TikTokStorefrontView } from '../storefront/tiktok-storefront-view';

interface PhoneMockupProps {
  profile: CreatorProfile;
  products: Product[];
  paymentConfig: PaymentConfig;
  className?: string;
}

export function PhoneMockup({ profile, products, paymentConfig, className }: PhoneMockupProps) {
  return (
    <div className={`relative mx-auto flex justify-center select-none ${className || ''}`}>
      {/* Device Frame */}
      <div className='relative w-[340px] sm:w-[370px] h-[720px] rounded-[52px] p-3.5 bg-zinc-950 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.15)] ring-1 ring-zinc-800 ring-offset-2 ring-offset-background'>
        {/* Buttons on Side */}
        <div className='absolute -left-[3px] top-[120px] h-8 w-[3px] rounded-l-sm bg-zinc-700' />
        <div className='absolute -left-[3px] top-[165px] h-12 w-[3px] rounded-l-sm bg-zinc-700' />
        <div className='absolute -left-[3px] top-[225px] h-12 w-[3px] rounded-l-sm bg-zinc-700' />
        <div className='absolute -right-[3px] top-[170px] h-16 w-[3px] rounded-r-sm bg-zinc-700' />

        {/* Screen Glass */}
        <div className='relative h-full w-full overflow-hidden rounded-[40px] bg-background border border-border/40 flex flex-col'>
          {/* iOS Status Bar */}
          <div className='relative z-30 flex h-10 w-full shrink-0 items-center justify-between px-6 pt-1 text-[11px] font-semibold text-foreground/80'>
            <span>9:41</span>
            {/* Dynamic Island */}
            <div className='absolute left-1/2 top-2.5 h-4 w-20 -translate-x-1/2 rounded-full bg-black shadow-xs' />
            <div className='flex items-center gap-1.5'>
              <svg className='h-3 w-3 fill-current' viewBox='0 0 24 24'>
                <path d='M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L12 22l7.03-4.39C20.26 16.07 21 14.12 21 12c0-4.97-4.03-9-9-9z' />
              </svg>
              <div className='h-2.5 w-5 rounded-xs border border-current p-0.5'>
                <div className='h-full w-full rounded-2xs bg-current' />
              </div>
            </div>
          </div>

          {/* Interactive Storefront Scroll Container */}
          <div className='flex-1 overflow-y-auto overscroll-contain scrollbar-none'>
            {profile.theme === 'tiktok' ? (
              <TikTokStorefrontView
                profile={profile}
                products={products}
                paymentConfig={paymentConfig}
                isPreview={true}
              />
            ) : (
              <StorefrontView
                profile={profile}
                products={products}
                paymentConfig={paymentConfig}
                isPreview={true}
              />
            )}
          </div>

          {/* iOS Home Indicator Bar */}
          <div className='relative z-30 flex h-5 w-full shrink-0 items-center justify-center pb-1'>
            <div className='h-1 w-32 rounded-full bg-foreground/30' />
          </div>
        </div>
      </div>
    </div>
  );
}
