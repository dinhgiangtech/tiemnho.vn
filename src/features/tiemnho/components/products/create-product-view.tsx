'use client';

import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ProductType } from '@/constants/mock-tiemnho';
import { DigitalProductForm } from '@/components/dashboard/products/DigitalProductForm';
import { LeadMagnetForm } from '@/components/dashboard/products/LeadMagnetForm';
import { ExternalLinkForm } from '@/components/dashboard/products/ExternalLinkForm';
import { ProductForm } from '@/components/dashboard/products/ProductForm';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';

interface ProductOption {
  type: ProductType;
  title: string;
  desc: string;
  badge?: string;
  tag: string;
  iconName: keyof typeof Icons;
  iconBg: string;
  iconColor: string;
}

// Dùng icon chính thống từ thư viện Icons (@tabler/icons-react) kết hợp styling màu pastel nổi bật
const PRODUCT_OPTIONS: ProductOption[] = [
  {
    type: 'LEAD_MAGNET',
    title: 'Thu thập Email & Lead',
    desc: 'Xây dựng tệp khách hàng tiềm năng bằng tài liệu, checklist hoặc quà tặng miễn phí 0đ.',
    tag: 'Miễn phí 0đ',
    iconName: 'gift',
    iconBg: 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400',
    iconColor: 'text-rose-600 dark:text-rose-400'
  },
  {
    type: 'DIGITAL',
    title: 'Sản phẩm số',
    desc: 'Ebook, Template Notion, Preset Lightroom, video, file tài liệu trả tự động sau khi thanh toán VietQR.',
    tag: 'Trả hàng tự động',
    iconName: 'post',
    iconBg: 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400',
    iconColor: 'text-amber-600 dark:text-amber-400'
  },
  {
    type: 'EXTERNAL_LINK',
    title: 'Nút liên kết ngoài',
    desc: 'Trỏ sang Shopee, TikTok Shop, nhóm kín Zalo/Telegram, kênh YouTube hoặc link Affiliate.',
    tag: 'Chuyển hướng link',
    iconName: 'link',
    iconBg: 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400',
    iconColor: 'text-blue-600 dark:text-blue-400'
  },
  {
    type: 'PHYSICAL',
    title: 'Hàng vật lý & Đặt theo yêu cầu',
    desc: 'Sách in kèm chữ ký, đồ lưu niệm merch, sản phẩm giới hạn với phân loại màu/size và quản lý tồn kho.',
    tag: 'Tồn kho & Size/Màu',
    iconName: 'product',
    iconBg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    iconColor: 'text-emerald-600 dark:text-emerald-400'
  }
];

export function CreateProductView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get('type')?.toUpperCase() as ProductType | null;

  // Nếu có typeParam trên URL thì vào thẳng form, nếu không thì hiển thị Step chọn sản phẩm
  const [selectedType, setSelectedType] = React.useState<ProductType | null>(typeParam || null);

  const handleSelectType = (type: ProductType) => {
    setSelectedType(type);
    const params = new URLSearchParams(searchParams.toString());
    params.set('type', type.toLowerCase());
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const handleBackToSelect = () => {
    setSelectedType(null);
    const params = new URLSearchParams(searchParams.toString());
    params.delete('type');
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  // STEP 1: Chọn loại sản phẩm (Base Shadcn Card UI)
  if (!selectedType) {
    return (
      <div className='max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200'>
        {/* Banner thông báo theo style base card/alert */}
        <div className='flex items-center justify-between rounded-xl border bg-muted/40 p-4 text-xs sm:text-sm text-foreground shadow-xs'>
          <div className='flex items-center gap-3'>
            <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary'>
              <Icons.sparkles className='h-4 w-4' />
            </div>
            <div>
              <p className='font-medium'>
                Khách hàng thanh toán tự động qua <strong>VietQR 24/7</strong> và nhận hàng tức thì.
              </p>
              <p className='text-xs text-muted-foreground'>
                Hệ thống tự động kích hoạt đơn hàng và gửi file/link sau khi phát hiện giao dịch
                thành công.
              </p>
            </div>
          </div>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => router.push('/dashboard/payment')}
            className='hidden sm:inline-flex text-xs font-medium text-primary hover:text-primary hover:bg-primary/10'
          >
            Cài đặt tài khoản ngân hàng
            <Icons.chevronRight className='ml-1 h-3.5 w-3.5' />
          </Button>
        </div>

        {/* Tiêu đề & Hướng dẫn */}
        <div className='space-y-1'>
          <h2 className='text-xl sm:text-2xl font-bold tracking-tight text-foreground'>
            Chọn loại sản phẩm
          </h2>
          <p className='text-sm text-muted-foreground'>
            Lựa chọn mô hình sản phẩm phù hợp nhất với nội dung bạn muốn chia sẻ hoặc mở bán.
          </p>
        </div>

        {/* Grid danh sách loại sản phẩm theo chuẩn shadcn Card của Base template */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          {PRODUCT_OPTIONS.map((item, idx) => {
            const IconComp = (Icons[item.iconName] || Icons.product) as React.ComponentType<{
              className?: string;
            }>;
            return (
              <Card
                key={idx}
                role='button'
                tabIndex={0}
                onClick={() => handleSelectType(item.type)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelectType(item.type);
                  }
                }}
                className='group relative flex flex-col justify-between rounded-xl border border-border/80 bg-card p-5 text-left transition-all duration-200 hover:border-primary/50 hover:bg-muted/30 hover:shadow-xs cursor-pointer'
              >
                <div className='flex items-start justify-between gap-4'>
                  <div className='flex items-start gap-4'>
                    {/* Icon container dùng Icons từ thư viện */}
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border shadow-2xs transition-transform duration-200 group-hover:scale-105 ${item.iconBg}`}
                    >
                      <IconComp className='h-6 w-6 stroke-[1.8]' />
                    </div>

                    <div className='space-y-1.5'>
                      <div className='flex items-center gap-2'>
                        <span className='font-bold text-base text-foreground group-hover:text-primary transition-colors'>
                          {item.title}
                        </span>
                      </div>
                      <p className='text-xs leading-relaxed text-muted-foreground'>{item.desc}</p>
                    </div>
                  </div>

                  <div className='text-muted-foreground/60 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-primary shrink-0 pt-1'>
                    <Icons.chevronRight className='h-5 w-5' />
                  </div>
                </div>

                {/* Footer tag nhỏ bên dưới card */}
                <div className='mt-4 flex items-center justify-between border-t border-border/50 pt-3'>
                  <Badge variant='secondary' className='text-[10px] font-medium'>
                    {item.tag}
                  </Badge>
                  <span className='text-[11px] font-medium text-muted-foreground group-hover:text-primary transition-colors'>
                    Bắt đầu tạo →
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // STEP 2: Render Form chi tiết theo loại sản phẩm được chọn
  return (
    <div className='space-y-6 animate-in fade-in duration-200'>
      {/* Thanh nút quay lại chọn sản phẩm khác */}
      <div className='flex items-center justify-between pb-2 border-b border-border/40'>
        <button
          type='button'
          onClick={handleBackToSelect}
          className='inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer py-1 px-2.5 rounded-lg hover:bg-muted'
        >
          <span>←</span>
          <span>Chọn lại loại sản phẩm khác</span>
        </button>

        <span className='text-xs font-medium text-muted-foreground'>
          Đang tạo:{' '}
          <strong className='text-foreground uppercase'>
            {selectedType === 'DIGITAL'
              ? 'Sản phẩm số'
              : selectedType === 'LEAD_MAGNET'
                ? 'Quà tặng 0đ'
                : selectedType === 'EXTERNAL_LINK'
                  ? 'Nút liên kết'
                  : 'Hàng vật lý'}
          </strong>
        </span>
      </div>

      {selectedType === 'DIGITAL' ? (
        <DigitalProductForm onCancel={handleBackToSelect} />
      ) : selectedType === 'LEAD_MAGNET' ? (
        <LeadMagnetForm onCancel={handleBackToSelect} />
      ) : selectedType === 'EXTERNAL_LINK' ? (
        <ExternalLinkForm onCancel={handleBackToSelect} />
      ) : (
        <ProductForm onCancel={handleBackToSelect} />
      )}
    </div>
  );
}
