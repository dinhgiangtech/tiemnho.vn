'use client';

import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Product, ProductType } from '@/constants/mock-tiemnho';
import { getProductById } from '@/features/tiemnho/api/service';
import { ProductForm } from '@/components/dashboard/products/ProductForm';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ArrowLeft, ChevronRight, Sparkles, Gift, ShoppingBag, Link2 } from 'lucide-react';

interface ProductOption {
  type: ProductType;
  title: string;
  badge: string;
  desc: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  iconBoxBg: string;
  badgeBg: string;
}

const PRODUCT_OPTIONS: ProductOption[] = [
  {
    type: 'DIGITAL',
    title: 'Sản phẩm số',
    badge: 'Tự động 24/7',
    desc: 'Bán Ebook, template Notion, preset màu, khóa học. Tự động trả file/link sau khi quét VietQR.',
    icon: Sparkles,
    iconBoxBg:
      'bg-blue-50 border border-blue-100 text-blue-600 dark:bg-blue-950/40 dark:border-blue-900/60 dark:text-blue-400',
    badgeBg:
      'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-100 dark:border-blue-900/50'
  },
  {
    type: 'LEAD_MAGNET',
    title: 'Quà tặng 0đ',
    badge: 'Thu hút khách hàng',
    desc: 'Tặng tài liệu miễn phí đổi lấy Email và Số điện thoại khách hàng tiềm năng.',
    icon: Gift,
    iconBoxBg:
      'bg-emerald-50 border border-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:border-emerald-900/60 dark:text-emerald-400',
    badgeBg:
      'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/50'
  },
  {
    type: 'PHYSICAL',
    title: 'Hàng đặt trước / Thủ công',
    badge: 'Vận chuyển',
    desc: 'Bán sách in kèm chữ ký, áo merch, phụ kiện thủ công theo yêu cầu (thu địa chỉ giao hàng).',
    icon: ShoppingBag,
    iconBoxBg:
      'bg-amber-50 border border-amber-100 text-amber-600 dark:bg-amber-950/40 dark:border-amber-900/60 dark:text-amber-400',
    badgeBg:
      'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-100 dark:border-amber-900/50'
  },
  {
    type: 'EXTERNAL_LINK',
    title: 'Nút liên kết',
    badge: 'Chuyển hướng',
    desc: 'Dẫn người theo dõi sang Shopee, TikTok Shop, nhóm Zalo hoặc link tiếp thị liên kết.',
    icon: Link2,
    iconBoxBg:
      'bg-purple-50 border border-purple-100 text-purple-600 dark:bg-purple-950/40 dark:border-purple-900/60 dark:text-purple-400',
    badgeBg:
      'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-100 dark:border-purple-900/50'
  }
];

export function CreateProductView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get('type')?.toUpperCase() as ProductType | null;
  const idParam =
    searchParams.get('id') || searchParams.get('edit') || searchParams.get('productId');

  const [loadingProduct, setLoadingProduct] = React.useState<boolean>(!!idParam);
  const [initialProduct, setInitialProduct] = React.useState<Product | null>(null);
  const [selectedType, setSelectedType] = React.useState<ProductType | null>(typeParam || null);

  // Tải dữ liệu sản phẩm nếu URL có id / edit
  React.useEffect(() => {
    if (!idParam) return;

    let isMounted = true;
    async function loadEditProduct() {
      if (!idParam) return;
      setLoadingProduct(true);
      try {
        const prod = await getProductById(idParam);
        if (isMounted) {
          if (prod) {
            setInitialProduct(prod);
            setSelectedType(prod.type);
          } else {
            toast.error('Không tìm thấy thông tin sản phẩm cần chỉnh sửa');
          }
        }
      } catch {
        if (isMounted) {
          toast.error('Có lỗi xảy ra khi tải dữ liệu sản phẩm');
        }
      } finally {
        if (isMounted) {
          setLoadingProduct(false);
        }
      }
    }

    loadEditProduct();
    return () => {
      isMounted = false;
    };
  }, [idParam]);

  const handleSelectType = (type: ProductType) => {
    setSelectedType(type);
    const params = new URLSearchParams(searchParams.toString());
    params.set('type', type.toLowerCase());
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const handleBackToSelect = () => {
    if (initialProduct) {
      router.push('/dashboard/products');
      return;
    }
    setSelectedType(null);
    const params = new URLSearchParams(searchParams.toString());
    params.delete('type');
    params.delete('id');
    params.delete('edit');
    params.delete('productId');
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  // Loading skeleton khi đang fetch sản phẩm để edit
  if (loadingProduct) {
    return (
      <div className='flex flex-col items-center justify-center min-h-[360px] gap-3 text-muted-foreground'>
        <Icons.spinner className='h-7 w-7 animate-spin text-primary' />
        <p className='text-xs font-medium'>Đang tải thông tin sản phẩm...</p>
      </div>
    );
  }

  // STEP 1: Chọn loại sản phẩm (Căn từ trái qua phải, trải rộng toàn màn hình)
  if (!selectedType) {
    return (
      <div className='w-full py-4 animate-in fade-in duration-200'>
        {/* 1. Header trang */}
        <div className='mb-6'>
          <h1 className='text-2xl md:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight'>
            Tạo sản phẩm mới
          </h1>
          <p className='text-[14.5px] text-neutral-500 dark:text-neutral-400 mt-1.5 leading-relaxed'>
            Chọn định dạng mặt hàng bạn muốn bán hoặc chia sẻ trên trang Bio của mình.
          </p>
        </div>

        {/* 2. Lưới 2 hàng căn từ trái qua phải (2 cột trải rộng toàn màn hình) */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-5 w-full'>
          {PRODUCT_OPTIONS.map((item) => {
            const IconComp = item.icon;
            return (
              <div
                key={item.type}
                role='button'
                tabIndex={0}
                onClick={() => handleSelectType(item.type)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelectType(item.type);
                  }
                }}
                className='rounded-2xl border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-card p-5 md:p-6 shadow-xs hover:border-neutral-400 dark:hover:border-neutral-600 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-between cursor-pointer group gap-4 w-full'
              >
                {/* Bên trái: Cụm Icon & Nội dung */}
                <div className='flex items-center gap-5 min-w-0'>
                  {/* Box Icon vuông bo góc tròn mềm mại */}
                  <div
                    className={cn(
                      'w-13 h-13 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs',
                      item.iconBoxBg
                    )}
                  >
                    <IconComp className='w-6 h-6' strokeWidth={2.2} />
                  </div>

                  {/* Cụm văn bản */}
                  <div className='min-w-0 flex-1'>
                    {/* Dòng trên: Tiêu đề + Badge */}
                    <div className='flex items-center gap-2.5 flex-wrap'>
                      <h3 className='text-base sm:text-lg font-bold text-neutral-900 dark:text-white tracking-tight group-hover:text-neutral-950 dark:group-hover:text-white transition-colors'>
                        {item.title}
                      </h3>
                      <span
                        className={cn(
                          'text-[11px] px-2 py-0.5 rounded-md font-semibold tracking-normal shrink-0',
                          item.badgeBg
                        )}
                      >
                        {item.badge}
                      </span>
                    </div>

                    {/* Dòng dưới: Mô tả ngắn gọn súc tích */}
                    <p className='text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2 leading-relaxed font-normal'>
                      {item.desc}
                    </p>
                  </div>
                </div>

                {/* Bên phải: Nút mũi tên chuyển tiếp tròn tối giản */}
                <div className='w-9 h-9 rounded-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200/60 dark:border-neutral-700 flex items-center justify-center text-neutral-400 dark:text-neutral-500 group-hover:bg-[#161823] group-hover:text-white group-hover:border-[#161823] dark:group-hover:bg-white dark:group-hover:text-neutral-900 dark:group-hover:border-white transition-all shrink-0 shadow-2xs'>
                  <ChevronRight className='w-4.5 h-4.5 group-hover:translate-x-0.5 transition-transform' />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // STEP 2: Render Form chi tiết theo loại sản phẩm được chọn
  return (
    <div className='w-full animate-in fade-in duration-200'>
      <ProductForm
        initialProduct={initialProduct}
        initialType={selectedType}
        onCancel={handleBackToSelect}
        onSuccess={() => router.push('/dashboard/products')}
      />
    </div>
  );
}
