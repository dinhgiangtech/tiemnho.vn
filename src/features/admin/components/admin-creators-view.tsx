'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Search, ShieldCheck, ExternalLink, UserCheck, Lock } from 'lucide-react';
import { toggleCreatorVerified, toggleCreatorActive } from '@/features/admin/api/admin.service';
import { toast } from 'sonner';
import Link from 'next/link';
import { TablePagination } from '@/components/ui/table-pagination';

export interface CreatorItem {
  id: string;
  email: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  phone: string | null;
  verified: boolean;
  isActive: boolean;
  createdAt: Date;
  bankAccountNumber: string | null;
  bankBin: string | null;
  _count: {
    products: number;
    orders: number;
    leads: number;
  };
}

export function AdminCreatorsView({ initialCreators }: { initialCreators: CreatorItem[] }) {
  const [creators, setCreators] = React.useState<CreatorItem[]>(initialCreators);
  const [searchTerm, setSearchTerm] = React.useState('');

  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  const filtered = React.useMemo(() => {
    if (!searchTerm.trim()) return creators;
    const s = searchTerm.toLowerCase();
    return creators.filter(
      (c) =>
        (c.username && c.username.toLowerCase().includes(s)) ||
        (c.displayName && c.displayName.toLowerCase().includes(s)) ||
        c.email.toLowerCase().includes(s)
    );
  }, [creators, searchTerm]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedCreators = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filtered.slice(startIndex, startIndex + pageSize);
  }, [filtered, currentPage, pageSize]);

  const handleToggleVerified = async (creatorId: string, current: boolean) => {
    try {
      await toggleCreatorVerified(creatorId, !current);
      setCreators((prev) =>
        prev.map((c) => (c.id === creatorId ? { ...c, verified: !current } : c))
      );
      toast.success(!current ? 'Đã cấp Tick xanh uy tín' : 'Đã gỡ Tick xanh');
    } catch {
      toast.error('Lỗi khi cập nhật trạng thái');
    }
  };

  const handleToggleActive = async (creatorId: string, current: boolean) => {
    try {
      await toggleCreatorActive(creatorId, !current);
      setCreators((prev) =>
        prev.map((c) => (c.id === creatorId ? { ...c, isActive: !current } : c))
      );
      toast.success(!current ? 'Đã mở khóa shop' : 'Đã tạm khóa shop vi phạm');
    } catch {
      toast.error('Lỗi khi cập nhật trạng thái hoạt động');
    }
  };

  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>Quản lý Nhà Sáng Tạo (Creators)</h1>
          <p className='text-sm text-muted-foreground'>
            Cấp quyền tick xanh uy tín, giám sát hoạt động và xử lý tài khoản vi phạm.
          </p>
        </div>
        <div className='relative w-full sm:w-72'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder='Tìm theo username, tên, email...'
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
                  <th className='py-3 px-4'>Creator / Shop</th>
                  <th className='py-3 px-4'>Tài khoản & Liên hệ</th>
                  <th className='py-3 px-4 text-center'>Sản phẩm</th>
                  <th className='py-3 px-4 text-center'>Đơn hàng</th>
                  <th className='py-3 px-4 text-center'>Tick Xanh</th>
                  <th className='py-3 px-4 text-center'>Trạng thái</th>
                  <th className='py-3 px-4 text-right'>Hành động</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-border'>
                {paginatedCreators.length === 0 ? (
                  <tr>
                    <td colSpan={7} className='py-8 text-center text-muted-foreground'>
                      Không tìm thấy nhà sáng tạo nào phù hợp
                    </td>
                  </tr>
                ) : (
                  paginatedCreators.map((creator) => (
                    <tr key={creator.id} className='hover:bg-muted/20 transition-colors'>
                      <td className='py-3.5 px-4'>
                        <div className='flex items-center gap-3'>
                          <div className='w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden'>
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
                          <div>
                            <div className='font-semibold text-foreground flex items-center gap-1.5'>
                              {creator.displayName || 'Chưa đặt tên'}
                              {creator.verified && (
                                <Badge className='h-4 px-1 text-[9px] bg-emerald-500 hover:bg-emerald-600'>
                                  Verified
                                </Badge>
                              )}
                            </div>
                            <span className='text-[11px] text-muted-foreground font-mono'>
                              @{creator.username}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className='py-3.5 px-4'>
                        <div className='space-y-0.5'>
                          <div className='font-mono text-muted-foreground'>{creator.email}</div>
                          <div className='text-[11px] text-muted-foreground'>
                            {creator.phone || 'Chưa cập nhật SĐT'}
                          </div>
                        </div>
                      </td>

                      <td className='py-3.5 px-4 text-center font-bold'>
                        {creator._count.products}
                      </td>

                      <td className='py-3.5 px-4 text-center font-bold'>{creator._count.orders}</td>

                      <td className='py-3.5 px-4 text-center'>
                        <Button
                          variant={creator.verified ? 'default' : 'outline'}
                          size='sm'
                          onClick={() => handleToggleVerified(creator.id, creator.verified)}
                          className={`h-7 px-2.5 text-xs rounded-md ${
                            creator.verified
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : 'text-muted-foreground'
                          }`}
                        >
                          <ShieldCheck className='w-3.5 h-3.5 mr-1' />
                          {creator.verified ? 'Đã duyệt' : 'Cấp tick'}
                        </Button>
                      </td>

                      <td className='py-3.5 px-4 text-center'>
                        <Badge
                          variant='outline'
                          className={`text-[10px] ${
                            creator.isActive
                              ? 'border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20'
                              : 'border-destructive text-destructive bg-destructive/10'
                          }`}
                        >
                          {creator.isActive ? 'Hoạt động' : 'Đã khóa'}
                        </Badge>
                      </td>

                      <td className='py-3.5 px-4 text-right space-x-1.5'>
                        <Link
                          href={`/@${creator.username}`}
                          target='_blank'
                          className='inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs border hover:bg-muted font-medium'
                        >
                          <span>Tiệm</span>
                          <ExternalLink className='w-3 h-3 text-muted-foreground' />
                        </Link>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => handleToggleActive(creator.id, creator.isActive)}
                          className={`h-7 px-2 text-xs ${
                            creator.isActive
                              ? 'text-destructive hover:bg-destructive/10'
                              : 'text-emerald-600 hover:bg-emerald-100'
                          }`}
                        >
                          {creator.isActive ? 'Khóa shop' : 'Mở khóa'}
                        </Button>
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
