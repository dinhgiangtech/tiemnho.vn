'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { useQuery } from '@tanstack/react-query';
import { ordersQueryOptions } from '@/features/tiemnho/api/queries';

const fallbackRecentOrders = [
  {
    name: 'Nguyễn Văn An',
    email: 'vanan.nguyen@gmail.com',
    product: 'Kho Template Notion (PARA System)',
    code: 'TN10823',
    fallback: 'NA',
    amount: '+149.000 đ',
    status: 'PAID'
  },
  {
    name: 'Trần Thị Mai',
    email: 'maitt.designer@gmail.com',
    product: 'Sổ Tay Lập Kế Hoạch 90 Ngày',
    code: 'TN10824',
    fallback: 'TM',
    amount: '+189.000 đ',
    status: 'PAID'
  },
  {
    name: 'Lê Hoàng Nam',
    email: 'namle.developer@gmail.com',
    product: 'Kho Template Notion (PARA System)',
    code: 'TN10825',
    fallback: 'HN',
    amount: '+149.000 đ',
    status: 'PAID'
  }
];

export function RecentSales() {
  const { data: realOrders = [] } = useQuery(ordersQueryOptions());

  const displayOrders =
    realOrders.length > 0
      ? realOrders.slice(0, 5).map((o) => {
          const initials =
            o.customerName
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(-2)
              .toUpperCase() || 'KH';
          const formattedAmount =
            o.amount === 0
              ? '0 đ (Quà tặng)'
              : `+${new Intl.NumberFormat('vi-VN').format(o.amount)} đ`;
          return {
            name: o.customerName,
            email: o.customerEmail,
            product: o.productTitle,
            code: o.orderCode,
            fallback: initials,
            amount: formattedAmount,
            status: o.status
          };
        })
      : fallbackRecentOrders;

  return (
    <Card className='h-full border border-border shadow-xs'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle className='text-base font-semibold'>Giao dịch VietQR gần nhất</CardTitle>
            <CardDescription className='text-xs'>
              Tất cả tiền đã chuyển thẳng 100% vào tài khoản MB Bank của bạn.
            </CardDescription>
          </div>
          <Badge
            variant='outline'
            className='bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs gap-1'
          >
            <Icons.check className='h-3 w-3' />
            0% Phí sàn
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {displayOrders.map((sale, index) => (
            <div
              key={index}
              className='flex items-center justify-between p-2 rounded-xl hover:bg-muted/50 transition-colors'
            >
              <div className='flex items-center gap-3 min-w-0'>
                <Avatar className='h-9 w-9 border border-border'>
                  <AvatarFallback className='text-xs font-semibold bg-primary/10 text-primary'>
                    {sale.fallback}
                  </AvatarFallback>
                </Avatar>
                <div className='space-y-0.5 min-w-0'>
                  <div className='flex items-center gap-1.5'>
                    <p className='text-xs font-semibold leading-none text-foreground truncate'>
                      {sale.name}
                    </p>
                    <span className='font-mono text-[10px] text-muted-foreground'>
                      [{sale.code}]
                    </span>
                  </div>
                  <p className='text-[11px] text-muted-foreground truncate max-w-[180px]'>
                    {sale.product}
                  </p>
                </div>
              </div>
              <div className='text-right shrink-0'>
                <div className='text-xs font-bold text-foreground'>{sale.amount}</div>
                <Badge
                  variant='secondary'
                  className={`text-[9px] px-1 py-0 mt-0.5 ${
                    sale.status === 'PAID'
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : 'bg-primary/10 text-primary'
                  }`}
                >
                  {sale.status === 'PAID' ? 'Đã nhận tiền' : 'Quà 0đ'}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
