'use client';

import * as React from 'react';
import { Product, ProductType } from '@/constants/mock-tiemnho';
import { getProducts, updateProduct, deleteProduct } from '../../api/service';
import { ProductFormSheet } from './product-form-sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { toast } from 'sonner';
import { FileText, Gift, Package, Link2, ExternalLink } from 'lucide-react';

export function ProductsTable() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filterType, setFilterType] = React.useState<string>('ALL');
  const [search, setSearch] = React.useState<string>('');

  // Sheet states
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null);

  const fetchProducts = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await getProducts();
      setProducts(data);
    } catch {
      toast.error('Lỗi khi tải danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filteredProducts = React.useMemo(() => {
    return products
      .filter((p) => {
        if (filterType === 'ALL') return true;
        return p.type === filterType;
      })
      .filter((p) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
      })
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }, [products, filterType, search]);

  const handleTogglePublish = async (product: Product) => {
    try {
      const updated = await updateProduct(product.id, { isPublished: !product.isPublished });
      setProducts((prev) => prev.map((p) => (p.id === product.id ? updated : p)));
      toast.success(
        updated.isPublished ? 'Đã bật hiển thị trên Storefront' : 'Đã ẩn sản phẩm khỏi Storefront'
      );
    } catch {
      toast.error('Không thể cập nhật trạng thái hiển thị');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;
    try {
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast.success('Đã xóa sản phẩm thành công');
    } catch {
      toast.error('Lỗi khi xóa sản phẩm');
    }
  };

  const handleCopyLink = (p: Product) => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/@giangdinh` : '';
    navigator.clipboard.writeText(url);
    toast.success('Đã sao chép link Bio Storefront!');
  };

  const formatPrice = (price: number) => {
    if (price === 0) return '0 đ (Miễn phí)';
    return new Intl.NumberFormat('vi-VN').format(price) + ' đ';
  };

  return (
    <div className='space-y-4'>
      {/* Top Toolbar */}
      <div className='flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3'>
        <div className='flex items-center gap-2 flex-1 max-w-sm'>
          <div className='relative w-full'>
            <Icons.search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
            <Input
              placeholder='Tìm kiếm sản phẩm theo tên...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='pl-9 h-9 text-xs rounded-xl'
            />
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <Button
            onClick={() => {
              setEditingProduct(null);
              setIsSheetOpen(true);
            }}
            className='h-9 text-xs font-semibold rounded-xl gap-1.5 shadow-sm'
          >
            <Icons.add className='h-4 w-4' />
            Đăng sản phẩm mới
          </Button>
        </div>
      </div>

      {/* Filter Category Tabs with Lucide-React Icons */}
      <div className='flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none'>
        {[
          { key: 'ALL', label: 'Tất cả sản phẩm', icon: null },
          { key: 'DIGITAL', label: 'Sản phẩm số', icon: FileText, color: 'text-blue-500' },
          { key: 'LEAD_MAGNET', label: 'Quà 0đ', icon: Gift, color: 'text-emerald-500' },
          { key: 'PHYSICAL', label: 'Hàng vật lý', icon: Package, color: 'text-amber-500' },
          {
            key: 'EXTERNAL_LINK',
            label: 'Nút link liên kết',
            icon: Link2,
            color: 'text-purple-500'
          }
        ].map((tab) => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setFilterType(tab.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                filterType === tab.key
                  ? 'bg-foreground text-background shadow-xs font-semibold'
                  : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {TabIcon && (
                <TabIcon
                  className={`w-3.5 h-3.5 ${filterType === tab.key ? 'text-inherit' : tab.color}`}
                  strokeWidth={1.75}
                />
              )}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Products Table Card */}
      <Card className='border border-border shadow-xs overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full text-left border-collapse text-xs'>
            <thead>
              <tr className='border-b border-border bg-muted/40 font-semibold text-muted-foreground'>
                <th className='py-3 px-4'>Sản phẩm</th>
                <th className='py-3 px-4'>Loại & Giá bán</th>
                <th className='py-3 px-4 text-center'>Đã bán</th>
                <th className='py-3 px-4 text-center'>Doanh thu</th>
                <th className='py-3 px-4 text-center'>Trạng thái</th>
                <th className='py-3 px-4 text-right'>Thao tác</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-border/60'>
              {filteredProducts.map((p) => {
                const totalRevenue = p.price * p.soldCount;
                return (
                  <tr key={p.id} className='hover:bg-muted/30 transition-colors'>
                    {/* Title & Image */}
                    <td className='py-3 px-4 max-w-xs'>
                      <div className='flex items-center gap-3'>
                        <div className='relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-border bg-muted'>
                          <img
                            src={p.coverImage}
                            alt={p.title}
                            className='h-full w-full object-cover'
                          />
                          {p.isFeatured && (
                            <span className='absolute top-0.5 left-0.5 rounded-xs bg-primary px-1 text-[8px] font-bold text-primary-foreground'>
                              HOT
                            </span>
                          )}
                        </div>
                        <div className='min-w-0'>
                          <div className='font-semibold text-xs text-foreground line-clamp-1'>
                            {p.title}
                          </div>
                          <div className='text-[11px] text-muted-foreground line-clamp-1'>
                            {p.description}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Type & Price */}
                    <td className='py-3 px-4 whitespace-nowrap'>
                      <div className='space-y-0.5'>
                        <Badge variant='outline' className='text-[10px] font-medium'>
                          {p.type === 'DIGITAL' && 'Sản phẩm số'}
                          {p.type === 'LEAD_MAGNET' && 'Quà 0đ (Lead Magnet)'}
                          {p.type === 'PHYSICAL' && 'Hàng vật lý'}
                          {p.type === 'EXTERNAL_LINK' && 'Nút link'}
                        </Badge>
                        <div className='font-bold text-foreground text-xs'>
                          {formatPrice(p.price)}
                        </div>
                      </div>
                    </td>

                    {/* Sold count */}
                    <td className='py-3 px-4 text-center whitespace-nowrap font-semibold'>
                      {p.soldCount}
                    </td>

                    {/* Total Revenue */}
                    <td className='py-3 px-4 text-center whitespace-nowrap font-bold text-emerald-600 dark:text-emerald-400'>
                      {new Intl.NumberFormat('vi-VN').format(totalRevenue)} đ
                    </td>

                    {/* Published toggle */}
                    <td className='py-3 px-4 text-center whitespace-nowrap'>
                      <button
                        onClick={() => handleTogglePublish(p)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                          p.isPublished
                            ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${p.isPublished ? 'bg-emerald-500' : 'bg-muted-foreground'}`}
                        />
                        {p.isPublished ? 'Đang bán' : 'Ẩn'}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className='py-3 px-4 text-right whitespace-nowrap'>
                      <div className='flex items-center justify-end gap-1.5'>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='h-8 w-8 p-0 text-muted-foreground hover:text-foreground'
                          onClick={() => handleCopyLink(p)}
                          title='Sao chép link'
                        >
                          <Icons.copy className='h-3.5 w-3.5' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='h-8 w-8 p-0 text-muted-foreground hover:text-primary'
                          onClick={() => {
                            setEditingProduct(p);
                            setIsSheetOpen(true);
                          }}
                          title='Chỉnh sửa'
                        >
                          <Icons.edit className='h-3.5 w-3.5' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='h-8 w-8 p-0 text-muted-foreground hover:text-destructive'
                          onClick={() => handleDelete(p.id)}
                          title='Xóa'
                        >
                          <Icons.trash className='h-3.5 w-3.5' />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredProducts.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className='py-12 text-center text-muted-foreground'>
                    Không tìm thấy sản phẩm nào. Bấm &quot;Đăng sản phẩm mới&quot; để tạo sản phẩm
                    đầu tiên!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add / Edit Sheet */}
      <ProductFormSheet
        product={editingProduct}
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        onSuccess={fetchProducts}
      />
    </div>
  );
}
