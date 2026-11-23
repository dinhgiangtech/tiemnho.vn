import { NavItem } from '@/types';

export interface AdminNavGroup {
  label: string;
  items: NavItem[];
}

export const adminNavGroups: AdminNavGroup[] = [
  {
    label: 'Hệ thống & Vận hành sàn',
    items: [
      {
        title: 'Tổng quan sàn',
        url: '/admin/overview',
        icon: 'dashboard',
        shortcut: ['a', 'o'],
        isActive: false,
        items: []
      },
      {
        title: 'Quản lý Creators',
        url: '/admin/creators',
        icon: 'users',
        shortcut: ['a', 'c'],
        isActive: false,
        items: []
      },
      {
        title: 'Kiểm duyệt Sản phẩm',
        url: '/admin/products',
        icon: 'store',
        shortcut: ['a', 'p'],
        isActive: false,
        items: []
      },
      {
        title: 'Giao dịch & Đơn hàng',
        url: '/admin/orders',
        icon: 'shoppingBag',
        shortcut: ['a', 'd'],
        isActive: false,
        items: []
      },
      {
        title: 'Nhật ký & Đối soát',
        url: '/admin/logs',
        icon: 'page',
        shortcut: ['a', 'l'],
        isActive: false,
        items: []
      }
    ]
  }
];
