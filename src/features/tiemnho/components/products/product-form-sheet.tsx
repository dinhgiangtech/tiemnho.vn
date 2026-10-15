'use client';

import * as React from 'react';
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { toast } from 'sonner';
import { Product, ProductType } from '@/constants/mock-tiemnho';
import { createProduct, updateProduct } from '../../api/service';

interface ProductFormSheetProps {
  product?: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PRODUCT_TYPE_OPTIONS: { type: ProductType; label: string; desc: string; icon: string }[] = [
  {
    type: 'DIGITAL',
    label: 'Sản phẩm số',
    desc: 'Ebook, Template Notion, Preset, file PDF/Zip...',
    icon: 'file'
  },
  {
    type: 'LEAD_MAGNET',
    label: 'Quà tặng 0đ (Lead Magnet)',
    desc: 'Checklist, cẩm nang miễn phí để thu thập Email & SĐT',
    icon: 'gift'
  },
  {
    type: 'PHYSICAL',
    label: 'Hàng vật lý / Theo yêu cầu',
    desc: 'Sách in, áo thun merch, sổ tay có chữ ký...',
    icon: 'product'
  },
  {
    type: 'EXTERNAL_LINK',
    label: 'Nút chuyển hướng',
    desc: 'Trỏ sang Shopee, TikTok Shop, nhóm Zalo, YouTube...',
    icon: 'externalLink'
  }
];

export function ProductFormSheet({ product, isOpen, onClose, onSuccess }: ProductFormSheetProps) {
  const isEdit = !!product;
  const [loading, setLoading] = React.useState(false);

  // Form states
  const [type, setType] = React.useState<ProductType>('DIGITAL');
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [price, setPrice] = React.useState<number>(149000);
  const [originalPrice, setOriginalPrice] = React.useState<number | undefined>(299000);
  const [coverImage, setCoverImage] = React.useState('');
  const [fileUrl, setFileUrl] = React.useState('');
  const [fileName, setFileName] = React.useState('');
  const [externalUrl, setExternalUrl] = React.useState('');
  const [buttonText, setButtonText] = React.useState('');
  const [stock, setStock] = React.useState<number | undefined>(50);
  const [isPublished, setIsPublished] = React.useState(true);
  const [isFeatured, setIsFeatured] = React.useState(false);

  React.useEffect(() => {
    if (product) {
      setType(product.type);
      setTitle(product.title);
      setDescription(product.description);
      setPrice(product.price);
      setOriginalPrice(product.originalPrice);
      setCoverImage(product.coverImage);
      setFileUrl(product.fileUrl || '');
      setFileName(product.fileName || '');
      setExternalUrl(product.externalUrl || '');
      setButtonText(product.buttonText || '');
      setStock(product.stock);
      setIsPublished(product.isPublished);
      setIsFeatured(product.isFeatured);
    } else {
      setType('DIGITAL');
      setTitle('');
      setDescription('');
      setPrice(149000);
      setOriginalPrice(299000);
      setCoverImage(
        'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=600&q=80'
      );
      setFileUrl('https://notion.so/giangdinh/tai-nguyen-mau');
      setFileName('Tai-Lieu-Dac-Biet.pdf');
      setExternalUrl('');
      setButtonText('');
      setStock(50);
      setIsPublished(true);
      setIsFeatured(false);
    }
  }, [product, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Vui lòng nhập tên sản phẩm');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        type,
        title: title.trim(),
        description: description.trim(),
        price: type === 'LEAD_MAGNET' || type === 'EXTERNAL_LINK' ? 0 : Number(price) || 0,
        originalPrice: originalPrice ? Number(originalPrice) : undefined,
        coverImage:
          coverImage.trim() ||
          'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
        fileUrl: fileUrl.trim() || undefined,
        fileName: fileName.trim() || undefined,
        externalUrl: externalUrl.trim() || undefined,
        buttonText: buttonText.trim() || undefined,
        stock: type === 'PHYSICAL' ? Number(stock) || 0 : undefined,
        isPublished,
        isFeatured
      };

      if (isEdit && product) {
        await updateProduct(product.id, payload);
        toast.success('Đã cập nhật sản phẩm thành công!');
      } else {
        await createProduct(payload);
        toast.success('Đã thêm sản phẩm mới vào Storefront!');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi lưu sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side='right' className='w-full sm:max-w-lg flex flex-col p-0'>
        <SheetHeader className='p-6 pb-4 border-b border-border'>
          <SheetTitle className='text-lg font-bold'>
            {isEdit ? 'Chỉnh sửa sản phẩm' : 'Đăng sản phẩm mới'}
          </SheetTitle>
        </SheetHeader>

        <form
          id='product-sheet-form'
          onSubmit={handleSubmit}
          className='flex-1 overflow-y-auto p-6 space-y-5 text-xs'
        >
          {/* 1. Chọn loại sản phẩm */}
          <div className='space-y-2'>
            <label className='font-semibold text-foreground block text-sm'>
              Loại sản phẩm (Phase 1 MVP)
            </label>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-2.5'>
              {PRODUCT_TYPE_OPTIONS.map((opt) => (
                <div
                  key={opt.type}
                  onClick={() => {
                    setType(opt.type);
                    if (opt.type === 'LEAD_MAGNET') setPrice(0);
                  }}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    type === opt.type
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border hover:border-primary/40'
                  }`}
                >
                  <div className='font-semibold text-xs text-foreground mb-0.5'>{opt.label}</div>
                  <div className='text-[11px] text-muted-foreground leading-snug'>{opt.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Tiêu đề & Mô tả */}
          <div className='space-y-1.5'>
            <label className='font-medium text-foreground text-xs'>
              Tiêu đề sản phẩm <span className='text-primary font-bold'>*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder='VD: Kho Template Notion Quản Lý PARA 2026'
              className='h-10 text-sm rounded-xl'
              required
            />
          </div>

          <div className='space-y-1.5'>
            <label className='font-medium text-foreground text-xs'>Mô tả chi tiết</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder='Nêu bật giá trị và nội dung tài nguyên khách sẽ nhận được...'
              className='min-h-[80px] text-sm rounded-xl resize-none'
            />
          </div>

          {/* 3. Giá bán (nếu không phải 0đ) */}
          {type !== 'LEAD_MAGNET' && type !== 'EXTERNAL_LINK' && (
            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-1.5'>
                <label className='font-medium text-foreground text-xs'>
                  Giá bán (VNĐ) <span className='text-primary font-bold'>*</span>
                </label>
                <Input
                  type='number'
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  placeholder='149000'
                  className='h-10 text-sm rounded-xl'
                  required
                />
              </div>

              <div className='space-y-1.5'>
                <label className='font-medium text-foreground text-xs'>
                  Giá gốc (để gạch ngang)
                </label>
                <Input
                  type='number'
                  value={originalPrice || ''}
                  onChange={(e) =>
                    setOriginalPrice(e.target.value ? Number(e.target.value) : undefined)
                  }
                  placeholder='299000'
                  className='h-10 text-sm rounded-xl'
                />
              </div>
            </div>
          )}

          {/* 4. Ảnh bìa Cover Image */}
          <div className='space-y-1.5'>
            <label className='font-medium text-foreground text-xs'>URL Ảnh bìa (Cover Image)</label>
            <Input
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder='https://images.unsplash.com/...'
              className='h-10 text-sm rounded-xl'
            />
            {coverImage && (
              <div className='h-24 w-full rounded-xl overflow-hidden border border-border mt-2 bg-muted'>
                <img src={coverImage} alt='Preview' className='h-full w-full object-cover' />
              </div>
            )}
          </div>

          {/* 5. Cấu hình theo từng loại */}
          {(type === 'DIGITAL' || type === 'LEAD_MAGNET') && (
            <div className='rounded-xl border border-primary/20 bg-primary/5 p-3.5 space-y-3'>
              <div className='font-semibold text-xs text-primary flex items-center gap-1.5'>
                <Icons.download className='h-4 w-4' />
                Cấu hình Tài nguyên Tự Động Giao (Fulfillment)
              </div>
              <div className='space-y-1.5'>
                <label className='text-[11px] text-muted-foreground'>
                  Đường dẫn tải file (Cloudflare R2 / Google Drive / Notion):
                </label>
                <Input
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  placeholder='https://notion.so/...'
                  className='h-9 text-xs rounded-lg bg-background'
                />
              </div>
              <div className='space-y-1.5'>
                <label className='text-[11px] text-muted-foreground'>
                  Tên tệp hiển thị khi tải về:
                </label>
                <Input
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder='Notion-PARA-Mastery.pdf'
                  className='h-9 text-xs rounded-lg bg-background'
                />
              </div>
            </div>
          )}

          {type === 'PHYSICAL' && (
            <div className='rounded-xl border border-border bg-muted/30 p-3.5 space-y-2.5'>
              <div className='font-semibold text-xs text-foreground flex items-center gap-1.5'>
                <Icons.product className='h-4 w-4' />
                Tồn kho hàng vật lý
              </div>
              <div className='space-y-1.5'>
                <label className='text-[11px] text-muted-foreground'>
                  Số lượng tồn kho giới hạn:
                </label>
                <Input
                  type='number'
                  value={stock || ''}
                  onChange={(e) => setStock(Number(e.target.value))}
                  placeholder='50'
                  className='h-9 text-xs rounded-lg'
                />
              </div>
            </div>
          )}

          {type === 'EXTERNAL_LINK' && (
            <div className='rounded-xl border border-border bg-muted/30 p-3.5 space-y-2.5'>
              <div className='font-semibold text-xs text-foreground flex items-center gap-1.5'>
                <Icons.externalLink className='h-4 w-4' />
                Cấu hình liên kết chuyển hướng
              </div>
              <div className='space-y-1.5'>
                <label className='text-[11px] text-muted-foreground'>Đường dẫn đích (URL):</label>
                <Input
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  placeholder='https://zalo.me/g/...'
                  className='h-9 text-xs rounded-lg'
                />
              </div>
              <div className='space-y-1.5'>
                <label className='text-[11px] text-muted-foreground'>Chữ trên nút bấm:</label>
                <Input
                  value={buttonText}
                  onChange={(e) => setButtonText(e.target.value)}
                  placeholder='Tham gia nhóm Zalo miễn phí'
                  className='h-9 text-xs rounded-lg'
                />
              </div>
            </div>
          )}

          {/* 6. Trạng thái hiển thị */}
          <div className='flex items-center justify-between pt-2 border-t border-border'>
            <div>
              <div className='font-semibold text-xs text-foreground'>Hiển thị trên Storefront</div>
              <div className='text-[11px] text-muted-foreground'>
                Bật để người mua nhìn thấy trên bio
              </div>
            </div>
            <input
              type='checkbox'
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className='h-5 w-5 accent-primary cursor-pointer'
            />
          </div>

          <div className='flex items-center justify-between'>
            <div>
              <div className='font-semibold text-xs text-foreground'>Ghim nổi bật (HOT)</div>
              <div className='text-[11px] text-muted-foreground'>
                Hiển thị viền nổi bật thu hút lượt click
              </div>
            </div>
            <input
              type='checkbox'
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className='h-5 w-5 accent-primary cursor-pointer'
            />
          </div>
        </form>

        <SheetFooter className='p-6 pt-3 border-t border-border flex gap-2'>
          <Button variant='outline' onClick={onClose} className='flex-1 h-10 rounded-xl'>
            Hủy
          </Button>
          <Button
            type='submit'
            form='product-sheet-form'
            disabled={loading}
            className='flex-1 h-10 rounded-xl font-semibold'
          >
            {loading ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Đăng bán ngay'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
