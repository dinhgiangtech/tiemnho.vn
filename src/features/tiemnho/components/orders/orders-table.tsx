'use client';

import * as React from 'react';
import { Order, OrderStatus, ShippingStatus } from '@/constants/mock-tiemnho';
import { getOrders, updateOrderStatus } from '../../api/service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { Clock, CheckCircle2, Package } from 'lucide-react';
import { toast } from 'sonner';

export function OrdersTable() {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState<string>('ALL');
  const [search, setSearch] = React.useState<string>('');
  const [selectedOrder, setSelectedOrder] = React.useState<Order | null>(null);

  const fetchOrders = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await getOrders();
      setOrders(data);
    } catch {
      toast.error('Lỗi khi tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = React.useMemo(() => {
    return orders
      .filter((o) => {
        if (statusFilter === 'ALL') return true;
        if (statusFilter === 'PHYSICAL_SHIPPING') {
          return (
            o.productType === 'PHYSICAL' && o.status === 'PAID' && o.shippingStatus !== 'COMPLETED'
          );
        }
        return o.status === statusFilter;
      })
      .filter((o) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          o.orderCode.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.customerPhone.toLowerCase().includes(q) ||
          o.customerEmail.toLowerCase().includes(q) ||
          o.productTitle.toLowerCase().includes(q)
        );
      });
  }, [orders, statusFilter, search]);

  const handleUpdateShipping = async (orderId: string, newShippingStatus: ShippingStatus) => {
    try {
      const updated = await updateOrderStatus(orderId, 'PAID', newShippingStatus);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      if (selectedOrder?.id === orderId) setSelectedOrder(updated);
      toast.success(`Đã cập nhật trạng thái giao hàng: ${newShippingStatus}`);
    } catch {
      toast.error('Không thể cập nhật trạng thái');
    }
  };

  // Core Requirement: Xuất Excel / CSV để gửi bưu cục
  const handleExportCsv = () => {
    if (orders.length === 0) {
      toast.error('Không có dữ liệu đơn hàng để xuất');
      return;
    }

    const headers = [
      'Mã đơn hàng',
      'Ngày tạo',
      'Tên khách hàng',
      'Số điện thoại',
      'Email',
      'Sản phẩm',
      'Loại',
      'Số tiền (VNĐ)',
      'Địa chỉ giao hàng',
      'Ghi chú',
      'Trạng thái thanh toán',
      'Trạng thái giao hàng'
    ];

    const rows = filteredOrders.map((o) => [
      `"${o.orderCode}"`,
      `"${new Date(o.createdAt).toLocaleString('vi-VN')}"`,
      `"${o.customerName}"`,
      `"${o.customerPhone}"`,
      `"${o.customerEmail}"`,
      `"${o.productTitle.replace(/"/g, '""')}"`,
      `"${o.productType}"`,
      o.amount,
      `"${(o.shippingAddress || '').replace(/"/g, '""')}"`,
      `"${(o.customerNote || '').replace(/"/g, '""')}"`,
      `"${o.status}"`,
      `"${o.shippingStatus || 'N/A'}"`
    ]);

    // UTF-8 BOM so Excel opens Vietnamese characters perfectly
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `don-hang-tiemnho-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Đã xuất file CSV thành công (chuẩn UTF-8 mở được trên Excel)!');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + ' đ';
  };

  return (
    <div className='space-y-4'>
      {/* Top Toolbar */}
      <div className='flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3'>
        <div className='relative w-full max-w-sm'>
          <Icons.search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='Tìm theo mã đơn (TN...), tên, SĐT khách...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='pl-9 h-9 text-xs rounded-xl'
          />
        </div>

        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            onClick={handleExportCsv}
            className='h-9 text-xs font-semibold rounded-xl gap-1.5 border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10'
          >
            <Icons.fileSpreadsheet className='h-4 w-4 text-emerald-600' />
            Xuất file Excel / CSV (Gửi bưu cục)
          </Button>
        </div>
      </div>

      {/* Filter Tabs (Chuẩn Section 3.3) */}
      <div className='flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none'>
        {[
          { key: 'ALL', label: 'Tất cả đơn', icon: null },
          { key: 'PENDING', label: 'Chờ thanh toán', icon: Clock },
          { key: 'PAID', label: 'Đã thanh toán', icon: CheckCircle2 },
          { key: 'PHYSICAL_SHIPPING', label: 'Đơn đặt trước cần gửi', icon: Package }
        ].map((tab) => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === tab.key
                  ? 'bg-foreground text-background shadow-xs font-semibold'
                  : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {TabIcon && <TabIcon className='w-3.5 h-3.5' strokeWidth={1.75} />}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Orders Table */}
      <Card className='border border-border shadow-xs overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full text-left border-collapse text-xs'>
            <thead>
              <tr className='border-b border-border bg-muted/40 font-semibold text-muted-foreground'>
                <th className='py-3 px-4'>Mã đơn & Thời gian</th>
                <th className='py-3 px-4'>Khách hàng</th>
                <th className='py-3 px-4'>Sản phẩm</th>
                <th className='py-3 px-4 text-center'>Số tiền</th>
                <th className='py-3 px-4 text-center'>Thanh toán</th>
                <th className='py-3 px-4 text-center'>Vận chuyển</th>
                <th className='py-3 px-4 text-right'>Chi tiết</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-border/60'>
              {filteredOrders.map((order) => {
                const isPaid = order.status === 'PAID';
                const isPending = order.status === 'PENDING';
                const isPhysical = order.productType === 'PHYSICAL';

                return (
                  <tr key={order.id} className='hover:bg-muted/30 transition-colors'>
                    {/* Code & Date */}
                    <td className='py-3 px-4 whitespace-nowrap'>
                      <div className='font-mono font-bold text-xs text-primary'>
                        {order.orderCode}
                      </div>
                      <div className='text-[11px] text-muted-foreground'>
                        {new Date(order.createdAt).toLocaleString('vi-VN', {
                          month: 'numeric',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </td>

                    {/* Customer Info */}
                    <td className='py-3 px-4 max-w-[180px]'>
                      <div className='font-semibold text-foreground truncate'>
                        {order.customerName}
                      </div>
                      <div className='text-[11px] text-muted-foreground truncate'>
                        {order.customerPhone} • {order.customerEmail}
                      </div>
                    </td>

                    {/* Product */}
                    <td className='py-3 px-4 max-w-[200px]'>
                      <div className='font-medium text-foreground line-clamp-1'>
                        {order.productTitle}
                      </div>
                      <Badge variant='outline' className='text-[9px] px-1 py-0 mt-0.5'>
                        {order.productType === 'DIGITAL' && 'Sản phẩm số'}
                        {order.productType === 'PHYSICAL' && 'Hàng đặt trước / Thủ công'}
                        {order.productType === 'LEAD_MAGNET' && 'Quà tặng 0đ'}
                      </Badge>
                    </td>

                    {/* Amount */}
                    <td className='py-3 px-4 text-center whitespace-nowrap font-bold text-foreground'>
                      {formatPrice(order.amount)}
                    </td>

                    {/* Payment Status */}
                    <td className='py-3 px-4 text-center whitespace-nowrap'>
                      <Badge
                        variant='outline'
                        className={`text-[10px] font-semibold ${
                          isPaid
                            ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30'
                            : isPending
                              ? 'bg-amber-500/15 text-amber-600 border-amber-500/30'
                              : 'bg-red-500/15 text-red-600 border-red-500/30'
                        }`}
                      >
                        {isPaid && 'Đã thanh toán'}
                        {isPending && 'Chờ thanh toán'}
                        {order.status === 'CANCELLED' && 'Đã hủy'}
                      </Badge>
                    </td>

                    {/* Shipping Status */}
                    <td className='py-3 px-4 text-center whitespace-nowrap'>
                      {isPhysical ? (
                        <select
                          value={order.shippingStatus || 'UNFULFILLED'}
                          onChange={(e) =>
                            handleUpdateShipping(order.id, e.target.value as ShippingStatus)
                          }
                          className='h-7 text-[11px] rounded-lg border border-border bg-background px-2 py-0 font-medium'
                        >
                          <option value='UNFULFILLED'>Chờ gửi hàng</option>
                          <option value='SHIPPING'>Đang giao</option>
                          <option value='COMPLETED'>Đã hoàn thành</option>
                        </select>
                      ) : (
                        <span className='text-[11px] text-muted-foreground'>Giao tự động</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className='py-3 px-4 text-right whitespace-nowrap'>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => setSelectedOrder(order)}
                        className='h-8 text-xs text-primary hover:text-primary font-semibold'
                      >
                        Xem chi tiết
                      </Button>
                    </td>
                  </tr>
                );
              })}

              {filteredOrders.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className='py-12 text-center text-muted-foreground'>
                    Không tìm thấy đơn hàng nào phù hợp bộ lọc.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in-50'>
          <div className='w-full max-w-md rounded-2xl bg-card border border-border shadow-2xl overflow-hidden p-6 space-y-4'>
            <div className='flex items-center justify-between pb-3 border-b border-border'>
              <div>
                <span className='text-xs text-muted-foreground'>Chi tiết đơn hàng</span>
                <h3 className='font-mono font-bold text-lg text-primary'>
                  {selectedOrder.orderCode}
                </h3>
              </div>
              <Badge
                variant='outline'
                className={`text-xs ${
                  selectedOrder.status === 'PAID'
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-600'
                }`}
              >
                {selectedOrder.status === 'PAID' ? 'Đã thanh toán' : 'Chờ thanh toán'}
              </Badge>
            </div>

            <div className='space-y-2.5 text-xs'>
              <div className='p-3 rounded-xl bg-muted/40 space-y-1.5'>
                <div className='font-semibold text-foreground'>Thông tin người mua:</div>
                <div className='text-muted-foreground'>
                  • Họ tên:{' '}
                  <strong className='text-foreground'>{selectedOrder.customerName}</strong>
                </div>
                <div className='text-muted-foreground'>
                  • Số điện thoại:{' '}
                  <strong className='text-foreground'>{selectedOrder.customerPhone}</strong>
                </div>
                <div className='text-muted-foreground'>
                  • Email:{' '}
                  <strong className='text-foreground'>{selectedOrder.customerEmail}</strong>
                </div>
                {selectedOrder.shippingAddress && (
                  <div className='text-muted-foreground pt-1 border-t border-border/60'>
                    • Địa chỉ nhận hàng:{' '}
                    <strong className='text-foreground'>{selectedOrder.shippingAddress}</strong>
                  </div>
                )}
                {selectedOrder.customerNote && (
                  <div className='text-muted-foreground'>
                    • Ghi chú đơn:{' '}
                    <strong className='text-foreground'>{selectedOrder.customerNote}</strong>
                  </div>
                )}
              </div>

              <div className='p-3 rounded-xl bg-muted/40 space-y-1.5'>
                <div className='font-semibold text-foreground'>Sản phẩm:</div>
                <div className='text-muted-foreground leading-snug'>
                  {selectedOrder.productTitle}
                </div>
                <div className='flex justify-between pt-1 border-t border-border/60 font-semibold'>
                  <span>Tổng tiền thực nhận:</span>
                  <span className='text-emerald-600 dark:text-emerald-400 font-bold text-sm'>
                    {formatPrice(selectedOrder.amount)}
                  </span>
                </div>
              </div>

              {selectedOrder.downloadUrl && (
                <div className='p-3 rounded-xl bg-muted/40 border border-border space-y-1'>
                  <div className='font-semibold text-foreground flex items-center gap-1.5'>
                    <Icons.download className='h-4 w-4 text-[#FE2C55]' />
                    Link tải tài nguyên của khách:
                  </div>
                  <a
                    href={selectedOrder.downloadUrl}
                    target='_blank'
                    rel='noreferrer'
                    className='text-[11px] text-muted-foreground hover:underline break-all'
                  >
                    {selectedOrder.downloadUrl}
                  </a>
                </div>
              )}
            </div>

            <div className='pt-2 flex gap-2'>
              <Button
                variant='outline'
                className='w-full rounded-xl'
                onClick={() => setSelectedOrder(null)}
              >
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
