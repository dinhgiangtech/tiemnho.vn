'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import { ProductForm } from '@/components/dashboard/products/ProductForm';
import { LivePreviewContainer } from '../mobile-preview/live-preview-container';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { SocialIconBadge } from '@/components/common/social-icons';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function ProductsManagementView() {
  const router = useRouter();
  const [products, setProducts] = React.useState<Product[]>([]);
  const [profile, setProfile] = React.useState<CreatorProfile | null>(null);
  const [paymentConfig, setPaymentConfig] = React.useState<PaymentConfig | null>(null);
  const [loading, setLoading] = React.useState(true);

  // State sản phẩm đang chỉnh sửa
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

  // NẾU ĐANG CHỈNH SỬA: HIỂN THỊ MÀN HÌNH FORM CHỈNH SỬA ĐỒNG BỘ VỚI MÀN TẠO SẢN PHẨM
  if (editingProduct !== null) {
    const handleCloseEdit = () => {
      setEditingProduct(null);
    };

    const handleSuccessEdit = () => {
      setEditingProduct(null);
      fetchData();
    };

    return (
      <div className='w-full animate-in fade-in duration-200'>
        <ProductForm
          initialProduct={editingProduct}
          onCancel={handleCloseEdit}
          onSuccess={handleSuccessEdit}
        />
      </div>
    );
  }

  // DEFAULT VIEW: STAN STORE PRODUCT LIST
  return (
    <div className='space-y-6'>
      {/* Bố cục 2 Cột Kết Hợp Live Mobile Preview */}
      <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 items-start'>
        {/* CỘT TRÁI (Khu vực làm việc & Quản trị - 7 Cột) */}
        <div className='lg:col-span-7 xl:col-span-7 space-y-4'>
          {/* 1. Header điều hướng + Nút chính + Thêm sản phẩm đỏ hồng TikTok */}
          <div className='flex items-center justify-between pb-1'>
            <h1 className='text-xl md:text-2xl font-extrabold text-neutral-900 dark:text-white tracking-tight'>
              Tiệm của bạn
            </h1>
            <Link href='/dashboard/products/create'>
              <Button
                size='sm'
                className='h-10 px-5 py-2.5 text-sm font-bold gap-2 rounded-xl shadow-sm cursor-pointer transition-all active:scale-[0.98]'
              >
                <Icons.add className='w-4 h-4' />
                <span>Thêm sản phẩm</span>
              </Button>
            </Link>
          </div>

          {/* 2. Thẻ Profile Creator: Desktop giữ ngang hàng như cũ, Mobile tách nút xuống dưới */}
          <div className='p-4 md:p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-card shadow-xs transition-all'>
            <div className='flex items-start md:items-center justify-between gap-4'>
              <div className='flex items-start md:items-center gap-3.5 sm:gap-4 min-w-0'>
                {/* Avatar tròn cố định 56x56px (w-14 h-14) */}
                <div className='w-14 h-14 rounded-full overflow-hidden border border-neutral-200/80 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 shadow-2xs shrink-0 flex items-center justify-center'>
                  <img
                    src={profile?.avatarUrl || '/default-avatar.svg'}
                    alt={profile?.displayName || 'Creator'}
                    className='w-full h-full object-cover shrink-0'
                  />
                </div>

                {/* Khối chữ: Tên đầy đủ, link tiệm & icon mạng xã hội */}
                <div className='min-w-0'>
                  {/* Dòng 1: Tên hiển thị */}
                  <h3 className='font-bold text-base md:text-lg text-neutral-900 dark:text-white leading-tight tracking-tight'>
                    {profile?.displayName || 'Đinh Trường Giang'}
                  </h3>

                  {/* Dòng 2: username và link tiệm kèm icon sao chép */}
                  <div className='flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 mt-1 flex-wrap'>
                    <span className='font-medium'>@{profile?.username || 'giangdinh'}</span>
                    <span className='text-neutral-300 dark:text-neutral-700'>•</span>
                    <div className='flex items-center gap-1 font-mono text-neutral-600 dark:text-neutral-300'>
                      <span>tiemnho.vn/@{profile?.username || 'giangdinh'}</span>
                      <button
                        type='button'
                        onClick={handleCopyBioLink}
                        className='p-0.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors cursor-pointer inline-flex items-center justify-center'
                        title='Sao chép link tiệm nhanh'
                      >
                        <Icons.copy className='w-3 h-3' />
                      </button>
                    </div>
                  </div>

                  {/* Dòng 3 (Hàng icon mạng xã hội): Đặt ngay dưới link, kích thước cố định */}
                  <div className='flex items-center gap-2 mt-2 flex-wrap'>
                    {profile?.socials?.tiktok && (
                      <a
                        href={profile.socials.tiktok}
                        target='_blank'
                        rel='noreferrer'
                        className='w-6 h-6 rounded-md bg-neutral-100 hover:bg-neutral-200 dark:bg-muted dark:hover:bg-muted/80 border border-border/40 flex items-center justify-center shrink-0 text-neutral-600 hover:text-neutral-900 transition-colors shadow-2xs'
                        title='TikTok'
                      >
                        <SocialIconBadge platform='tiktok' size='xs' className='w-4 h-4' />
                      </a>
                    )}
                    {profile?.socials?.instagram && (
                      <a
                        href={profile.socials.instagram}
                        target='_blank'
                        rel='noreferrer'
                        className='w-6 h-6 rounded-md bg-neutral-100 hover:bg-neutral-200 dark:bg-muted dark:hover:bg-muted/80 border border-border/40 flex items-center justify-center shrink-0 text-neutral-600 hover:text-neutral-900 transition-colors shadow-2xs'
                        title='Instagram'
                      >
                        <SocialIconBadge platform='instagram' size='xs' className='w-4 h-4' />
                      </a>
                    )}
                    {profile?.socials?.youtube && (
                      <a
                        href={profile.socials.youtube}
                        target='_blank'
                        rel='noreferrer'
                        className='w-6 h-6 rounded-md bg-neutral-100 hover:bg-neutral-200 dark:bg-muted dark:hover:bg-muted/80 border border-border/40 flex items-center justify-center shrink-0 text-neutral-600 hover:text-neutral-900 transition-colors shadow-2xs'
                        title='YouTube'
                      >
                        <SocialIconBadge platform='youtube' size='xs' className='w-4 h-4' />
                      </a>
                    )}
                    {profile?.socials?.facebook && (
                      <a
                        href={profile.socials.facebook}
                        target='_blank'
                        rel='noreferrer'
                        className='w-6 h-6 rounded-md bg-neutral-100 hover:bg-neutral-200 dark:bg-muted dark:hover:bg-muted/80 border border-border/40 flex items-center justify-center shrink-0 text-neutral-600 hover:text-neutral-900 transition-colors shadow-2xs'
                        title='Facebook'
                      >
                        <SocialIconBadge platform='facebook' size='xs' className='w-4 h-4' />
                      </a>
                    )}
                    {profile?.socials?.zalo && (
                      <a
                        href={
                          profile.socials.zalo.startsWith('http')
                            ? profile.socials.zalo
                            : `https://zalo.me/${profile.socials.zalo}`
                        }
                        target='_blank'
                        rel='noreferrer'
                        className='w-6 h-6 rounded-md bg-neutral-100 hover:bg-neutral-200 dark:bg-muted dark:hover:bg-muted/80 border border-border/40 flex items-center justify-center shrink-0 text-neutral-600 hover:text-neutral-900 transition-colors shadow-2xs'
                        title='Zalo'
                      >
                        <SocialIconBadge platform='zalo' size='xs' className='w-4 h-4' />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Nút Chỉnh sửa hồ sơ trên Desktop (>= md) nằm bên phải ngang hàng như cũ */}
              <Link href='/dashboard/settings/storefront' className='hidden md:block shrink-0'>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  className='text-xs sm:text-sm h-9 px-3.5 rounded-xl gap-1.5 shrink-0 font-medium'
                >
                  <Icons.edit className='w-3.5 h-3.5' />
                  <span>Chỉnh sửa hồ sơ</span>
                </Button>
              </Link>
            </div>

            {/* Nút Chỉnh sửa hồ sơ trên Mobile (< md) dãn rộng toàn bộ chiều ngang thẻ */}
            <Link href='/dashboard/settings/storefront' className='block md:hidden w-full'>
              <button
                type='button'
                className='w-full mt-3.5 py-2.5 rounded-xl border border-neutral-200/90 dark:border-neutral-700 text-sm font-semibold flex items-center justify-center gap-2 bg-neutral-50 hover:bg-neutral-100 active:bg-neutral-100 dark:bg-neutral-800/60 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer shadow-2xs'
              >
                <Icons.edit className='w-4 h-4' />
                <span>Chỉnh sửa hồ sơ</span>
              </button>
            </Link>
          </div>

          {/* 3. Tiêu đề danh sách sản phẩm */}
          <div className='flex items-center justify-between pt-1 pb-0.5'>
            <div className='flex items-center gap-2'>
              <h4 className='text-sm font-bold text-neutral-900 dark:text-white'>
                Danh sách sản phẩm
              </h4>
              <span className='inline-flex items-center px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[11px] font-bold text-neutral-500 dark:text-neutral-400'>
                {products.length}
              </span>
            </div>
            <p className='text-xs text-neutral-400 hidden sm:block'>
              Kéo thả các thẻ để sắp xếp thứ tự hiển thị
            </p>
          </div>

          {/* Drag & Drop Sortable List */}
          <div className='space-y-3 pt-1'>
            {loading ? (
              <div className='py-16 text-center text-muted-foreground text-xs'>
                <Icons.spinner className='h-5 w-5 animate-spin mx-auto mb-2 text-primary' />
                Đang tải danh sách sản phẩm...
              </div>
            ) : products.length === 0 ? (
              <div className='py-12 text-center rounded-2xl border border-dashed border-border p-6 bg-card space-y-3'>
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
                    <Button size='sm' className='text-xs h-8.5 rounded-xl gap-1.5'>
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
                  items={products.map((p) => p.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className='space-y-2.5'>
                    {products.map((product) => (
                      <SortableProductItem
                        key={product.id}
                        product={product}
                        onEdit={(p) => {
                          router.push(`/dashboard/products/create?edit=${p.id}`);
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

        {/* CỘT PHẢI (Khung giả lập điện thoại - Live Mobile Preview - Chỉ hiển thị trên Desktop >= md) */}
        <div className='hidden md:block lg:col-span-5 xl:col-span-5 lg:sticky lg:top-6'>
          <div className='rounded-3xl border border-border/80 bg-card/40 p-4 shadow-xs backdrop-blur-md flex flex-col items-center'>
            {/* Mobile / Desktop Simulator */}
            {profile && paymentConfig && (
              <LivePreviewContainer
                profile={profile}
                products={products}
                paymentConfig={paymentConfig}
                className='w-full'
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
