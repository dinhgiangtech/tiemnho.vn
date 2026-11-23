'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Eye, ExternalLink, Download } from 'lucide-react';
import { toggleProductPublished } from '@/features/admin/api/admin.service';
import { toast } from 'sonner';
import Link from 'next/link';
import { TablePagination } from '@/components/ui/table-pagination';

export interface ProductItem {
  id: string;
  title: string;
  subtitle: string | null;
  type: string;
  price: number;
  isPublished: boolean;
  soldCount: number;
  coverImage: string | null;
  fileUrl: string | null;
  fileName: string | null;
  externalUrl: string | null;
  createdAt: Date;
  user: {
    id: string;
    displayName: string | null;
    username: string | null;
  } | null;
}

export function AdminProductsView({ initialProducts }: { initialProducts: ProductItem[] }) {
  const [products, setProducts] = React.useState<ProductItem[]>(initialProducts);
  const [searchTerm, setSearchTerm] = React.useState('');

  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  const filtered = React.useMemo(() => {
    if (!searchTerm.trim()) return products;
    const s = searchTerm.toLowerCase();
    return products.filter(
      (p) =>
        p.title.toLowerCase().includes(s) ||
        (p.user && p.user.username && p.user.username.toLowerCase().includes(s)) ||
        (p.user && p.user.displayName && p.user.displayName.toLowerCase().includes(s))
    );
  }, [products, searchTerm]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedProducts = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filtered.slice(startIndex, startIndex + pageSize);
  }, [filtered, currentPage, pageSize]);

  const handleTogglePublish = async (productId: string, current: boolean) => {
    try {
      await toggleProductPublished(productId, !current);
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, isPublished: !current } : p))
      );
      toast.success(!current ? 'Đã hiển thị sản phẩm' : 'Đã ẩn sản phẩm khỏi sàn');
    } catch {
      toast.error('Lỗi khi cập nhật trạng thái hiển thị');
    }
  };

  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>Kiểm duyệt Sản phẩm toàn sàn</h1>
          <p className='text-sm text-muted-foreground'>
            Rà soát tài liệu số, kiểm tra link tải và tạm ẩn các sản phẩm có dấu hiệu vi phạm.
          </p>
        </div>
        <div className='relative w-full sm:w-72'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder='Tìm sản phẩm hoặc chủ tiệm...'
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
                  <th className='py-3 px-4'>Sản phẩm</th>
                  <th className='py-3 px-4'>Loại & Giá</th>
                  <th className='py-3 px-4'>Chủ tiệm</th>
                  <th className='py-3 px-4 text-center'>Đã bán</th>
                  <th className='py-3 px-4'>Tệp đính kèm / Link</th>
                  <th className='py-3 px-4 text-center'>Trạng thái</th>
                  <th className='py-3 px-4 text-right'>Hành động</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-border'>
                {paginatedProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className='py-8 text-center text-muted-foreground'>
                      Không tìm thấy sản phẩm nào
                    </td>
                  </tr>
                ) : (
                  paginatedProducts.map((product) => (
                    <tr key={product.id} className='hover:bg-muted/20 transition-colors'>
                      <td className='py-3.5 px-4'>
                        <div className='flex items-center gap-3'>
                          <div className='w-10 h-10 rounded-lg bg-muted border overflow-hidden shrink-0'>
                            <img
                              src={
                                product.coverImage ||
                                'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200'
                              }
                              alt=''
                              className='w-full h-full object-cover'
                            />
                          </div>
                          <div className='max-w-[220px]'>
                            <div
                              className='font-semibold text-foreground truncate'
                              title={product.title}
                            >
                              {product.title}
                            </div>
                            <span className='text-[10px] text-muted-foreground'>
                              {new Date(product.createdAt).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className='py-3.5 px-4'>
                        <div className='space-y-0.5'>
                          <Badge variant='secondary' className='text-[10px] px-1 py-0'>
                            {product.type}
                          </Badge>
                          <div className='font-bold text-foreground'>
                            {product.price === 0
                              ? 'Miễn phí'
                              : `${new Intl.NumberFormat('vi-VN').format(product.price)} đ`}
                          </div>
                        </div>
                      </td>

                      <td className='py-3.5 px-4'>
                        <Link
                          href={`/@${product.user?.username}`}
                          target='_blank'
                          className='text-primary hover:underline font-medium'
                        >
                          @{product.user?.username || 'tiemnho'}
                        </Link>
                      </td>

                      <td className='py-3.5 px-4 text-center font-bold'>{product.soldCount}</td>

                      <td className='py-3.5 px-4'>
                        {product.fileUrl ? (
                          <a
                            href={product.fileUrl}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline'
                          >
                            <Download className='w-3 h-3' />
                            <span>Tải file</span>
                          </a>
                        ) : product.externalUrl ? (
                          <a
                            href={product.externalUrl}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:underline'
                          >
                            <ExternalLink className='w-3 h-3' />
                            <span className='max-w-[120px] truncate'>{product.externalUrl}</span>
                          </a>
                        ) : (
                          <span className='text-muted-foreground text-[11px]'>Không có file</span>
                        )}
                      </td>

                      <td className='py-3.5 px-4 text-center'>
                        <Badge
                          variant='outline'
                          className={`text-[10px] ${
                            product.isPublished
                              ? 'border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20'
                              : 'border-muted text-muted-foreground'
                          }`}
                        >
                          {product.isPublished ? 'Đang hiện' : 'Đã ẩn'}
                        </Badge>
                      </td>

                      <td className='py-3.5 px-4 text-right'>
                        <Button
                          variant={product.isPublished ? 'ghost' : 'outline'}
                          size='sm'
                          onClick={() => handleTogglePublish(product.id, product.isPublished)}
                          className={`h-7 px-2.5 text-xs ${
                            product.isPublished
                              ? 'text-destructive hover:bg-destructive/10'
                              : 'text-emerald-600'
                          }`}
                        >
                          {product.isPublished ? 'Gỡ/Ẩn' : 'Hiện lại'}
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
