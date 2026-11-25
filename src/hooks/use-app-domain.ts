'use client';

import * as React from 'react';
import { getAppDomain } from '@/lib/utils';

/**
 * Hook lấy tên miền hiển thị cho ứng dụng
 * Ưu tiên:
 * 1. window.location.host khi chạy trên trình duyệt (client-side)
 * 2. NEXT_PUBLIC_APP_URL từ biến môi trường (.env)
 * 3. Fallback: 'tiemnho.shop'
 */
export function useAppDomain(): string {
  const [domain, setDomain] = React.useState<string>(() => getAppDomain());

  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.location.host) {
      setDomain(window.location.host);
    }
  }, []);

  return domain;
}
