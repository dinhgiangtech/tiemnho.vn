'use client';

import * as React from 'react';
import { Lead } from '@/constants/mock-tiemnho';
import { getLeads } from '../../api/service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { toast } from 'sonner';

export function LeadsTable() {
  const [leads, setLeads] = React.useState<Lead[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');

  const fetchLeads = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await getLeads();
      setLeads(data);
    } catch {
      toast.error('Lỗi khi tải danh sách khách hàng');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const filteredLeads = React.useMemo(() => {
    if (!search.trim()) return leads;
    const q = search.toLowerCase();
    return leads.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.phone.toLowerCase().includes(q) ||
        l.sourceProduct.toLowerCase().includes(q)
    );
  }, [leads, search]);

  const handleExportCsv = () => {
    if (leads.length === 0) {
      toast.error('Không có dữ liệu để xuất');
      return;
    }

    const headers = [
      'Họ và tên',
      'Email',
      'Số điện thoại',
      'Nguồn thu thập',
      'Loại',
      'Tổng chi tiêu (VNĐ)',
      'Số đơn hàng',
      'Ngày tham gia'
    ];
    const rows = filteredLeads.map((l) => [
      `"${l.name}"`,
      `"${l.email}"`,
      `"${l.phone}"`,
      `"${l.sourceProduct.replace(/"/g, '""')}"`,
      `"${l.sourceType}"`,
      l.totalSpent,
      l.ordersCount,
      `"${new Date(l.createdAt).toLocaleDateString('vi-VN')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `danh-sach-leads-tiemnho-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Đã xuất file CSV danh bạ khách hàng thành công!');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + ' đ';
  };

  return (
    <div className='space-y-4'>
      <div className='flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3'>
        <div className='relative w-full max-w-sm'>
          <Icons.search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='Tìm kiếm theo tên, email, SĐT...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='pl-9 h-9 text-xs rounded-xl'
          />
        </div>

        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            onClick={handleExportCsv}
            className='h-9 text-xs font-semibold rounded-xl gap-1.5 border-primary/40 text-primary hover:bg-primary/10'
          >
            <Icons.fileSpreadsheet className='h-4 w-4' />
            Xuất danh sách Email CSV (Chạy Marketing)
          </Button>
        </div>
      </div>

      <Card className='border border-border shadow-xs overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full text-left border-collapse text-xs'>
            <thead>
              <tr className='border-b border-border bg-muted/40 font-semibold text-muted-foreground'>
                <th className='py-3 px-4'>Khách hàng</th>
                <th className='py-3 px-4'>Email & SĐT</th>
                <th className='py-3 px-4'>Nguồn thu thập</th>
                <th className='py-3 px-4 text-center'>Phân loại</th>
                <th className='py-3 px-4 text-center'>Tổng chi tiêu</th>
                <th className='py-3 px-4 text-center'>Số đơn</th>
                <th className='py-3 px-4 text-right'>Ngày tham gia</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-border/60'>
              {filteredLeads.map((lead) => {
                const isBuyer = lead.sourceType === 'PURCHASE';
                return (
                  <tr key={lead.id} className='hover:bg-muted/30 transition-colors'>
                    <td className='py-3 px-4 font-semibold text-foreground whitespace-nowrap'>
                      {lead.name}
                    </td>
                    <td className='py-3 px-4 whitespace-nowrap text-muted-foreground'>
                      <div>{lead.email}</div>
                      <div className='text-[11px] font-mono'>{lead.phone}</div>
                    </td>
                    <td className='py-3 px-4 max-w-xs'>
                      <div className='line-clamp-1 text-foreground'>{lead.sourceProduct}</div>
                    </td>
                    <td className='py-3 px-4 text-center whitespace-nowrap'>
                      <Badge
                        variant='outline'
                        className={`text-[10px] ${
                          isBuyer
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                            : 'bg-primary/10 text-primary border-primary/30'
                        }`}
                      >
                        {isBuyer ? 'Khách mua hàng' : 'Lead Magnet 0đ'}
                      </Badge>
                    </td>
                    <td className='py-3 px-4 text-center whitespace-nowrap font-bold text-foreground'>
                      {formatPrice(lead.totalSpent)}
                    </td>
                    <td className='py-3 px-4 text-center whitespace-nowrap font-semibold'>
                      {lead.ordersCount}
                    </td>
                    <td className='py-3 px-4 text-right whitespace-nowrap text-muted-foreground text-[11px]'>
                      {new Date(lead.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                  </tr>
                );
              })}

              {filteredLeads.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className='py-12 text-center text-muted-foreground'>
                    Chưa có liên hệ nào được ghi nhận. Khi có khách tải quà 0đ hoặc mua hàng, dữ
                    liệu sẽ tự động xuất hiện tại đây.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
