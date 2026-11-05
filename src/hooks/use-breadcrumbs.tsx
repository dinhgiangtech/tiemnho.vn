'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useMemo } from 'react';

type BreadcrumbItem = {
  title: string;
  link: string;
};

// Từ điển chuyển đổi các phân đoạn đường dẫn sang Tiếng Việt
const SEGMENT_TRANSLATIONS: Record<string, string> = {
  dashboard: 'Tổng quan',
  overview: 'Báo cáo',
  products: 'Tiệm của bạn',
  product: 'Sản phẩm',
  create: 'Tạo sản phẩm mới',
  edit: 'Chỉnh sửa sản phẩm',
  orders: 'Đơn hàng',
  leads: 'Khách hàng',
  customers: 'Khách hàng',
  workspaces: 'Không gian làm việc',
  settings: 'Nhận tiền QR',
  storefront: 'Thiết kế tiệm',
  payment: 'Nhận tiền QR',
  payout: 'Nhận tiền QR',
  kanban: 'Bảng công việc',
  chat: 'Tin nhắn',
  'ai-chat': 'Trợ lý AI',
  profile: 'Hồ sơ cá nhân',
  billing: 'Gói dịch vụ',
  forms: 'Biểu mẫu',
  users: 'Người dùng',
  preview: 'Xem trước tiệm',
  exclusive: 'Đặc quyền',
  notifications: 'Thông báo',
  elements: 'Thành phần',
  icons: 'Biểu tượng',
  'react-query': 'React Query'
};

const routeMapping: Record<string, BreadcrumbItem[]> = {
  '/dashboard': [{ title: 'Tổng quan', link: '/dashboard/overview' }],
  '/dashboard/overview': [{ title: 'Tổng quan', link: '/dashboard/overview' }],
  '/dashboard/products': [
    { title: 'Tổng quan', link: '/dashboard/overview' },
    { title: 'Tiệm của bạn', link: '/dashboard/products' }
  ],
  '/dashboard/orders': [
    { title: 'Tổng quan', link: '/dashboard/overview' },
    { title: 'Đơn hàng', link: '/dashboard/orders' }
  ],
  '/dashboard/leads': [
    { title: 'Tổng quan', link: '/dashboard/overview' },
    { title: 'Khách hàng', link: '/dashboard/customers' }
  ],
  '/dashboard/customers': [
    { title: 'Tổng quan', link: '/dashboard/overview' },
    { title: 'Khách hàng', link: '/dashboard/customers' }
  ],
  '/dashboard/settings/storefront': [
    { title: 'Tổng quan', link: '/dashboard/overview' },
    { title: 'Cài đặt', link: '/dashboard/settings/storefront' },
    { title: 'Thiết kế tiệm', link: '/dashboard/settings/storefront' }
  ],
  '/dashboard/settings': [
    { title: 'Tổng quan', link: '/dashboard/overview' },
    { title: 'Nhận tiền QR', link: '/dashboard/settings' }
  ],
  '/dashboard/settings/payment': [
    { title: 'Tổng quan', link: '/dashboard/overview' },
    { title: 'Nhận tiền QR', link: '/dashboard/settings' }
  ],
  '/dashboard/settings/payout': [
    { title: 'Tổng quan', link: '/dashboard/overview' },
    { title: 'Cài đặt', link: '/dashboard/settings/payment' },
    { title: 'Cài đặt nhận tiền', link: '/dashboard/settings/payment' }
  ]
};

export function useBreadcrumbs() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const breadcrumbs = useMemo(() => {
    // Custom check cho trang tạo / chỉnh sửa sản phẩm
    if (pathname === '/dashboard/products/create') {
      const isEditing =
        searchParams.get('id') || searchParams.get('edit') || searchParams.get('productId');
      return [
        { title: 'Tổng quan', link: '/dashboard/overview' },
        { title: 'Tiệm của bạn', link: '/dashboard/products' },
        {
          title: isEditing ? 'Chỉnh sửa sản phẩm' : 'Tạo sản phẩm mới',
          link: pathname
        }
      ];
    }

    // Kiểm tra custom route mapping nếu có
    if (routeMapping[pathname]) {
      return routeMapping[pathname];
    }

    // Tự động phân tách và dịch sang Tiếng Việt
    const segments = pathname.split('/').filter(Boolean);
    return segments.map((segment, index) => {
      const path = `/${segments.slice(0, index + 1).join('/')}`;
      const lower = segment.toLowerCase();
      const translated =
        SEGMENT_TRANSLATIONS[lower] || segment.charAt(0).toUpperCase() + segment.slice(1);

      return {
        title: translated,
        link: path === '/dashboard' ? '/dashboard/overview' : path
      };
    });
  }, [pathname, searchParams]);

  return breadcrumbs;
}
