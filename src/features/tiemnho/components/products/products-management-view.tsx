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
import { GripVertical, FileText, Gift, Package, Link2, ExternalLink } from 'lucide-react';

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

      // Cập nhật UI tức thì cho trải nghiệm mượt mà
      setProducts(reordered);
      toast.success('Đã cập nhật thứ tự hiển thị trên Bio Storefront!');

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
    toast.success('Đã sao chép link Bio Storefront của bạn: ' + url);
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

  // DEFAULT VIEW: MY STORE PRODUCT LIST
  return (
    <div className='space-y-6'>
      {/* Bố cục 2 Cột Kết Hợp Live Mobile Preview */}
      <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 items-start'>
        {/* CỘT TRÁI (Khu vực làm việc & Quản trị - 7 Cột) */}
        <div className='lg:col-span-7 xl:col-span-7 space-y-4'>
          {/* Header Toolbar */}
          <div className='flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-4 rounded-2xl border border-border shadow-xs'>
            <div className='relative flex-1 max-w-sm'>
              <Icons.search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Tìm sản phẩm theo tên...'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className='pl-9 h-9.5 text-xs rounded-xl'
              />
            </div>

            <div className='flex items-center gap-2'>
              <Link href='/dashboard/products/create'>
                <Button
                  type='button'
                  className='h-9.5 text-xs font-semibold rounded-xl gap-1.5 shadow-sm bg-[#FE2C55] hover:bg-[#ef244b] text-white cursor-pointer'
                >
                  <Icons.add className='h-4 w-4' />
                  Đăng sản phẩm mới
                </Button>
              </Link>
            </div>
          </div>

          {/* Category Filter Tabs with Lucide-React Icons */}
          <div className='flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none'>
            {[
              { key: 'ALL', label: 'Tất cả', icon: null },
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
                  type='button'
                  onClick={() => setFilterType(tab.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                    filterType === tab.key
                      ? 'bg-foreground text-background shadow-xs font-semibold'
                      : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {TabIcon && (
                    <TabIcon
                      className={`w-3.5 h-3.5 ${
                        filterType === tab.key ? 'text-inherit' : tab.color
                      }`}
                      strokeWidth={1.75}
                    />
                  )}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Drag & Drop Sortable List */}
          <div className='space-y-2.5'>
            <div className='flex items-center justify-between px-1 text-xs text-muted-foreground'>
              <span className='flex items-center gap-1.5'>
                <GripVertical className='w-4 h-4 text-gray-400' strokeWidth={1.75} />
                <span>Kéo thả để đổi thứ tự trên trang Bio Storefront</span>
              </span>
              <span>Tổng: {filteredProducts.length} sản phẩm</span>
            </div>

            {loading ? (
              <div className='py-16 text-center text-muted-foreground text-xs'>
                <Icons.spinner className='h-5 w-5 animate-spin mx-auto mb-2 text-[#5851DF]' />
                Đang tải danh sách sản phẩm...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className='py-16 text-center rounded-2xl border border-dashed border-border p-6 bg-card space-y-3'>
                <div className='h-12 w-12 rounded-2xl bg-[#5851DF]/10 text-[#5851DF] flex items-center justify-center mx-auto'>
                  <Icons.shoppingCart className='h-6 w-6' />
                </div>
                <div>
                  <p className='text-sm font-bold text-foreground'>
                    Chưa có sản phẩm nào trong cửa hàng
                  </p>
                  <p className='text-xs text-muted-foreground mt-1 max-w-sm mx-auto'>
                    Bấm &quot;Tạo sản phẩm mới&quot; để mở giao diện chỉnh sửa kiểu Stan Store với
                    khung giả lập điện thoại trực quan.
                  </p>
                </div>
                <div className='pt-2'>
                  <Button
                    type='button'
                    onClick={() => {
                      setEditingProduct(null);
                      setIsCreating(true);
                    }}
                    className='rounded-xl text-xs font-bold bg-[#5851DF] hover:bg-[#4a43cb] text-white gap-1.5 cursor-pointer shadow-sm'
                  >
                    <Icons.add className='h-4 w-4' />
                    Tạo sản phẩm đầu tiên
                  </Button>
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
                  <span className='text-xs font-bold text-foreground'>Live Mobile Preview</span>
                </div>
                <Badge variant='outline' className='text-[9px] px-1.5 py-0'>
                  Real-time
                </Badge>
              </div>

              <div className='flex items-center gap-1.5'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleCopyBioLink}
                  className='h-7 px-2 text-[11px] rounded-lg gap-1 cursor-pointer'
                  title='Sao chép link Storefront của bạn'
                >
                  <Icons.copy className='h-3 w-3' />
                  Copy link
                </Button>
                {profile && (
                  <a
                    href={`/@${profile.username}`}
                    target='_blank'
                    rel='noreferrer'
                    className='h-7 px-2 text-[11px] rounded-lg inline-flex items-center gap-1 border border-border hover:bg-muted font-medium'
                    title='Mở toàn màn hình'
                  >
                    <Icons.externalLink className='h-3 w-3' />
                    Mở Bio
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
