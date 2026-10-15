import { NavGroup } from '@/types';

export const navGroups: NavGroup[] = [
  {
    label: 'Kinh doanh & Vận hành',
    items: [
      {
        title: 'Tổng quan',
        url: '/dashboard/overview',
        icon: 'dashboard',
        isActive: false,
        shortcut: ['o', 'o'],
        items: []
      },
      {
        title: 'Sản phẩm',
        url: '/dashboard/products',
        icon: 'product',
        shortcut: ['p', 'p'],
        isActive: false,
        items: []
      },
      {
        title: 'Đơn hàng',
        url: '/dashboard/orders',
        icon: 'receipt',
        shortcut: ['d', 'd'],
        isActive: false,
        items: []
      },
      {
        title: 'Khách hàng & Leads',
        url: '/dashboard/leads',
        icon: 'teams',
        shortcut: ['l', 'l'],
        isActive: false,
        items: []
      },
      {
        title: 'Live Mobile Preview',
        url: '/dashboard/preview',
        icon: 'deviceMobile',
        shortcut: ['m', 'm'],
        isActive: false,
        items: []
      }
    ]
  },
  {
    label: 'Cài đặt Nền tảng',
    items: [
      {
        title: 'Nhận tiền VietQR',
        url: '/dashboard/settings/payment',
        icon: 'qrcode',
        shortcut: ['q', 'q'],
        isActive: false,
        items: []
      },
      {
        title: 'Hồ sơ Storefront',
        url: '/dashboard/settings/storefront',
        icon: 'palette',
        shortcut: ['s', 's'],
        isActive: false,
        items: []
      }
    ]
  },
  {
    label: 'Liên kết ngoài',
    items: [
      {
        title: 'Trang chủ Tiệm Nhỏ',
        url: '/',
        icon: 'world',
        isActive: false,
        items: []
      },
      {
        title: 'Xem Bio (@giangdinh)',
        url: '/@giangdinh',
        icon: 'externalLink',
        isActive: false,
        items: []
      }
    ]
  }
];
