'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  profileQueryOptions,
  productsQueryOptions,
  paymentConfigQueryOptions
} from '@/features/tiemnho/api/queries';
import { defaultCreatorProfile, defaultPaymentConfig } from '@/constants/mock-tiemnho';
import { LivePreviewContainer } from '../mobile-preview/live-preview-container';
import { Icons } from '@/components/icons';

export function PreviewView() {
  const { data: profile = defaultCreatorProfile, isLoading: loadingProfile } =
    useQuery(profileQueryOptions());
  const { data: products = [], isLoading: loadingProducts } = useQuery(productsQueryOptions());
  const { data: paymentConfig = defaultPaymentConfig, isLoading: loadingPayment } = useQuery(
    paymentConfigQueryOptions()
  );

  const loading = loadingProfile || loadingProducts || loadingPayment;

  if (loading) {
    return (
      <div className='py-24 text-center text-muted-foreground text-xs'>
        <Icons.spinner className='h-6 w-6 animate-spin mx-auto mb-2 text-primary' />
        Đang tải giao diện xem trước...
      </div>
    );
  }

  return (
    <div className='flex flex-col items-center justify-center py-2 w-full'>
      <LivePreviewContainer
        profile={profile}
        products={products}
        paymentConfig={paymentConfig}
        className='w-full'
      />
    </div>
  );
}
