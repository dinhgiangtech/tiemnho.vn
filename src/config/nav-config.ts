import { NavGroup } from '@/types';

export const navGroups: NavGroup[] = [
  {
    label: 'Cửa hàng & Vận hành',
    items: [
      {
        title: 'Tổng quan',
        url: '/dashboard/overview',
        icon: 'dashboard',
        shortcut: ['t', 'q'],
        isActive: false,
        items: []
      },
      {
        title: 'Tiệm của bạn',
        url: '/dashboard/products',
        icon: 'store',
        shortcut: ['t', 'b'],
        isActive: false,
        items: []
      },
      {
        title: 'Thiết kế tiệm',
        url: '/dashboard/settings/storefront',
        icon: 'palette',
        shortcut: ['t', 'k'],
        isActive: false,
        items: []
      },
      {
        title: 'Đơn hàng',
        url: '/dashboard/orders',
        icon: 'shoppingBag',
        shortcut: ['d', 'h'],
        isActive: false,
        items: []
      },
      {
        title: 'Khách hàng',
        url: '/dashboard/customers',
        icon: 'users',
        shortcut: ['k', 'h'],
        isActive: false,
        items: []
      },
      {
        title: 'Nhận tiền QR',
        url: '/dashboard/settings',
        icon: 'qrcode',
        shortcut: ['q', 'r'],
        isActive: false,
        items: []
      }
    ]
  }
];
