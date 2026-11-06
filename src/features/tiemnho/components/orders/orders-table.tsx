'use client';

import * as React from 'react';
import { Order, OrderStatus, ShippingStatus } from '@/constants/mock-tiemnho';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tiemNhoKeys, ordersQueryOptions } from '../../api/queries';
import { updateOrderStatus } from '../../api/service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Clock, CheckCircle2, Package, Check, Loader2, ChevronDown, Filter } from 'lucide-react';
import { toast } from 'sonner';

export function OrdersTable() {
  const queryClient = useQueryClient();
  const { data: orders = [], isLoading: loading } = useQuery(ordersQueryOptions());

  const [statusFilter, setStatusFilter] = React.useState<string>('ALL');
  const [search, setSearch] = React.useState<string>('');
  const [selectedOrder, setSelectedOrder] = React.useState<Order | null>(null);

  // State cho Modal xác nhận Kích hoạt thủ công
  const [orderToActivate, setOrderToActivate] = React.useState<Order | null>(null);

  const updateShippingMutation = useMutation({
    mutationFn: ({
      orderId,
      newShippingStatus
    }: {
      orderId: string;
      newShippingStatus: ShippingStatus;
    }) => updateOrderStatus(orderId, 'PAID', newShippingStatus),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: tiemNhoKeys.orders() });
      queryClient.invalidateQueries({ queryKey: tiemNhoKeys.analytics() });
      if (selectedOrder?.id === updated.id) setSelectedOrder(updated);
      toast.success(`Đã cập nhật trạng thái giao hàng: ${updated.shippingStatus}`);
    },
    onError: () => {
      toast.error('Không thể cập nhật trạng thái');
    }
  });

  const manualActivateMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await fetch(`/api/orders/${orderId}/manual-activate`, {
        method: 'POST'
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Kích hoạt đơn hàng thất bại');
      }
      return data;
    },
    onSuccess: (data, orderId) => {
      queryClient.invalidateQueries({ queryKey: tiemNhoKeys.orders() });
      queryClient.invalidateQueries({ queryKey: tiemNhoKeys.analytics() });
      queryClient.invalidateQueries({ queryKey: tiemNhoKeys.leads() });
      toast.success(
        `Đã kích hoạt đơn hàng #${orderToActivate?.orderCode} thành công! Hệ thống đã gửi email giao hàng tới khách.`
      );
      if (data.order && selectedOrder?.id === orderId) {
        setSelectedOrder(data.order);
      }
      setOrderToActivate(null);
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Có lỗi xảy ra khi kích hoạt đơn hàng');
    }
  });

  const isActivating = manualActivateMutation.isPending;

  const counts = React.useMemo(() => {
    return {
      all: orders.length,
      pending: orders.filter((o) => o.status === 'PENDING').length,
      paid: orders.filter((o) => o.status === 'PAID').length,
      shipping: orders.filter(
        (o) =>
          o.productType === 'PHYSICAL' && o.status === 'PAID' && o.shippingStatus !== 'COMPLETED'
      ).length
    };
  }, [orders]);

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

  const handleUpdateShipping = (orderId: string, newShippingStatus: ShippingStatus) => {
    updateShippingMutation.mutate({ orderId, newShippingStatus });
  };

  // Kích hoạt thủ công đơn hàng qua API endpoint
  const handleConfirmManualActivate = () => {
    if (!orderToActivate) return;
    manualActivateMutation.mutate(orderToActivate.id);
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
            className='pl-9 h-10 text-xs rounded-xl'
          />
        </div>

        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            onClick={handleExportCsv}
            className='w-full sm:w-auto h-10 text-xs font-semibold rounded-xl gap-1.5 border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10 justify-center'
          >
            <Icons.fileSpreadsheet className='h-4 w-4 text-emerald-600 shrink-0' />
            <span>Xuất file Excel / CSV (Gửi bưu cục)</span>
          </Button>
        </div>
      </div>

      {/* Filter: Select Box on Mobile (< md) & Tabs on Desktop (>= md) */}
      <div className='block md:hidden'>
        <div className='relative w-full'>
          <div className='absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500'>
            <Filter className='w-4 h-4 text-neutral-500' />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label='Lọc trạng thái đơn hàng'
            className='w-full h-11 pl-10 pr-10 text-xs font-semibold rounded-xl border border-input bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-xs appearance-none transition-colors'
          >
            <option value='ALL'>Tất cả đơn ({counts.all})</option>
            <option value='PENDING'>Chờ thanh toán ({counts.pending})</option>
            <option value='PAID'>Đã thanh toán ({counts.paid})</option>
            <option value='PHYSICAL_SHIPPING'>Đơn đặt trước cần gửi ({counts.shipping})</option>
          </select>
          <div className='absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400'>
            <ChevronDown className='w-4 h-4' />
          </div>
        </div>
      </div>

      {/* Desktop Filter Tabs (>= md) */}
      <div className='hidden md:flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none'>
        {[
          { key: 'ALL', label: 'Tất cả đơn', count: counts.all, icon: null },
          { key: 'PENDING', label: 'Chờ thanh toán', count: counts.pending, icon: Clock },
          { key: 'PAID', label: 'Đã thanh toán', count: counts.paid, icon: CheckCircle2 },
          {
            key: 'PHYSICAL_SHIPPING',
            label: 'Đơn đặt trước cần gửi',
            count: counts.shipping,
            icon: Package
          }
        ].map((tab) => {
          const TabIcon = tab.icon;
          const isActive = statusFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                  : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {TabIcon && <TabIcon className='w-3.5 h-3.5' strokeWidth={1.75} />}
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : 'bg-muted-foreground/15 text-muted-foreground'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Desktop Table View (>= md) */}
      <Card className='hidden md:block border border-border shadow-xs overflow-hidden'>
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
                <th className='py-3 px-4 text-right'>Hành động</th>
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

                    {/* Payment Status & Quick Action */}
                    <td className='py-3 px-4 text-center whitespace-nowrap'>
                      <div className='flex flex-col items-center gap-1.5'>
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

                        {/* Nút Kích hoạt thủ công cạnh Status */}
                        {isPending && (
                          <Button
                            type='button'
                            size='sm'
                            variant='outline'
                            onClick={() => setOrderToActivate(order)}
                            className='h-6 px-2 text-[10px] font-semibold text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/40 rounded-lg shadow-2xs'
                          >
                            <CheckCircle2 className='w-3 h-3 mr-1 text-emerald-600 dark:text-emerald-400' />
                            <span>Kích hoạt</span>
                          </Button>
                        )}
                        {isPaid && (
                          <span className='inline-flex items-center text-[10px] font-medium text-muted-foreground/80'>
                            <Check className='w-3 h-3 mr-0.5 text-emerald-500' />
                            Đã duyệt
                          </span>
                        )}
                      </div>
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
                      <div className='flex items-center justify-end gap-1.5'>
                        {isPending && (
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={() => setOrderToActivate(order)}
                            className='h-7.5 px-2.5 text-xs font-semibold text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/40 rounded-xl shadow-2xs'
                          >
                            <CheckCircle2 className='w-3.5 h-3.5 mr-1 text-emerald-600 dark:text-emerald-400' />
                            <span>Duyệt thanh toán</span>
                          </Button>
                        )}

                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => setSelectedOrder(order)}
                          className='h-7.5 text-xs text-primary hover:text-primary font-semibold rounded-xl'
                        >
                          Chi tiết
                        </Button>
                      </div>
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

      {/* Mobile Card View (< md) */}
      <div className='block md:hidden space-y-3.5'>
        {filteredOrders.map((order) => {
          const isPaid = order.status === 'PAID';
          const isPending = order.status === 'PENDING';
          const isPhysical = order.productType === 'PHYSICAL';

          return (
            <div
              key={order.id}
              className='bg-white dark:bg-card border border-neutral-200/80 dark:border-neutral-800 rounded-2xl p-4 shadow-2xs space-y-3'
            >
              {/* Top row: Mã đơn + Thời gian & Badge thanh toán */}
              <div className='flex items-start justify-between gap-2 border-b border-neutral-100 dark:border-neutral-800/80 pb-2.5'>
                <div>
                  <div className='font-mono font-bold text-sm text-[#161823] dark:text-white'>
                    #{order.orderCode}
                  </div>
                  <div className='text-[11px] text-neutral-400 mt-0.5'>
                    {new Date(order.createdAt).toLocaleString('vi-VN', {
                      month: 'numeric',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>

                <Badge
                  variant='outline'
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg shrink-0 ${
                    isPaid
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400'
                      : isPending
                        ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400'
                        : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400'
                  }`}
                >
                  {isPaid && 'Đã thanh toán'}
                  {isPending && 'Chờ thanh toán'}
                  {order.status === 'CANCELLED' && 'Đã hủy'}
                </Badge>
              </div>

              {/* Middle row: Tên sản phẩm & Số tiền */}
              <div className='space-y-1.5'>
                <div className='flex items-center justify-between gap-2'>
                  <span className='font-bold text-[14.5px] text-neutral-900 dark:text-white line-clamp-1'>
                    {order.productTitle}
                  </span>
                  <span className='font-extrabold text-[15px] text-primary shrink-0 font-mono'>
                    {formatPrice(order.amount)}
                  </span>
                </div>

                <div className='flex items-center gap-2 text-xs text-neutral-500'>
                  <Badge variant='outline' className='text-[10px] px-1.5 py-0'>
                    {order.productType === 'DIGITAL' && 'Sản phẩm số'}
                    {order.productType === 'PHYSICAL' && 'Hàng đặt trước'}
                    {order.productType === 'LEAD_MAGNET' && 'Quà tặng 0đ'}
                  </Badge>
                  <span>•</span>
                  <span className='font-medium text-neutral-700 dark:text-neutral-300 truncate'>
                    {order.customerName}
                  </span>
                </div>

                <div className='text-[12px] text-neutral-500 truncate'>
                  SĐT:{' '}
                  <span className='font-medium text-neutral-700 dark:text-neutral-300'>
                    {order.customerPhone}
                  </span>
                </div>
              </div>

              {/* Bottom row: Trạng thái giao hàng (nếu Physical) & Nút hành động */}
              <div className='flex items-center justify-between gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800/80'>
                <div>
                  {isPhysical ? (
                    <select
                      value={order.shippingStatus || 'UNFULFILLED'}
                      onChange={(e) =>
                        handleUpdateShipping(order.id, e.target.value as ShippingStatus)
                      }
                      className='h-8 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-2.5 py-0 font-medium'
                    >
                      <option value='UNFULFILLED'>Chờ gửi hàng</option>
                      <option value='SHIPPING'>Đang giao</option>
                      <option value='COMPLETED'>Hoàn thành</option>
                    </select>
                  ) : (
                    <span className='text-xs text-neutral-400 font-medium'>Tự động 24/7</span>
                  )}
                </div>

                <div className='flex items-center gap-1.5'>
                  {isPending && (
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => setOrderToActivate(order)}
                      className='h-8 px-2.5 text-xs font-bold text-emerald-600 border-emerald-200 hover:bg-emerald-50 rounded-xl'
                    >
                      <CheckCircle2 className='w-3.5 h-3.5 mr-1' />
                      Kích hoạt
                    </Button>
                  )}
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => setSelectedOrder(order)}
                    className='h-8 px-3 text-xs font-bold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 rounded-xl'
                  >
                    Chi tiết
                  </Button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredOrders.length === 0 && !loading && (
          <div className='bg-white dark:bg-card border border-neutral-200/80 dark:border-neutral-800 rounded-2xl p-8 text-center text-sm text-neutral-400'>
            Không tìm thấy đơn hàng nào phù hợp bộ lọc.
          </div>
        )}
      </div>

      {/* Confirmation Modal - Kích hoạt thủ công đơn hàng */}
      <AlertDialog
        open={!!orderToActivate}
        onOpenChange={(open) => {
          if (!open && !isActivating) setOrderToActivate(null);
        }}
      >
        <AlertDialogContent className='sm:max-w-md rounded-2xl'>
          <AlertDialogHeader>
            <div className='flex items-center gap-2.5 pb-1'>
              <div className='h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0'>
                <CheckCircle2 className='w-5 h-5' />
              </div>
              <AlertDialogTitle className='text-base font-bold text-foreground'>
                Xác nhận đã nhận được tiền?
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className='text-xs leading-relaxed text-muted-foreground pt-1.5 space-y-2'>
              <p>
                Bạn có chắc chắn đã nhận được số tiền{' '}
                <strong className='text-emerald-600 dark:text-emerald-400 font-bold'>
                  {orderToActivate ? formatPrice(orderToActivate.amount) : '0 đ'}
                </strong>{' '}
                từ khách hàng{' '}
                <strong className='text-foreground font-semibold'>
                  {orderToActivate?.customerName}
                </strong>{' '}
                vào tài khoản ngân hàng chưa?
              </p>
              <div className='p-2.5 rounded-xl bg-muted/60 border border-border/60 text-[11px] text-foreground font-medium'>
                Hệ thống sẽ ngay lập tức mở khóa tài nguyên số và gửi email giao hàng tới{' '}
                <span className='font-semibold text-primary underline'>
                  {orderToActivate?.customerEmail}
                </span>
                .
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className='pt-2 sm:justify-end gap-2'>
            <AlertDialogCancel
              disabled={isActivating}
              onClick={() => setOrderToActivate(null)}
              className='rounded-xl text-xs h-8.5'
            >
              Hủy bỏ
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isActivating}
              onClick={(e) => {
                e.preventDefault();
                handleConfirmManualActivate();
              }}
              className='bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs h-8.5 font-semibold gap-1.5'
            >
              {isActivating ? (
                <>
                  <Loader2 className='w-3.5 h-3.5 animate-spin' />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className='w-3.5 h-3.5' />
                  <span>Xác nhận kích hoạt</span>
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                    <Icons.download className='h-4 w-4 text-primary' />
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

            <div className='pt-2 flex items-center gap-2'>
              {selectedOrder.status === 'PENDING' && (
                <Button
                  className='flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1.5'
                  onClick={() => {
                    const ord = selectedOrder;
                    setSelectedOrder(null);
                    setOrderToActivate(ord);
                  }}
                >
                  <CheckCircle2 className='w-4 h-4' />
                  <span>Kích hoạt đơn hàng</span>
                </Button>
              )}

              <Button
                variant='outline'
                className='flex-1 rounded-xl'
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
