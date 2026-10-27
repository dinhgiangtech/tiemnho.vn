'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import {
  Product,
  CreatorProfile,
  PaymentConfig,
  defaultCreatorProfile,
  defaultPaymentConfig
} from '@/constants/mock-tiemnho';
import {
  getProducts,
  updateProduct,
  deleteProduct,
  reorderProducts,
  getProfile,
  getPaymentConfig
} from '../../api/service';
import { SortableProductItem } from './sortable-product-item';
import { StanProductEditor } from './stan-product-editor';
import { PhoneMockup } from '../mobile-preview/phone-mockup';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Icons } from '@/components/icons';
import { toast } from 'sonner';

export function ProductsManagementView() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [profile, setProfile] = React.useState<CreatorProfile | null>(null);
  const [paymentConfig, setPaymentConfig] = React.useState<PaymentConfig | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [filterType, setFilterType] = React.useState<string>('ALL');
  const [search, setSearch] = React.useState<string>('');

  // Stan Store Editor states
  const [isCreating, setIsCreating] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null);

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [prods, prof, pay] = await Promise.all([
        getProducts(),
        getProfile(),
        getPaymentConfig()
      ]);
      setProducts(prods.sort((a, b) => a.displayOrder - b.displayOrder));
      setProfile(prof);
      setPaymentConfig(pay);
    } catch {
      toast.error('Lỗi khi tải dữ liệu sản phẩm');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter & Search
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
      });
  }, [products, filterType, search]);

  // Drag and Drop Reordering
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = products.findIndex((p) => p.id === active.id);
    const newIndex = products.findIndex((p) => p.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = arrayMove(products, oldIndex, newIndex).map((p, idx) => ({
        ...p,
        displayOrder: idx + 1
      }));

      setProducts(reordered);
      toast.success('Đã cập nhật thứ tự hiển thị!');

      try {
        await reorderProducts(reordered.map((p) => p.id));
      } catch {
        toast.error('Không thể lưu thứ tự mới vào hệ thống');
        fetchData();
      }
    }
  };

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

  const handleCopyBioLink = () => {
    if (!profile) return;
    const url = `${window.location.origin}/@${profile.username}`;
    navigator.clipboard.writeText(url);
    toast.success('Đã sao chép link tiệm của bạn: ' + url);
  };

  // IF USER IS CREATING OR EDITING: SHOW STAN STORE PRODUCT EDITOR
  if (isCreating || editingProduct !== null) {
    const fallbackProfile: CreatorProfile = profile || defaultCreatorProfile;
    const fallbackPayment: PaymentConfig = paymentConfig || defaultPaymentConfig;

    return (
      <StanProductEditor
        product={editingProduct}
        profile={fallbackProfile}
        paymentConfig={fallbackPayment}
        allProducts={products}
        onBack={() => {
          setIsCreating(false);
          setEditingProduct(null);
        }}
        onSaved={() => {
          setIsCreating(false);
          setEditingProduct(null);
          fetchData();
        }}
      />
    );
  }

  // DEFAULT VIEW: STAN STORE PRODUCT LIST
  return (
    <div className='space-y-6'>
      {/* Bố cục 2 Cột Kết Hợp Live Mobile Preview */}
      <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 items-start'>
        {/* CỘT TRÁI (Khu vực làm việc & Quản trị - 7 Cột) */}
        <div className='lg:col-span-7 xl:col-span-7 space-y-4'>
          {/* Top Page Header chuẩn Base dự án */}
          <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/80'>
            <div>
              <h1 className='text-lg font-bold text-foreground tracking-tight'>
                Quản lý sản phẩm & Cửa hàng
              </h1>
              <p className='text-xs text-muted-foreground'>
                Sắp xếp thứ tự hiển thị, bật/tắt và quản lý danh mục sản phẩm số trên Bio.
              </p>
            </div>

            <div className='flex items-center gap-2'>
              <Link href='/dashboard/products/create'>
                <Button size='sm' className='h-8.5 px-3.5 text-xs font-semibold gap-1.5 rounded-lg'>
                  <Icons.add className='w-3.5 h-3.5' />
                  <span>Thêm sản phẩm</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Profile Card Header chuẩn Base shadcn Card */}
          <div className='flex items-center justify-between p-4 rounded-xl border bg-card shadow-xs'>
            <div className='flex items-center gap-3.5'>
              <div className='relative h-12 w-12 rounded-full overflow-hidden border border-border bg-muted/40 shadow-2xs shrink-0 flex items-center justify-center'>
                {profile?.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile?.displayName || 'Creator'}
                    className='h-full w-full object-cover'
                  />
                ) : (
                  <div className='h-full w-full bg-muted/40 flex items-center justify-center text-muted-foreground/60'>
                    <Icons.user className='h-6 w-6' />
                  </div>
                )}
              </div>
              <div className='min-w-0'>
                <h3 className='font-bold text-sm text-foreground truncate'>
                  {profile?.displayName || 'Đinh Trường Giang'}
                </h3>
                <p className='text-xs text-muted-foreground font-mono'>
                  @{profile?.username || 'dinhgiang'}
                </p>
                {/* Social icons if any */}
                <div className='flex items-center gap-1.5 mt-1.5'>
                  {profile?.socials?.tiktok && (
                    <div
                      className='h-5.5 w-5.5 rounded-md bg-muted flex items-center justify-center text-foreground'
                      title='TikTok'
                    >
                      <Icons.tiktok className='w-3 h-3' />
                    </div>
                  )}
                  {profile?.socials?.instagram && (
                    <div
                      className='h-5.5 w-5.5 rounded-md bg-muted flex items-center justify-center text-pink-600'
                      title='Instagram'
                    >
                      <Icons.instagram className='w-3 h-3' />
                    </div>
                  )}
                  {profile?.socials?.youtube && (
                    <div
                      className='h-5.5 w-5.5 rounded-md bg-muted flex items-center justify-center text-red-600'
                      title='YouTube'
                    >
                      <Icons.youtube className='w-3 h-3' />
                    </div>
                  )}
                  {profile?.socials?.facebook && (
                    <div
                      className='h-5.5 w-5.5 rounded-md bg-muted flex items-center justify-center text-blue-600'
                      title='Facebook'
                    >
                      <Icons.facebook className='w-3 h-3' />
                    </div>
                  )}
                  {profile?.socials?.zalo && (
                    <div
                      className='h-5.5 w-5.5 rounded-md bg-muted flex items-center justify-center text-blue-500'
                      title='Zalo'
                    >
                      <Icons.zalo className='w-3 h-3' />
                    </div>
                  )}
                  {profile?.socials?.threads && (
                    <div
                      className='h-5.5 w-5.5 rounded-md bg-muted flex items-center justify-center text-foreground'
                      title='Threads'
                    >
                      <Icons.threads className='w-3 h-3' />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Link href='/dashboard/settings/storefront'>
              <Button
                type='button'
                variant='outline'
                size='sm'
                className='text-xs h-8 rounded-lg gap-1.5 shrink-0'
              >
                <Icons.edit className='w-3.5 h-3.5' />
                <span>Chỉnh sửa hồ sơ</span>
              </Button>
            </Link>
          </div>

          {/* Category Filter Tabs & Search */}
          <div className='flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3'>
            <div className='flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none'>
              {[
                { key: 'ALL', label: 'Tất cả', icon: Icons.dashboard, color: 'text-foreground' },
                { key: 'DIGITAL', label: 'Sản phẩm số', icon: Icons.post, color: 'text-amber-500' },
                { key: 'LEAD_MAGNET', label: 'Quà 0đ', icon: Icons.gift, color: 'text-rose-500' },
                {
                  key: 'EXTERNAL_LINK',
                  label: 'Liên kết',
                  icon: Icons.link,
                  color: 'text-blue-500'
                }
              ].map((tab) => {
                const TabIcon = tab.icon;
                const count =
                  tab.key === 'ALL'
                    ? products.length
                    : products.filter((p) => p.type === tab.key).length;
                return (
                  <button
                    key={tab.key}
                    type='button'
                    onClick={() => setFilterType(tab.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                      filterType === tab.key
                        ? 'bg-primary text-primary-foreground shadow-2xs font-semibold'
                        : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent'
                    }`}
                  >
                    <TabIcon
                      className={`w-3.5 h-3.5 ${
                        filterType === tab.key ? 'text-inherit' : tab.color
                      }`}
                    />
                    <span>{tab.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        filterType === tab.key
                          ? 'bg-primary-foreground/20 text-inherit'
                          : 'bg-background/80 text-muted-foreground'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className='relative w-full sm:w-48'>
              <Icons.search className='absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground' />
              <Input
                placeholder='Tìm kiếm...'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className='pl-8 h-8 text-xs rounded-lg'
              />
            </div>
          </div>

          {/* Drag & Drop Sortable List */}
          <div className='space-y-3 pt-1'>
            {loading ? (
              <div className='py-16 text-center text-muted-foreground text-xs'>
                <Icons.spinner className='h-5 w-5 animate-spin mx-auto mb-2 text-primary' />
                Đang tải danh sách sản phẩm...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className='py-12 text-center rounded-xl border border-dashed border-border p-6 bg-card space-y-3'>
                <div className='h-12 w-12 rounded-xl bg-muted/60 text-muted-foreground flex items-center justify-center mx-auto shadow-2xs'>
                  <Icons.product className='h-6 w-6' />
                </div>
                <div>
                  <p className='text-sm font-semibold text-foreground'>Chưa có sản phẩm nào</p>
                  <p className='text-xs text-muted-foreground mt-1 max-w-sm mx-auto'>
                    Bấm &quot;Thêm sản phẩm&quot; để tạo sản phẩm số, quà tặng hoặc liên kết bán
                    hàng đầu tiên.
                  </p>
                </div>
                <div className='pt-2'>
                  <Link href='/dashboard/products/create'>
                    <Button size='sm' className='text-xs h-8 rounded-lg gap-1.5'>
                      <Icons.add className='h-3.5 w-3.5' />
                      <span>Thêm sản phẩm mới</span>
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={filteredProducts.map((p) => p.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className='space-y-2.5'>
                    {filteredProducts.map((product) => (
                      <SortableProductItem
                        key={product.id}
                        product={product}
                        onEdit={(p) => {
                          setEditingProduct(p);
                          setIsCreating(false);
                        }}
                        onDelete={handleDelete}
                        onTogglePublish={handleTogglePublish}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}

            {/* Nút thêm sản phẩm full-width dưới list khi đã có sản phẩm */}
            {filteredProducts.length > 0 && (
              <div className='pt-1'>
                <Link href='/dashboard/products/create' className='block w-full'>
                  <Button
                    type='button'
                    variant='outline'
                    className='w-full h-10 rounded-xl font-semibold text-xs border-dashed hover:border-primary hover:bg-primary/5 gap-1.5'
                  >
                    <Icons.add className='h-4 w-4' />
                    <span>+ Thêm sản phẩm mới</span>
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* CỘT PHẢI (Khung giả lập điện thoại - Live Mobile Preview - 5 Cột) */}
        <div className='lg:col-span-5 xl:col-span-5 lg:sticky lg:top-6'>
          <div className='rounded-3xl border border-border bg-card/60 p-5 shadow-xs backdrop-blur-md space-y-4'>
            {/* Preview Toolbar */}
            <div className='flex items-center justify-between pb-2 border-b border-border/60'>
              <div className='flex items-center gap-2'>
                <div className='flex items-center gap-1.5'>
                  <span className='relative flex h-2 w-2'>
                    <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75'></span>
                    <span className='relative inline-flex rounded-full h-2 w-2 bg-emerald-500'></span>
                  </span>
                  <span className='text-xs font-bold text-foreground'>Xem trước tiệm</span>
                </div>
                <Badge variant='outline' className='text-[9px] px-1.5 py-0'>
                  Trực tiếp
                </Badge>
              </div>

              <div className='flex items-center gap-1.5'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleCopyBioLink}
                  className='h-7 px-2 text-[11px] rounded-lg gap-1 cursor-pointer'
                  title='Sao chép link tiệm của bạn'
                >
                  <Icons.copy className='h-3 w-3' />
                  Sao chép link
                </Button>
                {profile && (
                  <a
                    href={`/@${profile.username}`}
                    target='_blank'
                    rel='noreferrer'
                    className='h-7 px-2 text-[11px] rounded-lg inline-flex items-center gap-1 border border-border hover:bg-muted font-medium'
                    title='Xem tiệm thực tế'
                  >
                    <Icons.externalLink className='h-3 w-3' />
                    Ghé tiệm
                  </a>
                )}
              </div>
            </div>

            {/* Mobile Mockup Simulator */}
            {profile && paymentConfig && (
              <PhoneMockup
                profile={profile}
                products={products}
                paymentConfig={paymentConfig}
                className='max-w-[340px] transform scale-95 origin-top'
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
