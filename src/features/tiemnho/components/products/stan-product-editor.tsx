'use client';

import * as React from 'react';
import { Product, ProductType, CreatorProfile, PaymentConfig } from '@/constants/mock-tiemnho';
import { createProduct, updateProduct, deleteProduct } from '../../api/service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Icons } from '@/components/icons';
import { toast } from 'sonner';
import { FileText, Gift, Package, Link2, ExternalLink, CheckCircle2, Globe, X } from 'lucide-react';

interface StanProductEditorProps {
  product?: Product | null;
  profile: CreatorProfile;
  paymentConfig: PaymentConfig;
  allProducts: Product[];
  onBack: () => void;
  onSaved: () => void;
}

type TabType = 'thumbnail' | 'checkout' | 'options';
type CardStyle = 'callout' | 'button';

export function StanProductEditor({
  product,
  profile,
  paymentConfig,
  allProducts,
  onBack,
  onSaved
}: StanProductEditorProps) {
  const isEdit = !!product;
  const [activeTab, setActiveTab] = React.useState<TabType>('thumbnail');
  const [previewDevice, setPreviewDevice] = React.useState<'phone' | 'desktop'>('phone');
  const [loading, setLoading] = React.useState(false);
  const [showHowItWorks, setShowHowItWorks] = React.useState(false);

  // Form states matching Stan Store layout
  const [cardStyle, setCardStyle] = React.useState<CardStyle>('callout');
  const [type, setType] = React.useState<ProductType>(product?.type || 'DIGITAL');
  const [title, setTitle] = React.useState(product?.title || 'Personalized Video Response');
  const [description, setDescription] = React.useState(
    product?.description || "I'll send you a custom video/product addressing your unique request!"
  );
  const [buttonText, setButtonText] = React.useState(product?.buttonText || 'Submit Your Request');
  const [price, setPrice] = React.useState<number>(product?.price ?? 149000);
  const [originalPrice, setOriginalPrice] = React.useState<number | undefined>(
    product?.originalPrice ?? 299000
  );
  const [coverImage, setCoverImage] = React.useState(
    product?.coverImage || '/images/red-giftbox.jpg'
  );
  const [fileUrl, setFileUrl] = React.useState(product?.fileUrl || '');
  const [fileName, setFileName] = React.useState(product?.fileName || 'Personalized-Guide.pdf');
  const [externalUrl, setExternalUrl] = React.useState(product?.externalUrl || '');
  const [stock, setStock] = React.useState<number | undefined>(product?.stock ?? 50);
  const [isPublished, setIsPublished] = React.useState(product?.isPublished ?? true);
  const [isFeatured, setIsFeatured] = React.useState(product?.isFeatured ?? false);

  // Character limits matching Stan Store
  const TITLE_MAX = 50;
  const SUBTITLE_MAX = 100;
  const BUTTON_MAX = 30;

  // Preset image choices
  const [showImagePicker, setShowImagePicker] = React.useState(false);
  const PRESET_IMAGES = [
    {
      label: 'Hộp quà 3D Stan Store',
      url: '/images/red-giftbox.jpg'
    },
    {
      label: 'Lá cây thiên nhiên',
      url: '/images/green-nature.jpg'
    },
    {
      label: 'Sổ tay Notion & Bút',
      url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&h=400&q=80'
    },
    {
      label: 'Template PARA System',
      url: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=400&h=400&q=80'
    },
    {
      label: 'Video & Audio Creator',
      url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&h=400&q=80'
    },
    {
      label: 'Sách & Ebook tri thức',
      url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=400&h=400&q=80'
    }
  ];

  // Live draft product object for real-time preview in the phone simulator
  const livePreviewProduct: Product = React.useMemo(() => {
    return {
      id: product?.id || 'preview-prod',
      creatorId: profile.id,
      type,
      title: title || 'Personalized Video Response',
      description:
        description || "I'll send you a custom video/product addressing your unique request!",
      price: Number(price) || 0,
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      coverImage,
      fileUrl,
      fileName,
      externalUrl,
      buttonText: buttonText || 'Submit Your Request',
      isPublished,
      isFeatured,
      displayOrder: product?.displayOrder || 1,
      soldCount: product?.soldCount || 0,
      stock,
      createdAt: product?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }, [
    product,
    profile.id,
    type,
    title,
    description,
    price,
    originalPrice,
    coverImage,
    fileUrl,
    fileName,
    externalUrl,
    buttonText,
    isPublished,
    isFeatured,
    stock
  ]);

  // Copy store link
  const handleCopyStoreLink = () => {
    const url = `${window.location.origin}/@${profile.username}`;
    navigator.clipboard.writeText(url);
    toast.success('Đã sao chép link Storefront của bạn: stan.store/' + profile.username);
  };

  // Submit Handler
  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Vui lòng nhập tiêu đề sản phẩm (Title)');
      return;
    }

    setLoading(true);
    try {
      if (isEdit && product) {
        await updateProduct(product.id, {
          type,
          title: title.trim(),
          description: description.trim(),
          price: Number(price) || 0,
          originalPrice: originalPrice ? Number(originalPrice) : undefined,
          coverImage,
          fileUrl,
          fileName,
          externalUrl,
          buttonText: buttonText.trim(),
          stock: type === 'PHYSICAL' ? stock : undefined,
          isPublished,
          isFeatured
        });
        toast.success('Đã cập nhật sản phẩm thành công!');
      } else {
        await createProduct({
          type,
          title: title.trim(),
          description: description.trim(),
          price: Number(price) || 0,
          originalPrice: originalPrice ? Number(originalPrice) : undefined,
          coverImage,
          fileUrl,
          fileName,
          externalUrl,
          buttonText: buttonText.trim(),
          stock: type === 'PHYSICAL' ? stock : undefined,
          isPublished,
          isFeatured
        });
        toast.success('Đã đăng sản phẩm mới lên gian hàng!');
      }
      onSaved();
    } catch {
      toast.error('Lỗi khi lưu sản phẩm vào cơ sở dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  // Delete handler
  const handleDeleteCurrent = async () => {
    if (!product) return;
    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;
    setLoading(true);
    try {
      await deleteProduct(product.id);
      toast.success('Đã xóa sản phẩm khỏi gian hàng');
      onSaved();
    } catch {
      toast.error('Không thể xóa sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-[calc(100vh-4rem)] flex flex-col bg-slate-50/50 dark:bg-background'>
      {/* ======================================================== */}
      {/* 1. TOP HEADER & TABS BAR (Chuẩn xác 100% Stan Store) */}
      {/* ======================================================== */}
      <header className='border-b border-border bg-card/95 backdrop-blur-md px-4 sm:px-8 py-2.5 sticky top-14 z-20'>
        <div className='flex flex-wrap items-center justify-between gap-y-3 gap-x-6'>
          {/* Left: Breadcrumbs + Main Tabs */}
          <div className='flex items-center gap-6 overflow-x-auto scrollbar-none'>
            {/* Breadcrumb: ← My Store / Edit Product */}
            <div className='flex items-center gap-2 whitespace-nowrap text-sm font-semibold'>
              <button
                type='button'
                onClick={onBack}
                className='inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer group'
              >
                {(Icons.arrowLeft && (
                  <Icons.arrowLeft className='h-4 w-4 transition-transform group-hover:-translate-x-0.5' />
                )) || (
                  <Icons.chevronLeft className='h-4 w-4 transition-transform group-hover:-translate-x-0.5' />
                )}
                <span>My Store</span>
              </button>
              <span className='text-slate-300 dark:text-slate-700 font-light'>/</span>
              <span className='text-slate-900 dark:text-white font-bold'>
                {isEdit ? 'Edit Product' : 'Create Product'}
              </span>
            </div>

            {/* Stan Store Tabs */}
            <nav className='flex items-center gap-1 border-l border-border pl-4 text-xs font-semibold'>
              {/* Tab 1: Thumbnail */}
              <button
                type='button'
                onClick={() => setActiveTab('thumbnail')}
                className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'thumbnail'
                    ? 'text-[#5851DF] bg-[#5851DF]/10 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icons.media className='h-4 w-4' />
                <span>Thumbnail</span>
              </button>

              {/* Tab 2: Checkout Page */}
              <button
                type='button'
                onClick={() => setActiveTab('checkout')}
                className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'checkout'
                    ? 'text-[#5851DF] bg-[#5851DF]/10 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icons.shoppingCart className='h-4 w-4' />
                <span>Checkout Page</span>
              </button>

              {/* Tab 3: Options */}
              <button
                type='button'
                onClick={() => setActiveTab('options')}
                className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'options'
                    ? 'text-[#5851DF] bg-[#5851DF]/10 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icons.adjustments className='h-4 w-4' />
                <span>Options</span>
              </button>

              {/* How it works Button */}
              <button
                type='button'
                onClick={() => setShowHowItWorks(true)}
                className='ml-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#5851DF]/10 hover:bg-[#5851DF]/20 text-[#5851DF] text-xs font-semibold transition-all cursor-pointer'
              >
                <span className='h-4 w-4 rounded-full bg-[#5851DF] text-white flex items-center justify-center text-[8px]'>
                  ▶
                </span>
                <span>How it works</span>
              </button>
            </nav>
          </div>

          {/* Right: Storefront URL + Action Button */}
          <div className='flex items-center gap-3 ml-auto'>
            <button
              type='button'
              onClick={handleCopyStoreLink}
              className='inline-flex items-center gap-1.5 text-xs font-semibold text-[#5851DF] hover:underline cursor-pointer'
              title='Sao chép liên kết cửa hàng'
            >
              <span>stan.store/{profile.username}</span>
              <Icons.copy className='h-3.5 w-3.5' />
            </button>

            <Button
              type='button'
              onClick={handleSave}
              disabled={loading}
              className='rounded-xl font-bold text-xs h-9 px-5 bg-[#5851DF] hover:bg-[#4a43cb] text-white shadow-sm cursor-pointer'
            >
              {loading && <Icons.spinner className='h-3.5 w-3.5 animate-spin mr-1.5' />}
              <span>{isEdit ? 'Lưu thay đổi' : 'Đăng sản phẩm'}</span>
            </Button>
          </div>
        </div>
      </header>

      {/* ======================================================== */}
      {/* 2. MAIN 2-COLUMN VIEW: FORM (LEFT) & SIMULATOR (RIGHT) */}
      {/* ======================================================== */}
      <main className='flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-8'>
        <div className='grid grid-cols-1 lg:grid-cols-12 gap-10 items-start'>
          {/* ==================================================== */}
          {/* CỘT TRÁI: 3-STEP BUILDER FORM (7 Cột) */}
          {/* ==================================================== */}
          <div className='lg:col-span-7 xl:col-span-7 space-y-8'>
            {/* -------------------------------------------------- */}
            {/* TAB 1: THUMBNAIL (1. Style, 2. Image, 3. Text) */}
            {/* -------------------------------------------------- */}
            {activeTab === 'thumbnail' && (
              <div className='space-y-8 animate-in fade-in-50 duration-200'>
                {/* STEP 1: PICK A STYLE */}
                <section className='space-y-3.5'>
                  <div className='flex items-center gap-3'>
                    <div className='h-6 w-6 rounded-full bg-slate-200/80 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-300'>
                      1
                    </div>
                    <h2 className='text-sm font-bold text-slate-900 dark:text-white tracking-tight'>
                      Pick a style
                    </h2>
                  </div>

                  <div className='flex items-center gap-4'>
                    {/* Style 1: Button */}
                    <button
                      type='button'
                      onClick={() => setCardStyle('button')}
                      className={`h-24 w-28 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${
                        cardStyle === 'button'
                          ? 'border-[#5851DF] bg-[#5851DF]/5 text-[#5851DF] ring-2 ring-[#5851DF]/15 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 bg-card hover:border-slate-300 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <div className='h-6 w-14 rounded-full border border-current flex items-center justify-center text-[10px]'>
                        <Icons.link className='h-3 w-3' />
                      </div>
                      <span className='font-semibold text-xs'>Button</span>
                    </button>

                    {/* Style 2: Callout */}
                    <button
                      type='button'
                      onClick={() => setCardStyle('callout')}
                      className={`h-24 w-28 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${
                        cardStyle === 'callout'
                          ? 'border-[#5851DF] bg-[#5851DF]/5 text-[#5851DF] ring-2 ring-[#5851DF]/15 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 bg-card hover:border-slate-300 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <div className='h-7 w-14 rounded-md border border-current flex items-center p-1 gap-1'>
                        <div className='h-4 w-4 bg-current/40 rounded-xs' />
                        <div className='flex-1 flex flex-col gap-0.5'>
                          <div className='h-1 w-full bg-current rounded-full' />
                          <div className='h-1 w-2/3 bg-current/60 rounded-full' />
                        </div>
                      </div>
                      <span className='font-semibold text-xs'>Callout</span>
                    </button>
                  </div>
                </section>

                {/* STEP 2: SELECT IMAGE */}
                <section className='space-y-3.5'>
                  <div className='flex items-center gap-3'>
                    <div className='h-6 w-6 rounded-full bg-slate-200/80 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-300'>
                      2
                    </div>
                    <h2 className='text-sm font-bold text-slate-900 dark:text-white tracking-tight'>
                      Select image
                    </h2>
                  </div>

                  {/* Dashed Upload Box matching Stan Store */}
                  <div className='p-6 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-card/60 flex items-center justify-between gap-6'>
                    {/* Left: Square Thumbnail with Edit Pencil Circular Badge */}
                    <div className='relative h-24 w-24 rounded-2xl overflow-visible shrink-0'>
                      <div className='h-full w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-xs bg-slate-100 dark:bg-slate-900'>
                        <img src={coverImage} alt={title} className='h-full w-full object-cover' />
                      </div>
                      {/* Purple Pencil Edit Button in Top-Right Corner */}
                      <button
                        type='button'
                        onClick={() => setShowImagePicker(true)}
                        className='absolute -top-2 -right-2 h-7 w-7 rounded-full bg-[#5851DF] text-white flex items-center justify-center shadow-md hover:scale-105 transition-transform cursor-pointer'
                        title='Đổi ảnh đại diện'
                      >
                        <Icons.edit className='h-3.5 w-3.5' />
                      </button>
                    </div>

                    {/* Center: Image Specs & Choose Image Button */}
                    <div className='flex flex-col items-center justify-center text-center space-y-1.5 flex-1'>
                      <span className='text-xs font-medium text-slate-500'>Thumbnail</span>
                      <span className='text-xs text-slate-400'>400 × 400</span>
                      <div className='pt-1'>
                        <button
                          type='button'
                          onClick={() => setShowImagePicker(!showImagePicker)}
                          className='px-5 py-1.5 rounded-full border border-[#5851DF] text-[#5851DF] hover:bg-[#5851DF]/5 font-semibold text-xs transition-colors cursor-pointer'
                        >
                          Choose Image
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Preset Image Chooser Dropdown */}
                  {showImagePicker && (
                    <div className='p-4 rounded-2xl border border-border bg-card space-y-3 animate-in fade-in-50'>
                      <div className='flex items-center justify-between'>
                        <span className='text-xs font-semibold text-slate-600 dark:text-slate-300'>
                          Bộ sưu tập ảnh mẫu chuẩn Stan Store:
                        </span>
                        <button
                          type='button'
                          onClick={() => setShowImagePicker(false)}
                          className='text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 cursor-pointer'
                        >
                          <X className='w-3.5 h-3.5' /> Đóng
                        </button>
                      </div>
                      <div className='grid grid-cols-3 sm:grid-cols-6 gap-2.5'>
                        {PRESET_IMAGES.map((img, idx) => (
                          <button
                            key={idx}
                            type='button'
                            onClick={() => {
                              setCoverImage(img.url);
                              setShowImagePicker(false);
                            }}
                            className={`group relative aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                              coverImage === img.url
                                ? 'border-[#5851DF] ring-2 ring-[#5851DF]/30'
                                : 'border-border hover:border-[#5851DF]/60'
                            }`}
                          >
                            <img
                              src={img.url}
                              alt={img.label}
                              className='h-full w-full object-cover group-hover:scale-105 transition-transform'
                            />
                            <div className='absolute inset-x-0 bottom-0 bg-black/60 p-1 text-[9px] text-white font-medium text-center truncate'>
                              {img.label}
                            </div>
                          </button>
                        ))}
                      </div>

                      <div className='pt-2 flex items-center gap-2'>
                        <Input
                          placeholder='Hoặc dán URL ảnh trực tiếp từ internet...'
                          value={coverImage}
                          onChange={(e) => setCoverImage(e.target.value)}
                          className='text-xs h-9 rounded-xl'
                        />
                      </div>
                    </div>
                  )}
                </section>

                {/* STEP 3: ADD TEXT */}
                <section className='space-y-3.5'>
                  <div className='flex items-center gap-3'>
                    <div className='h-6 w-6 rounded-full bg-slate-200/80 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-300'>
                      3
                    </div>
                    <h2 className='text-sm font-bold text-slate-900 dark:text-white tracking-tight'>
                      Add text
                    </h2>
                  </div>

                  <div className='space-y-4 bg-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs'>
                    {/* Title with counter 27/50 */}
                    <div className='space-y-1.5'>
                      <div className='flex items-center justify-between text-xs'>
                        <label className='font-bold text-slate-900 dark:text-white'>
                          Title <span className='text-red-500'>*</span>
                        </label>
                        <span className='text-[11px] text-slate-400 font-mono'>
                          {title.length}/{TITLE_MAX}
                        </span>
                      </div>
                      <Input
                        value={title}
                        maxLength={TITLE_MAX}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder='Personalized Video Response'
                        className='h-11 rounded-xl text-sm font-semibold'
                      />
                    </div>

                    {/* Subtitle with counter 88/100 */}
                    <div className='space-y-1.5'>
                      <div className='flex items-center justify-between text-xs'>
                        <label className='font-bold text-slate-900 dark:text-white'>Subtitle</label>
                        <span className='text-[11px] text-slate-400 font-mono'>
                          {description.length}/{SUBTITLE_MAX}
                        </span>
                      </div>
                      <Textarea
                        value={description}
                        maxLength={SUBTITLE_MAX}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="I'll send you a custom video/product addressing your unique request!"
                        className='min-h-[75px] rounded-xl text-xs resize-none'
                      />
                    </div>

                    {/* Button text with counter 19/30 */}
                    <div className='space-y-1.5'>
                      <div className='flex items-center justify-between text-xs'>
                        <label className='font-bold text-slate-900 dark:text-white'>
                          Button text <span className='text-red-500'>*</span>
                        </label>
                        <span className='text-[11px] text-slate-400 font-mono'>
                          {buttonText.length}/{BUTTON_MAX}
                        </span>
                      </div>
                      <Input
                        value={buttonText}
                        maxLength={BUTTON_MAX}
                        onChange={(e) => setButtonText(e.target.value)}
                        placeholder='Submit Your Request'
                        className='h-10 rounded-xl text-xs font-medium'
                      />
                    </div>
                  </div>
                </section>

                {/* Continue Navigation Button */}
                <div className='pt-2 flex justify-end'>
                  <Button
                    type='button'
                    onClick={() => setActiveTab('checkout')}
                    className='rounded-xl text-xs font-bold gap-1.5 bg-[#5851DF] hover:bg-[#4a43cb] text-white'
                  >
                    <span>Cài đặt Giá & Giao hàng (Checkout Page)</span>
                    <Icons.chevronRight className='h-4 w-4' />
                  </Button>
                </div>
              </div>
            )}

            {/* -------------------------------------------------- */}
            {/* TAB 2: CHECKOUT PAGE (Product Type, Pricing, Fulfillment) */}
            {/* -------------------------------------------------- */}
            {activeTab === 'checkout' && (
              <div className='space-y-6 animate-in fade-in-50 duration-200'>
                {/* 1. Chọn loại sản phẩm */}
                <div className='space-y-3 bg-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs'>
                  <h3 className='font-bold text-sm text-foreground'>1. Loại sản phẩm</h3>
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                    {[
                      {
                        t: 'DIGITAL',
                        title: 'Sản phẩm số (Digital)',
                        desc: 'Tự động gửi file tải hoặc link Notion sau khi thanh toán VietQR',
                        icon: FileText,
                        color: 'text-blue-500'
                      },
                      {
                        t: 'LEAD_MAGNET',
                        title: 'Quà tặng 0đ (Lead Magnet)',
                        desc: 'Nhận link tức thì, tự động thu thập data Email & SĐT khách hàng',
                        icon: Gift,
                        color: 'text-emerald-500'
                      },
                      {
                        t: 'PHYSICAL',
                        title: 'Hàng vật lý (Physical)',
                        desc: 'Thu thập họ tên, SĐT và địa chỉ để giao hàng tận nơi',
                        icon: Package,
                        color: 'text-amber-500'
                      },
                      {
                        t: 'EXTERNAL_LINK',
                        title: 'Nút link liên kết',
                        desc: 'Bấm chuyển sang nhóm Zalo, Telegram, Shopee hoặc website',
                        icon: Link2,
                        color: 'text-purple-500'
                      }
                    ].map((item) => {
                      const TypeIcon = item.icon;
                      const isSelected = type === item.t;
                      return (
                        <button
                          key={item.t}
                          type='button'
                          onClick={() => {
                            const newType = item.t as ProductType;
                            setType(newType);
                            if (newType === 'LEAD_MAGNET') {
                              setPrice(0);
                              setButtonText('Nhận ngay miễn phí');
                            } else if (newType === 'DIGITAL') {
                              setPrice(149000);
                              setButtonText('Submit Your Request');
                            }
                          }}
                          className={`p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col gap-1 ${
                            isSelected
                              ? 'border-zinc-900 dark:border-white bg-zinc-50 dark:bg-zinc-900 text-foreground'
                              : 'border-slate-200 dark:border-slate-800 bg-card hover:border-slate-300 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          <span className='font-bold text-xs text-foreground flex items-center justify-between'>
                            <span className='flex items-center gap-1.5'>
                              <TypeIcon className={`w-4 h-4 ${item.color}`} strokeWidth={1.75} />
                              <span>{item.title}</span>
                            </span>
                            {isSelected && (
                              <CheckCircle2
                                className='w-4 h-4 text-[#20D5EC] fill-[#20D5EC] stroke-white'
                                strokeWidth={2}
                              />
                            )}
                          </span>
                          <span className='text-[11px] text-muted-foreground leading-tight'>
                            {item.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Thiết lập Giá bán */}
                <div className='space-y-4 bg-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs'>
                  <h3 className='font-bold text-sm text-foreground'>2. Thiết lập Giá bán</h3>

                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    <div className='space-y-1.5'>
                      <label className='font-bold text-xs text-foreground'>
                        Giá bán chính thức (VNĐ) <span className='text-red-500'>*</span>
                      </label>
                      <Input
                        type='number'
                        value={price}
                        disabled={type === 'LEAD_MAGNET'}
                        onChange={(e) => setPrice(Number(e.target.value))}
                        className='h-10 rounded-xl font-bold text-sm'
                      />
                      {type === 'LEAD_MAGNET' && (
                        <p className='text-[10px] text-muted-foreground'>
                          Quà tặng Lead Magnet luôn có giá 0đ
                        </p>
                      )}
                    </div>

                    <div className='space-y-1.5'>
                      <label className='font-bold text-xs text-muted-foreground'>
                        Giá gốc (Gạch ngang)
                      </label>
                      <Input
                        type='number'
                        value={originalPrice || ''}
                        onChange={(e) =>
                          setOriginalPrice(e.target.value ? Number(e.target.value) : undefined)
                        }
                        placeholder='Ví dụ: 299000'
                        className='h-10 rounded-xl text-xs text-muted-foreground'
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Bàn giao tài nguyên (Fulfillment) */}
                <div className='space-y-4 bg-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs'>
                  <h3 className='font-bold text-sm text-foreground'>
                    3. Bàn giao tài nguyên (Fulfillment)
                  </h3>

                  {(type === 'DIGITAL' || type === 'LEAD_MAGNET') && (
                    <div className='space-y-3'>
                      <div className='space-y-1.5'>
                        <label className='font-bold text-xs text-foreground'>
                          Link tải file hoặc trang Notion / Google Drive
                        </label>
                        <Input
                          value={fileUrl}
                          onChange={(e) => setFileUrl(e.target.value)}
                          placeholder='https://notion.so/... hoặc https://drive.google.com/...'
                          className='h-10 rounded-xl text-xs'
                        />
                      </div>
                      <div className='space-y-1.5'>
                        <label className='font-bold text-xs text-muted-foreground'>
                          Tên file hiển thị
                        </label>
                        <Input
                          value={fileName}
                          onChange={(e) => setFileName(e.target.value)}
                          placeholder='Ví dụ: Personalized-Video-Response.pdf'
                          className='h-9.5 rounded-xl text-xs'
                        />
                      </div>
                    </div>
                  )}

                  {type === 'PHYSICAL' && (
                    <div className='space-y-1.5'>
                      <label className='font-bold text-xs text-foreground'>
                        Số lượng tồn kho (Stock)
                      </label>
                      <Input
                        type='number'
                        value={stock ?? 50}
                        onChange={(e) => setStock(Number(e.target.value))}
                        className='h-10 rounded-xl text-xs font-semibold'
                      />
                      <p className='text-[11px] text-muted-foreground'>
                        Khách đặt mua sẽ tự động điền form nhận hàng tại trang thanh toán.
                      </p>
                    </div>
                  )}

                  {type === 'EXTERNAL_LINK' && (
                    <div className='space-y-1.5'>
                      <label className='font-bold text-xs text-foreground'>
                        URL liên kết chuyển hướng
                      </label>
                      <Input
                        value={externalUrl}
                        onChange={(e) => setExternalUrl(e.target.value)}
                        placeholder='https://zalo.me/g/...'
                        className='h-10 rounded-xl text-xs'
                      />
                    </div>
                  )}
                </div>

                {/* Tab Navigation buttons */}
                <div className='pt-2 flex items-center justify-between'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => setActiveTab('thumbnail')}
                    className='rounded-xl text-xs font-semibold'
                  >
                    ← Quay lại Thumbnail
                  </Button>
                  <Button
                    type='button'
                    onClick={() => setActiveTab('options')}
                    className='rounded-xl text-xs font-bold gap-1.5 bg-[#5851DF] hover:bg-[#4a43cb] text-white'
                  >
                    <span>Tiếp tục: Options</span>
                    <Icons.chevronRight className='h-4 w-4' />
                  </Button>
                </div>
              </div>
            )}

            {/* -------------------------------------------------- */}
            {/* TAB 3: OPTIONS (Publish, Featured, Danger Zone) */}
            {/* -------------------------------------------------- */}
            {activeTab === 'options' && (
              <div className='space-y-6 animate-in fade-in-50 duration-200'>
                <div className='bg-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6'>
                  <div className='flex items-center justify-between'>
                    <div className='space-y-0.5'>
                      <div className='font-bold text-xs text-foreground'>
                        Hiển thị công khai trên Storefront
                      </div>
                      <div className='text-[11px] text-muted-foreground'>
                        Bật để người xem trang bio có thể bấm mua hoặc nhận quà
                      </div>
                    </div>
                    <Switch checked={isPublished} onCheckedChange={setIsPublished} />
                  </div>

                  <div className='border-t border-border pt-5 flex items-center justify-between'>
                    <div className='space-y-0.5'>
                      <div className='font-bold text-xs text-foreground'>
                        Ghim sản phẩm nổi bật (Featured)
                      </div>
                      <div className='text-[11px] text-muted-foreground'>
                        Gắn huy hiệu nổi bật và ưu tiên hiển thị trên cùng
                      </div>
                    </div>
                    <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
                  </div>
                </div>

                {isEdit && (
                  <div className='p-6 rounded-2xl border border-destructive/20 bg-destructive/5 space-y-3'>
                    <div className='font-bold text-xs text-destructive flex items-center gap-1.5'>
                      <Icons.warning className='h-4 w-4' />
                      Xóa sản phẩm
                    </div>
                    <p className='text-[11px] text-muted-foreground'>
                      Xóa sản phẩm này khỏi Storefront. Doanh thu và đơn hàng cũ vẫn được lưu trữ an
                      toàn.
                    </p>
                    <Button
                      type='button'
                      variant='destructive'
                      size='sm'
                      onClick={handleDeleteCurrent}
                      className='rounded-xl text-xs font-semibold h-9 gap-1.5'
                    >
                      <Icons.trash className='h-3.5 w-3.5' />
                      Xóa sản phẩm này
                    </Button>
                  </div>
                )}

                <div className='pt-2 flex justify-start'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => setActiveTab('checkout')}
                    className='rounded-xl text-xs font-semibold'
                  >
                    ← Quay lại Checkout Page
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* ==================================================== */}
          {/* CỘT PHẢI: REALISTIC IPHONE SIMULATOR (5 Cột) */}
          {/* ==================================================== */}
          <div className='lg:col-span-5 xl:col-span-5 flex flex-col items-center lg:sticky lg:top-28'>
            {/* Segmented Control Switcher (Phone vs Desktop - Chuẩn Stan Store) */}
            <div className='mb-4 inline-flex items-center p-1 rounded-full bg-slate-200/70 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shadow-xs text-xs font-semibold'>
              <button
                type='button'
                onClick={() => setPreviewDevice('phone')}
                className={`px-4 py-1.5 rounded-full flex items-center gap-1.5 transition-all cursor-pointer ${
                  previewDevice === 'phone'
                    ? 'bg-[#5851DF] text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Icons.deviceMobile className='h-3.5 w-3.5' />
                <span>Phone</span>
              </button>
              <button
                type='button'
                onClick={() => setPreviewDevice('desktop')}
                className={`px-4 py-1.5 rounded-full flex items-center gap-1.5 transition-all cursor-pointer ${
                  previewDevice === 'desktop'
                    ? 'bg-[#5851DF] text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Icons.laptop className='h-3.5 w-3.5' />
                <span>Desktop</span>
              </button>
            </div>

            {/* VIEW 1: REALISTIC IPHONE FRAME */}
            {previewDevice === 'phone' && (
              <div className='relative w-[340px] h-[690px] rounded-[48px] p-3 bg-zinc-950 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.15)] ring-1 ring-zinc-800 flex flex-col animate-in fade-in-50'>
                {/* Physical Hardware Buttons */}
                <div className='absolute -left-[3px] top-[110px] h-7 w-[3px] rounded-l-sm bg-zinc-700' />
                <div className='absolute -left-[3px] top-[150px] h-11 w-[3px] rounded-l-sm bg-zinc-700' />
                <div className='absolute -left-[3px] top-[205px] h-11 w-[3px] rounded-l-sm bg-zinc-700' />
                <div className='absolute -right-[3px] top-[155px] h-14 w-[3px] rounded-r-sm bg-zinc-700' />

                {/* Inner Screen */}
                <div className='relative h-full w-full overflow-hidden rounded-[38px] bg-white text-slate-900 flex flex-col'>
                  {/* iOS Dynamic Island */}
                  <div className='relative z-30 flex h-7 w-full shrink-0 items-center justify-between px-6 pt-1 text-[10px] font-semibold text-slate-900'>
                    <span>9:41</span>
                    <div className='absolute left-1/2 top-1.5 h-3.5 w-18 -translate-x-1/2 rounded-full bg-black shadow-xs' />
                    <div className='flex items-center gap-1'>
                      <div className='h-2 w-4 rounded-2xs border border-current p-0.5'>
                        <div className='h-full w-full rounded-3xs bg-current' />
                      </div>
                    </div>
                  </div>

                  {/* Phone Scrollable Area */}
                  <div className='flex-1 overflow-y-auto overscroll-contain p-3.5 space-y-3 scrollbar-none'>
                    {/* Top CTA Banner Button (Exact Stan Store) */}
                    <div className='w-full py-2.5 px-3 rounded-xl bg-[#5851DF] text-white text-center font-bold text-xs tracking-wider shadow-sm'>
                      SUBMIT & DOWNLOAD
                    </div>

                    {/* CARD 1: Green Nature Sample Card (Exact Stan Store Screenshot) */}
                    <div className='rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm space-y-2.5'>
                      <div className='flex items-start gap-3'>
                        <div className='h-14 w-14 rounded-xl overflow-hidden shrink-0 border border-slate-100 bg-slate-50'>
                          <img
                            src='/images/green-nature.jpg'
                            alt='Personalized Video'
                            className='h-full w-full object-cover'
                          />
                        </div>
                        <div className='flex-1 min-w-0'>
                          <div className='font-bold text-xs text-slate-900 leading-snug'>
                            Personalized Video Response
                          </div>
                          <div className='text-[10px] text-slate-500 line-clamp-2 mt-0.5 leading-tight'>
                            I&apos;ll send you a custom video/product addressing your unique
                            request!
                          </div>
                          <div className='mt-1 font-extrabold text-xs text-[#5851DF]'>$9.99</div>
                        </div>
                      </div>
                      {/* Purple Button */}
                      <div className='w-full py-2 px-3 rounded-xl bg-[#5851DF] text-white text-center font-bold text-xs shadow-xs'>
                        Submit Your Request
                      </div>
                    </div>

                    {/* CARD 2: THE CURRENT EDITING PRODUCT (Real-Time Live Updates!) */}
                    <div className='rounded-2xl border-2 border-[#5851DF]/70 bg-white p-3.5 shadow-md space-y-2.5 ring-2 ring-[#5851DF]/15'>
                      {cardStyle === 'button' ? (
                        // Style 1: Button
                        <div className='w-full py-3 px-4 rounded-xl bg-[#5851DF] text-white text-center font-bold text-xs shadow-xs'>
                          {buttonText || 'Submit Your Request'}
                        </div>
                      ) : (
                        // Style 2: Callout (Thumbnail + Title + Subtitle + Price + Button)
                        <>
                          <div className='flex items-start gap-3'>
                            <div className='h-14 w-14 rounded-xl overflow-hidden shrink-0 border border-slate-100 bg-slate-50'>
                              <img
                                src={coverImage}
                                alt={title}
                                className='h-full w-full object-cover'
                              />
                            </div>
                            <div className='flex-1 min-w-0'>
                              <div className='font-bold text-xs text-slate-900 leading-snug line-clamp-2'>
                                {title || 'Personalized Video Response'}
                              </div>
                              <div className='text-[10px] text-slate-500 line-clamp-2 mt-0.5 leading-tight'>
                                {description ||
                                  "I'll send you a custom video/product addressing your unique request!"}
                              </div>
                              <div className='mt-1 font-extrabold text-xs text-[#5851DF]'>
                                {price === 0
                                  ? 'Miễn phí (0 đ)'
                                  : price === 149000
                                    ? '$9.99'
                                    : `${new Intl.NumberFormat('vi-VN').format(price)} đ`}
                              </div>
                            </div>
                          </div>
                          {/* Purple CTA Button */}
                          <div className='w-full py-2 px-3 rounded-xl bg-[#5851DF] text-white text-center font-bold text-xs shadow-xs'>
                            {buttonText || 'Submit Your Request'}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Additional Store Products if any */}
                    {allProducts
                      .filter((p) => p.id !== product?.id && p.isPublished)
                      .slice(0, 2)
                      .map((other) => (
                        <div
                          key={other.id}
                          className='rounded-xl border border-slate-100 bg-white p-3 shadow-2xs space-y-2 opacity-85'
                        >
                          <div className='flex items-start gap-2.5'>
                            <div className='h-11 w-11 rounded-lg overflow-hidden shrink-0 border border-slate-100 bg-slate-50'>
                              <img
                                src={other.coverImage}
                                alt={other.title}
                                className='h-full w-full object-cover'
                              />
                            </div>
                            <div className='flex-1 min-w-0'>
                              <div className='font-semibold text-[11px] text-slate-900 truncate'>
                                {other.title}
                              </div>
                              <div className='text-[9px] text-slate-500 truncate'>
                                {other.description}
                              </div>
                              <div className='font-bold text-[11px] text-[#5851DF] mt-0.5'>
                                {other.price === 0
                                  ? '0 đ'
                                  : `${new Intl.NumberFormat('vi-VN').format(other.price)} đ`}
                              </div>
                            </div>
                          </div>
                          <div className='w-full py-1.5 rounded-lg bg-slate-100 text-slate-700 text-center font-semibold text-[10px]'>
                            {other.buttonText || 'Xem chi tiết'}
                          </div>
                        </div>
                      ))}

                    {/* Stan Store Phone Footer */}
                    <div className='pt-4 pb-2 text-center text-[10px] text-slate-500 flex items-center justify-center gap-4 border-t border-slate-100'>
                      <span className='flex items-center gap-1 font-medium'>
                        <Icons.lock className='h-2.5 w-2.5' /> Privacy Policy
                      </span>
                      <span className='flex items-center gap-1 font-medium'>
                        <Globe className='h-2.5 w-2.5' /> EN{' '}
                        <Icons.chevronDown className='h-2.5 w-2.5' />
                      </span>
                    </div>
                  </div>

                  {/* iOS Home Bar Indicator */}
                  <div className='relative z-30 flex h-4 w-full shrink-0 items-center justify-center pb-1'>
                    <div className='h-1 w-28 rounded-full bg-slate-400' />
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 2: DESKTOP MOCKUP */}
            {previewDevice === 'desktop' && (
              <div className='w-[420px] rounded-2xl border border-slate-200 dark:border-slate-800 bg-card shadow-xl overflow-hidden animate-in fade-in-50'>
                {/* Browser bar */}
                <div className='h-8 bg-slate-100 dark:bg-slate-900 border-b border-border flex items-center px-3 gap-1.5'>
                  <div className='h-2.5 w-2.5 rounded-full bg-red-400' />
                  <div className='h-2.5 w-2.5 rounded-full bg-yellow-400' />
                  <div className='h-2.5 w-2.5 rounded-full bg-green-400' />
                  <div className='mx-auto px-4 py-0.5 rounded-md bg-white dark:bg-slate-800 text-[10px] text-slate-500 border border-border truncate max-w-[200px]'>
                    stan.store/{profile.username}
                  </div>
                </div>

                {/* Desktop Content */}
                <div className='p-6 max-h-[580px] overflow-y-auto space-y-4'>
                  <div className='text-center space-y-2 pb-2 border-b border-border'>
                    <div className='h-16 w-16 rounded-full overflow-hidden mx-auto border-2 border-[#5851DF]'>
                      <img
                        src={profile.avatarUrl}
                        alt={profile.displayName}
                        className='h-full w-full object-cover'
                      />
                    </div>
                    <div className='font-bold text-sm text-foreground'>{profile.displayName}</div>
                    <div className='text-xs text-muted-foreground'>{profile.bio}</div>
                  </div>

                  {/* Active Card */}
                  <div className='rounded-2xl border-2 border-[#5851DF] bg-white p-4 shadow-sm space-y-3 text-slate-900'>
                    <div className='flex items-start gap-4'>
                      <img
                        src={coverImage}
                        alt={title}
                        className='h-20 w-20 rounded-xl object-cover border border-slate-100'
                      />
                      <div className='flex-1'>
                        <h4 className='font-bold text-sm'>{title}</h4>
                        <p className='text-xs text-slate-500 mt-1'>{description}</p>
                        <div className='font-extrabold text-sm text-[#5851DF] mt-2'>
                          {price === 0
                            ? 'Miễn phí'
                            : `${new Intl.NumberFormat('vi-VN').format(price)} đ`}
                        </div>
                      </div>
                    </div>
                    <button className='w-full py-2.5 rounded-xl bg-[#5851DF] text-white font-bold text-xs'>
                      {buttonText}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ======================================================== */}
      {/* 3. HOW IT WORKS MODAL DIALOG */}
      {/* ======================================================== */}
      <Dialog open={showHowItWorks} onOpenChange={setShowHowItWorks}>
        <DialogContent className='max-w-md rounded-2xl'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-base text-[#5851DF]'>
              <span className='h-6 w-6 rounded-full bg-[#5851DF] text-white flex items-center justify-center text-xs'>
                ▶
              </span>
              Cách thức hoạt động (How it works)
            </DialogTitle>
            <DialogDescription className='text-xs text-muted-foreground pt-1'>
              Quy trình xuất bản sản phẩm số & quà tặng chuẩn Stan Store
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4 pt-2 text-xs'>
            <div className='flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-border'>
              <div className='h-6 w-6 rounded-full bg-[#5851DF] text-white flex items-center justify-center font-bold text-xs shrink-0'>
                1
              </div>
              <div className='space-y-0.5'>
                <div className='font-bold text-foreground'>Thiết kế Thumbnail & Tiêu đề</div>
                <div className='text-muted-foreground leading-relaxed'>
                  Chọn kiểu Callout hoặc Button, tải ảnh 400×400 và viết lời kêu gọi hành động hấp
                  dẫn.
                </div>
              </div>
            </div>

            <div className='flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-border'>
              <div className='h-6 w-6 rounded-full bg-[#5851DF] text-white flex items-center justify-center font-bold text-xs shrink-0'>
                2
              </div>
              <div className='space-y-0.5'>
                <div className='font-bold text-foreground'>Cài đặt Giá & File tải tự động</div>
                <div className='text-muted-foreground leading-relaxed'>
                  Khách chuyển khoản VietQR đúng số tiền, hệ thống tự động xác nhận và hiển thị link
                  Notion / PDF tức thì.
                </div>
              </div>
            </div>

            <div className='flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-border'>
              <div className='h-6 w-6 rounded-full bg-[#5851DF] text-white flex items-center justify-center font-bold text-xs shrink-0'>
                3
              </div>
              <div className='space-y-0.5'>
                <div className='font-bold text-foreground'>Xem trước thời gian thực</div>
                <div className='text-muted-foreground leading-relaxed'>
                  Mọi ký tự bạn gõ bên trái đều hiển thị sống động trên mô phỏng điện thoại bên
                  phải.
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
