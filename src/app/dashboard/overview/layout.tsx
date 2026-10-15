'use client';

import PageContainer from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardFooter
} from '@/components/ui/card';
import { Icons } from '@/components/icons';
import React from 'react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function OverViewLayout({
  sales,
  pie_stats,
  bar_stats,
  area_stats
}: {
  sales: React.ReactNode;
  pie_stats: React.ReactNode;
  bar_stats: React.ReactNode;
  area_stats: React.ReactNode;
}) {
  const [pingLoading, setPingLoading] = React.useState(false);

  const handleQuickPing = async () => {
    setPingLoading(true);
    try {
      const { pingTest } = await import('@/features/tiemnho/api/service');
      const res = await pingTest();
      toast.success(res.message);
    } catch {
      toast.error('Lỗi khi bắn thử Ping Test');
    } finally {
      setPingLoading(false);
    }
  };

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col gap-5'>
        {/* Creator Hero Header */}
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-linear-to-r from-primary/10 via-primary/5 to-card border border-border/70 shadow-xs'>
          <div className='space-y-1'>
            <div className='flex items-center gap-2'>
              <h2 className='text-xl sm:text-2xl font-bold tracking-tight text-foreground'>
                Xin chào, Giang Định 👋
              </h2>
              <Badge variant='default' className='text-[10px] uppercase font-bold tracking-wider'>
                0% Hoa hồng
              </Badge>
            </div>
            <p className='text-xs text-muted-foreground flex items-center gap-1.5'>
              <span>Link Storefront:</span>
              <a
                href='/@giangdinh'
                target='_blank'
                rel='noreferrer'
                className='font-mono font-semibold text-primary hover:underline inline-flex items-center gap-1'
              >
                tiemnho.vn/@giangdinh
                <Icons.externalLink className='h-3 w-3' />
              </a>
            </p>
          </div>

          <div className='flex items-center gap-2 flex-wrap'>
            <Button
              variant='outline'
              size='sm'
              onClick={handleQuickPing}
              disabled={pingLoading}
              className='h-9 text-xs gap-1.5 rounded-xl border-dashed border-primary/50 text-primary hover:bg-primary/5'
            >
              <Icons.bolt className='h-3.5 w-3.5 text-amber-500' />
              {pingLoading ? 'Đang test...' : 'Bắn thử Ping Test'}
            </Button>

            <Link href='/dashboard/preview'>
              <Button variant='outline' size='sm' className='h-9 text-xs gap-1.5 rounded-xl'>
                <Icons.deviceMobile className='h-3.5 w-3.5' />
                Live Preview
              </Button>
            </Link>

            <Link href='/dashboard/products'>
              <Button size='sm' className='h-9 text-xs gap-1.5 rounded-xl font-semibold shadow-xs'>
                <Icons.add className='h-3.5 w-3.5' />
                Đăng sản phẩm mới
              </Button>
            </Link>
          </div>
        </div>

        {/* 4 Metric KPI Cards */}
        <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs sm:grid-cols-2 lg:grid-cols-4'>
          {/* Card 1: Doanh thu thực nhận */}
          <Card className='@container/card border-border'>
            <CardHeader className='pb-2'>
              <CardDescription className='text-xs font-medium'>
                Doanh thu thực nhận (100%)
              </CardDescription>
              <CardTitle className='text-2xl font-bold tabular-nums text-foreground'>
                1.464.000 đ
              </CardTitle>
              <CardAction>
                <Badge
                  variant='outline'
                  className='bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs font-semibold'
                >
                  <Icons.check className='h-3 w-3' />
                  No Escrow
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1 text-xs pt-1'>
              <div className='flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400'>
                <Icons.trendingUp className='h-3.5 w-3.5' />
                +24.8% tuần này
              </div>
              <div className='text-muted-foreground text-[11px]'>
                Tiền về thẳng tài khoản MB Bank
              </div>
            </CardFooter>
          </Card>

          {/* Card 2: Đơn hàng VietQR */}
          <Card className='@container/card border-border'>
            <CardHeader className='pb-2'>
              <CardDescription className='text-xs font-medium'>
                Đơn hàng VietQR thành công
              </CardDescription>
              <CardTitle className='text-2xl font-bold tabular-nums text-foreground'>
                18 đơn
              </CardTitle>
              <CardAction>
                <Badge variant='outline' className='text-xs font-medium'>
                  100% tự động
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1 text-xs pt-1'>
              <div className='flex items-center gap-1.5 font-medium text-primary'>
                <Icons.qrcode className='h-3.5 w-3.5' />
                Xác thực Napas 247 tức thì
              </div>
              <div className='text-muted-foreground text-[11px]'>
                Tự động phát tài nguyên sau 2s
              </div>
            </CardFooter>
          </Card>

          {/* Card 3: Khách hàng & Leads */}
          <Card className='@container/card border-border'>
            <CardHeader className='pb-2'>
              <CardDescription className='text-xs font-medium'>
                Khách hàng & Leads tiềm năng
              </CardDescription>
              <CardTitle className='text-2xl font-bold tabular-nums text-foreground'>
                53 leads
              </CardTitle>
              <CardAction>
                <Badge
                  variant='outline'
                  className='bg-primary/10 text-primary border-primary/20 text-xs'
                >
                  +12 mới
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1 text-xs pt-1'>
              <div className='flex items-center gap-1.5 font-medium text-foreground'>
                <Icons.fileSpreadsheet className='h-3.5 w-3.5' />
                Sẵn sàng xuất CSV marketing
              </div>
              <div className='text-muted-foreground text-[11px]'>
                Đã lưu đầy đủ Email & Số điện thoại
              </div>
            </CardFooter>
          </Card>

          {/* Card 4: Trạng thái Webhook */}
          <Card className='@container/card border-border'>
            <CardHeader className='pb-2'>
              <CardDescription className='text-xs font-medium'>
                Cổng nhận tiền MB Bank
              </CardDescription>
              <CardTitle className='text-2xl font-bold tabular-nums text-foreground'>
                Hoạt động
              </CardTitle>
              <CardAction>
                <Badge
                  variant='outline'
                  className='bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs gap-1'
                >
                  <span className='h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse' />
                  Live 24/7
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1 text-xs pt-1'>
              <div className='font-mono text-[11px] text-muted-foreground truncate'>
                STK: 0988667788 (payOS)
              </div>
              <div className='text-muted-foreground text-[11px]'>
                Lần kiểm tra gần nhất: Vừa xong
              </div>
            </CardFooter>
          </Card>
        </div>

        {/* Charts & Recent Orders */}
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7'>
          <div className='col-span-4'>{area_stats}</div>
          <div className='col-span-4 md:col-span-3'>{sales}</div>
          <div className='col-span-4'>{bar_stats}</div>
          <div className='col-span-4 min-h-0 md:col-span-3'>{pie_stats}</div>
        </div>
      </div>
    </PageContainer>
  );
}
