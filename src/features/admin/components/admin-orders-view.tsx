'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import Link from 'next/link';
import { TablePagination } from '@/components/ui/table-pagination';

export interface OrderItem {
  id: string;
  orderCode: string;
  amount: number;
  status: string;
  paymentMethod: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  createdAt: Date;
  product: {
    id: string;
    title: string;
    type: string;
    coverImage: string | null;
  } | null;
  user: {
    id: string;
    displayName: string | null;
    username: string | null;
  } | null;
}

export function AdminOrdersView({ initialOrders }: { initialOrders: OrderItem[] }) {
  const [orders, setOrders] = React.useState<OrderItem[]>(initialOrders);
  const [searchTerm, setSearchTerm] = React.useState('');

  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  const filtered = React.useMemo(() => {
    if (!searchTerm.trim()) return orders;
    const s = searchTerm.toLowerCase();
    return orders.filter(
      (o) =>
        o.orderCode.toLowerCase().includes(s) ||
        o.customerEmail.toLowerCase().includes(s) ||
        o.customerName.toLowerCase().includes(s) ||
        (o.user && o.user.username && o.user.username.toLowerCase().includes(s))
    );
  }, [orders, searchTerm]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedOrders = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filtered.slice(startIndex, startIndex + pageSize);
  }, [filtered, currentPage, pageSize]);

  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>Toàn bộ Đơn hàng & Giao dịch</h1>
          <p className='text-sm text-muted-foreground'>
            Tra cứu dòng tiền, đối soát giao dịch payOS và VietQR trên toàn sàn.
          </p>
        </div>
        <div className='relative w-full sm:w-72'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder='Tìm mã đơn, email, người mua...'
            className='pl-9 h-9 text-xs rounded-lg'
          />
        </div>
      </div>

      <Card className='rounded-xl border shadow-xs'>
        <CardContent className='p-0'>
          <div className='overflow-x-auto'>
            <table className='w-full text-left text-xs'>
              <thead className='bg-muted/50 border-b text-muted-foreground uppercase tracking-wider font-semibold'>
                <tr>
                  <th className='py-3 px-4'>Mã đơn</th>
                  <th className='py-3 px-4'>Khách mua</th>
                  <th className='py-3 px-4'>Sản phẩm</th>
                  <th className='py-3 px-4'>Shop</th>
                  <th className='py-3 px-4'>Số tiền</th>
                  <th className='py-3 px-4'>Cổng TT</th>
                  <th className='py-3 px-4 text-center'>Trạng thái</th>
                  <th className='py-3 px-4 text-right'>Thời gian</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-border'>
                {paginatedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className='py-8 text-center text-muted-foreground'>
                      Không tìm thấy đơn hàng nào
                    </td>
                  </tr>
                ) : (
                  paginatedOrders.map((order) => (
                    <tr key={order.id} className='hover:bg-muted/20 transition-colors'>
                      <td className='py-3.5 px-4 font-mono font-bold text-foreground'>
                        #{order.orderCode}
                      </td>

                      <td className='py-3.5 px-4'>
                        <div className='font-semibold text-foreground'>{order.customerName}</div>
                        <div className='text-[11px] text-muted-foreground font-mono'>
                          {order.customerEmail}
                        </div>
                      </td>

                      <td className='py-3.5 px-4'>
                        <span className='font-medium text-foreground line-clamp-1 max-w-[180px]'>
                          {order.product?.title || 'Sản phẩm'}
                        </span>
                      </td>

                      <td className='py-3.5 px-4'>
                        <Link
                          href={`/@${order.user?.username}`}
                          target='_blank'
                          className='text-primary hover:underline font-medium'
                        >
                          @{order.user?.username || 'tiemnho'}
                        </Link>
                      </td>

                      <td className='py-3.5 px-4 font-bold text-foreground'>
                        {new Intl.NumberFormat('vi-VN').format(order.amount)} đ
                      </td>

                      <td className='py-3.5 px-4'>
                        <Badge
                          variant='outline'
                          className={`text-[10px] font-mono ${
                            order.paymentMethod === 'PAYOS'
                              ? 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-950/20'
                              : 'border-purple-500 text-purple-600 bg-purple-50 dark:bg-purple-950/20'
                          }`}
                        >
                          {order.paymentMethod === 'PAYOS' ? 'payOS' : 'VietQR'}
                        </Badge>
                      </td>

                      <td className='py-3.5 px-4 text-center'>
                        <Badge
                          className={`text-[10px] ${
                            order.status === 'PAID'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {order.status === 'PAID' ? 'Thành công' : 'Chờ xử lý'}
                        </Badge>
                      </td>

                      <td className='py-3.5 px-4 text-right text-muted-foreground'>
                        {new Date(order.createdAt).toLocaleString('vi-VN')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>

        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={filtered.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
        />
      </Card>
    </div>
  );
}
