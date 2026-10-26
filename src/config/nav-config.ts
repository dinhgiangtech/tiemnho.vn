import { NavGroup } from '@/types';

export const navGroups: NavGroup[] = [
  {
    label: 'Cửa hàng & Vận hành',
    items: [
      {
        title: 'Home',
        url: '/dashboard/overview',
        icon: 'dashboard',
        isActive: false,
        shortcut: ['h', 'h'],
        items: []
      },
      {
        title: 'My Store',
        url: '/dashboard/products',
        icon: 'store',
        shortcut: ['m', 's'],
        isActive: false,
        items: []
      },
      {
        title: 'Income',
        url: '/dashboard/orders',
        icon: 'receipt',
        shortcut: ['i', 'n'],
        isActive: false,
        items: []
      },
      {
        title: 'Customers',
        url: '/dashboard/leads',
        icon: 'users',
        shortcut: ['c', 'u'],
        isActive: false,
        items: []
      },
      {
        title: 'Live Preview',
        url: '/dashboard/preview',
        icon: 'smartphone',
        shortcut: ['p', 'v'],
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
        icon: 'home',
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
