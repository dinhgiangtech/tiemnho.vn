import { NavGroup } from '@/types';

export const navGroups: NavGroup[] = [
  {
    label: 'Cửa hàng & Vận hành',
    items: [
      {
        title: 'Tổng quan',
        url: '/dashboard/overview',
        icon: 'dashboard',
        isActive: false,
        shortcut: ['t', 'q'],
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
        title: 'Doanh thu',
        url: '/dashboard/orders',
        icon: 'receipt',
        shortcut: ['d', 't'],
        isActive: false,
        items: []
      },
      {
        title: 'Danh bạ khách',
        url: '/dashboard/leads',
        icon: 'users',
        shortcut: ['d', 'b'],
        isActive: false,
        items: []
      },
      {
        title: 'Xem trước tiệm',
        url: '/dashboard/preview',
        icon: 'smartphone',
        shortcut: ['x', 't'],
        isActive: false,
        items: []
      }
    ]
  },
  {
    label: 'Cài đặt Nền tảng',
    items: [
      {
        title: 'Cài đặt nhận tiền',
        url: '/dashboard/settings/payment',
        icon: 'qrcode',
        shortcut: ['n', 't'],
        isActive: false,
        items: []
      },
      {
        title: 'Cài đặt tài khoản',
        url: '/dashboard/settings/storefront',
        icon: 'palette',
        shortcut: ['t', 'k'],
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
        title: 'Ghé tiệm (@giangdinh)',
        url: '/@giangdinh',
        icon: 'externalLink',
        isActive: false,
        items: []
      }
    ]
  }
];
