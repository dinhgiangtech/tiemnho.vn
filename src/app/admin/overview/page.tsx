import { getAdminOverview } from '@/features/admin/api/admin.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Store,
  ShoppingBag,
  DollarSign,
  ArrowUpRight,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Tổng quan sàn | Super Admin'
};

export default async function AdminOverviewPage() {
  const data = await getAdminOverview();

  const stats = [
    {
      title: 'Tổng Doanh Thu Sàn (GMV)',
      value: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
        data.totalGMV
      ),
      desc: `${data.paidOrdersCount} đơn thanh toán thành công`,
      icon: DollarSign,
      color: 'text-emerald-500'
    },
    {
      title: 'Tổng Nhà Sáng Tạo (Creators)',
      value: data.totalCreators.toString(),
      desc: 'Đang hoạt động trên sàn',
      icon: Users,
      color: 'text-blue-500'
    },
    {
      title: 'Tổng Sản Phẩm Toàn Sàn',
      value: data.totalProducts.toString(),
      desc: 'Tài liệu số, Khóa học, Physical',
      icon: Store,
      color: 'text-purple-500'
    },
    {
      title: 'Tổng Giao Dịch',
      value: data.totalOrders.toString(),
      desc: `payOS: ${data.payosCount} | VietQR: ${data.vietqrCount}`,
      icon: ShoppingBag,
      color: 'text-amber-500'
    }
  ];

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>Tổng quan sàn Tiệm Nhỏ</h1>
          <p className='text-sm text-muted-foreground'>
            Báo cáo tăng trưởng, doanh thu và lưu lượng toàn hệ thống theo thời gian thực.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} className='rounded-xl border shadow-xs'>
              <CardHeader className='flex flex-row items-center justify-between pb-2'>
                <CardTitle className='text-sm font-medium text-muted-foreground'>
                  {stat.title}
                </CardTitle>
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{stat.value}</div>
                <p className='text-xs text-muted-foreground mt-1'>{stat.desc}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className='grid gap-6 md:grid-cols-2'>
        {/* Creators mới gia nhập */}
        <Card className='rounded-xl border shadow-xs'>
          <CardHeader className='flex flex-row items-center justify-between pb-3'>
            <div>
              <CardTitle className='text-base font-semibold'>Creators Mới Nhất</CardTitle>
              <CardDescription className='text-xs'>
                Các chủ tiệm vừa đăng ký hệ thống
              </CardDescription>
            </div>
            <Link
              href='/admin/creators'
              className='text-xs text-primary hover:underline flex items-center gap-1 font-medium'
            >
              Xem tất cả <ArrowUpRight className='w-3 h-3' />
            </Link>
          </CardHeader>
          <CardContent className='space-y-3'>
            {data.topCreators.length === 0 ? (
              <p className='text-xs text-muted-foreground py-4 text-center'>Chưa có creator nào</p>
            ) : (
              data.topCreators.map((creator) => (
                <div
                  key={creator.id}
                  className='flex items-center justify-between p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors'
                >
                  <div className='flex items-center gap-3 min-w-0'>
                    <div className='w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden'>
                      {creator.avatarUrl ? (
                        <img
                          src={creator.avatarUrl}
                          alt=''
                          className='w-full h-full object-cover'
                        />
                      ) : (
                        creator.displayName?.charAt(0) || 'C'
                      )}
                    </div>
                    <div className='min-w-0'>
                      <div className='flex items-center gap-1.5'>
                        <span className='font-semibold text-xs truncate'>
                          {creator.displayName}
                        </span>
                        {creator.verified && (
                          <Badge
                            variant='outline'
                            className='text-[10px] px-1 py-0 h-4 border-emerald-500 text-emerald-600 bg-emerald-50'
                          >
                            Tick xanh
                          </Badge>
                        )}
                      </div>
                      <span className='text-[11px] text-muted-foreground font-mono truncate block'>
                        @{creator.username} • {creator._count.products} sản phẩm •{' '}
                        {creator._count.orders} đơn
                      </span>
                    </div>
                  </div>
                  <Link
                    href={`/@${creator.username}`}
                    target='_blank'
                    className='text-xs text-muted-foreground hover:text-foreground shrink-0 px-2 py-1 rounded bg-background border'
                  >
                    Xem tiệm
                  </Link>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Đơn hàng mới phát sinh */}
        <Card className='rounded-xl border shadow-xs'>
          <CardHeader className='flex flex-row items-center justify-between pb-3'>
            <div>
              <CardTitle className='text-base font-semibold'>Đơn Hàng Gần Đây</CardTitle>
              <CardDescription className='text-xs'>
                Giao dịch phát sinh trên toàn hệ thống
              </CardDescription>
            </div>
            <Link
              href='/admin/orders'
              className='text-xs text-primary hover:underline flex items-center gap-1 font-medium'
            >
              Xem tất cả <ArrowUpRight className='w-3 h-3' />
            </Link>
          </CardHeader>
          <CardContent className='space-y-3'>
            {data.recentOrders.length === 0 ? (
              <p className='text-xs text-muted-foreground py-4 text-center'>Chưa có đơn hàng nào</p>
            ) : (
              data.recentOrders.map((order) => (
                <div
                  key={order.id}
                  className='flex items-center justify-between p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors'
                >
                  <div className='min-w-0'>
                    <div className='flex items-center gap-2'>
                      <span className='font-mono font-bold text-xs'>#{order.orderCode}</span>
                      <Badge
                        variant='secondary'
                        className={`text-[10px] px-1.5 py-0 h-4 ${
                          order.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {order.status === 'PAID' ? 'Đã TT' : 'Chờ TT'}
                      </Badge>
                    </div>
                    <p className='text-xs text-muted-foreground truncate mt-0.5'>
                      {order.product?.title || 'Sản phẩm'} • Shop: @
                      {order.user?.username || 'tiemnho'}
                    </p>
                  </div>
                  <div className='text-right shrink-0'>
                    <div className='font-bold text-xs text-foreground'>
                      {new Intl.NumberFormat('vi-VN').format(order.amount)} đ
                    </div>
                    <span className='text-[10px] text-muted-foreground'>
                      {order.paymentMethod === 'PAYOS' ? 'payOS' : 'VietQR'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
