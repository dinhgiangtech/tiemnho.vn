'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Search,
  Code,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  ChevronDown
} from 'lucide-react';
import { TablePagination } from '@/components/ui/table-pagination';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';

export interface PaymentLogItem {
  id: string;
  creatorId: string | null;
  orderId: string | null;
  orderCode: string | null;
  eventType: string;
  gateway: string | null;
  transactionId: string | null;
  transferAmount: number;
  transferContent: string | null;
  status: string;
  message: string | null;
  rawPayload: any;
  createdAt: Date;
  creator?: {
    displayName: string | null;
    username: string | null;
    email: string | null;
  } | null;
  order?: {
    productTitle: string;
    amount: number;
    status: string;
  } | null;
}

export function AdminLogsView({ initialLogs }: { initialLogs: PaymentLogItem[] }) {
  const [logs, setLogs] = React.useState<PaymentLogItem[]>(initialLogs);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedEventType, setSelectedEventType] = React.useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = React.useState<string>('ALL');
  const [inspectPayload, setInspectPayload] = React.useState<PaymentLogItem | null>(null);

  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(15);

  const filtered = React.useMemo(() => {
    return logs.filter((log) => {
      if (selectedEventType !== 'ALL' && log.eventType !== selectedEventType) return false;
      if (selectedStatus !== 'ALL' && log.status !== selectedStatus) return false;

      if (!searchTerm.trim()) return true;
      const s = searchTerm.toLowerCase();
      return (
        (log.orderCode && log.orderCode.toLowerCase().includes(s)) ||
        (log.transactionId && log.transactionId.toLowerCase().includes(s)) ||
        (log.message && log.message.toLowerCase().includes(s)) ||
        (log.creator?.username && log.creator.username.toLowerCase().includes(s))
      );
    });
  }, [logs, searchTerm, selectedEventType, selectedStatus]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedEventType, selectedStatus]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedLogs = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <Badge className='text-[10px] bg-emerald-600 text-white flex items-center gap-1 font-mono'>
            <CheckCircle2 className='w-3 h-3' />
            <span>SUCCESS</span>
          </Badge>
        );
      case 'WARNING':
        return (
          <Badge
            variant='outline'
            className='text-[10px] border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950/20 flex items-center gap-1 font-mono'
          >
            <AlertTriangle className='w-3 h-3' />
            <span>WARNING</span>
          </Badge>
        );
      case 'ERROR':
        return (
          <Badge variant='destructive' className='text-[10px] flex items-center gap-1 font-mono'>
            <AlertCircle className='w-3 h-3' />
            <span>ERROR</span>
          </Badge>
        );
      default:
        return (
          <Badge
            variant='secondary'
            className='text-[10px] flex items-center gap-1 font-mono text-muted-foreground'
          >
            <Info className='w-3 h-3' />
            <span>INFO</span>
          </Badge>
        );
    }
  };

  const getEventBadge = (eventType: string) => {
    return (
      <span className='font-mono text-[11px] font-semibold text-foreground px-1.5 py-0.5 rounded bg-muted'>
        {eventType}
      </span>
    );
  };

  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>
            Nhật ký Giao dịch & Đối soát (Audit Log)
          </h1>
          <p className='text-sm text-muted-foreground'>
            Toàn bộ sự kiện thanh toán, webhook, duyệt đơn và gửi email theo thời gian thực.
          </p>
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          <div className='relative w-full sm:w-64'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder='Tìm mã đơn, ref, message...'
              className='pl-9 h-9 text-xs rounded-lg'
            />
          </div>

          <select
            value={selectedEventType}
            onChange={(e) => setSelectedEventType(e.target.value)}
            className='h-9 rounded-lg border border-input bg-background px-2.5 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-ring'
          >
            <option value='ALL'>Tất cả sự kiện</option>
            <option value='WEBHOOK_SUCCESS'>WEBHOOK_SUCCESS</option>
            <option value='WEBHOOK_MISMATCH'>WEBHOOK_MISMATCH</option>
            <option value='WEBHOOK_DUPLICATE'>WEBHOOK_DUPLICATE</option>
            <option value='ORDER_NOT_FOUND'>ORDER_NOT_FOUND</option>
            <option value='INVALID_SIGNATURE'>INVALID_SIGNATURE</option>
            <option value='BUYER_CONFIRMED'>BUYER_CONFIRMED</option>
            <option value='MANUAL_APPROVED'>MANUAL_APPROVED</option>
            <option value='LINK_CREATED'>LINK_CREATED</option>
            <option value='FALLBACK_TRIGGERED'>FALLBACK_TRIGGERED</option>
            <option value='EMAIL_SENT'>EMAIL_SENT</option>
            <option value='EMAIL_FAILED'>EMAIL_FAILED</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className='h-9 rounded-lg border border-input bg-background px-2.5 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-ring'
          >
            <option value='ALL'>Tất cả mức độ</option>
            <option value='SUCCESS'>SUCCESS</option>
            <option value='INFO'>INFO</option>
            <option value='WARNING'>WARNING</option>
            <option value='ERROR'>ERROR</option>
          </select>
        </div>
      </div>

      <Card className='rounded-xl border shadow-xs'>
        <CardContent className='p-0'>
          <div className='overflow-x-auto'>
            <table className='w-full text-left text-xs'>
              <thead className='bg-muted/50 border-b text-muted-foreground uppercase tracking-wider font-semibold'>
                <tr>
                  <th className='py-3 px-4'>Thời gian</th>
                  <th className='py-3 px-4'>Sự kiện</th>
                  <th className='py-3 px-4'>Mã đơn</th>
                  <th className='py-3 px-4'>Cổng / Nguồn</th>
                  <th className='py-3 px-4'>Số tiền</th>
                  <th className='py-3 px-4 text-center'>Mức độ</th>
                  <th className='py-3 px-4'>Mô tả chi tiết</th>
                  <th className='py-3 px-4 text-right'>JSON</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-border'>
                {paginatedLogs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className='py-12 text-center text-muted-foreground'>
                      Chưa có nhật ký giao dịch nào được ghi nhận
                    </td>
                  </tr>
                ) : (
                  paginatedLogs.map((log) => (
                    <tr key={log.id} className='hover:bg-muted/20 transition-colors'>
                      <td className='py-3.5 px-4 font-mono text-muted-foreground whitespace-nowrap text-[11px]'>
                        {new Date(log.createdAt).toLocaleString('vi-VN')}
                      </td>

                      <td className='py-3.5 px-4 whitespace-nowrap'>
                        {getEventBadge(log.eventType)}
                      </td>

                      <td className='py-3.5 px-4 font-mono font-bold text-foreground whitespace-nowrap'>
                        {log.orderCode ? `#${log.orderCode}` : '-'}
                      </td>

                      <td className='py-3.5 px-4'>
                        <span className='font-mono font-medium text-[11px] text-muted-foreground'>
                          {log.gateway || '-'}
                        </span>
                      </td>

                      <td className='py-3.5 px-4 font-bold text-foreground whitespace-nowrap'>
                        {log.transferAmount > 0
                          ? `${new Intl.NumberFormat('vi-VN').format(log.transferAmount)} đ`
                          : '-'}
                      </td>

                      <td className='py-3.5 px-4 text-center whitespace-nowrap'>
                        {getStatusBadge(log.status)}
                      </td>

                      <td className='py-3.5 px-4 max-w-[280px]'>
                        <div
                          className='truncate text-foreground font-medium'
                          title={log.message || ''}
                        >
                          {log.message || '-'}
                        </div>
                        {log.transactionId && (
                          <div className='text-[10px] text-muted-foreground font-mono truncate'>
                            Ref: {log.transactionId}
                          </div>
                        )}
                      </td>

                      <td className='py-3.5 px-4 text-right'>
                        {log.rawPayload ? (
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => setInspectPayload(log)}
                            className='h-6 px-2 text-[10px] font-mono rounded'
                          >
                            <Code className='w-3 h-3 mr-1 text-primary' />
                            <span>Payload</span>
                          </Button>
                        ) : (
                          <span className='text-muted-foreground text-[10px]'>-</span>
                        )}
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

      {/* Modal xem Payload JSON chi tiết */}
      <Dialog open={!!inspectPayload} onOpenChange={(open) => !open && setInspectPayload(null)}>
        <DialogContent className='max-w-2xl max-h-[85vh] overflow-hidden flex flex-col rounded-2xl'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-base font-bold'>
              <span>Chi tiết Payload Log</span>
              {inspectPayload && getEventBadge(inspectPayload.eventType)}
            </DialogTitle>
            <DialogDescription className='text-xs'>
              Mã đơn: #{inspectPayload?.orderCode || 'N/A'} • Thời gian:{' '}
              {inspectPayload && new Date(inspectPayload.createdAt).toLocaleString('vi-VN')}
            </DialogDescription>
          </DialogHeader>

          <div className='flex-1 overflow-auto rounded-xl bg-neutral-950 p-4 font-mono text-xs text-neutral-200 border border-neutral-800'>
            <pre className='whitespace-pre-wrap break-all leading-relaxed'>
              {JSON.stringify(inspectPayload?.rawPayload, null, 2)}
            </pre>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
