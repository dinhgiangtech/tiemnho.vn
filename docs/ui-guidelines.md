# Hướng Dẫn & Bộ Thư Viện UI Chuẩn Của Dự Án (Tiệm Nhỏ Dashboard)

Tài liệu này tổng hợp toàn bộ các quy chuẩn giao diện (Design System, Tokens, Components, Layout Patterns) của dự án để đảm bảo tính nhất quán, hỗ trợ tạo mới hoặc tùy biến các trang nhanh chóng và chuẩn xác.

---

## 1. Nguyên Tắc Cốt Lõi (Core Rules)

1. **Không hardcode mã màu tùy tiện** (như `#5851DF`, `#FE2C55`, `bg-blue-600`):
   - Luôn sử dụng Tailwind CSS Semantic Tokens: `bg-primary`, `text-primary`, `bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`.
   - Giúp giao diện tự động thích ứng hoàn hảo với cả **Light Mode**, **Dark Mode** và **10 bộ Theme** có sẵn của template.
2. **Icon duy nhất từ `@/components/icons`**:
   - Sử dụng `<Icons.iconName className='h-4 w-4' />`.
   - **Tuyệt đối không** import trực tiếp từ `lucide-react` hay `@tabler/icons-react`.
3. **Thành phần UI từ `@/components/ui/`**:
   - Luôn sử dụng component chuẩn: `Card`, `Button`, `Input`, `Textarea`, `Switch`, `Badge`.
4. **Không nhúng dữ liệu fake / mock vào form tạo mới**:
   - Khởi tạo form với giá trị rỗng/mặc định sạch (`''`, `0`, `[]`).
   - Sử dụng thuộc tính `placeholder="..."` để gợi ý cho người dùng.

---

## 2. Các Thành Phần Giao Diện Chuẩn (Common Components)

### 2.1. Top Header Bar (Tiêu Đề Trang)
Dùng ở đầu mỗi trang để cung cấp tiêu đề, mô tả và các nút hành động chính (Back, Lưu, Thêm mới).

```tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';

export function PageHeader() {
  return (
    <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80'>
      <div className='flex items-center gap-3'>
        {/* Nút Quay lại (nếu là trang con) */}
        <Link href='/dashboard/products'>
          <Button variant='outline' size='sm' className='h-8 text-xs gap-1.5 rounded-lg'>
            <Icons.arrowLeft className='h-3.5 w-3.5' />
            <span>Quay lại</span>
          </Button>
        </Link>
        <div>
          <h1 className='text-lg font-bold text-foreground tracking-tight'>
            Tên Trang
          </h1>
          <p className='text-xs text-muted-foreground'>
            Mô tả ngắn gọn chức năng của trang này.
          </p>
        </div>
      </div>

      {/* Cụm nút hành động bên phải */}
      <div className='flex items-center gap-2'>
        <Button size='sm' className='h-8.5 px-4 text-xs font-semibold rounded-lg'>
          <Icons.check className='h-3.5 w-3.5 mr-1.5' />
          <span>Lưu thay đổi</span>
        </Button>
      </div>
    </div>
  );
}
```

---

### 2.2. Card Khối Thông Tin (Form Section Card)
Dùng để nhóm các phần cài đặt, thông tin cấu hình hoặc nhập liệu.

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export function SettingSection() {
  return (
    <Card className='rounded-xl border shadow-xs'>
      <CardHeader className='pb-3'>
        <CardTitle className='text-sm font-semibold'>1. Tiêu đề khối cài đặt</CardTitle>
        <CardDescription className='text-xs'>
          Mô tả chi tiết mục đích cấu hình của phần này.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4 pt-1'>
        <div className='space-y-1.5'>
          <label className='text-xs font-medium text-foreground'>
            Tên trường <span className='text-destructive'>*</span>
          </label>
          <Input placeholder='Nhập nội dung...' className='h-9 text-xs rounded-lg' />
        </div>
      </CardContent>
    </Card>
  );
}
```

---

### 2.3. Avatar Tròn Chuẩn (Có nút sửa và hỗ trợ ảnh trắng mặc định)

```tsx
<div className='relative group shrink-0'>
  <div className='relative h-20 w-20 rounded-full overflow-hidden border border-border bg-muted/30 flex items-center justify-center cursor-pointer shadow-2xs'>
    {avatarUrl ? (
      <img src={avatarUrl} alt='Avatar' className='h-full w-full object-cover' />
    ) : (
      <div className='h-full w-full bg-muted/40 flex items-center justify-center text-muted-foreground/60'>
        <Icons.user className='h-9 w-9' />
      </div>
    )}
  </div>

  {/* Nút bút chì góc phải dưới */}
  <button
    type='button'
    onClick={() => fileInputRef.current?.click()}
    className='absolute bottom-0 right-0 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xs border-2 border-background hover:bg-primary/90 transition-all cursor-pointer'
  >
    <Icons.edit className='h-3 w-3' />
  </button>
</div>
```

---

### 2.4. Thanh Lọc Danh Mục Dạng Tabs (Category Filter Tabs)

```tsx
<div className='flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none'>
  {tabs.map((tab) => {
    const isActive = activeTab === tab.key;
    return (
      <button
        key={tab.key}
        type='button'
        onClick={() => setActiveTab(tab.key)}
        className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
          isActive
            ? 'bg-primary text-primary-foreground shadow-2xs font-semibold'
            : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent'
        }`}
      >
        <span>{tab.label}</span>
        <span
          className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
            isActive
              ? 'bg-primary-foreground/20 text-inherit'
              : 'bg-background/80 text-muted-foreground'
          }`}
        >
          {tab.count}
        </span>
      </button>
    );
  })}
</div>
```

---

### 2.5. Khung Trống (Empty State)

```tsx
<div className='py-12 text-center rounded-xl border border-dashed border-border p-6 bg-card space-y-3'>
  <div className='h-12 w-12 rounded-xl bg-muted/60 text-muted-foreground flex items-center justify-center mx-auto shadow-2xs'>
    <Icons.product className='h-6 w-6' />
  </div>
  <div>
    <p className='text-sm font-semibold text-foreground'>Chưa có dữ liệu nào</p>
    <p className='text-xs text-muted-foreground mt-1 max-w-sm mx-auto'>
      Bấm nút bên dưới để tạo bản ghi mới đầu tiên của bạn.
    </p>
  </div>
  <div className='pt-2'>
    <Button size='sm' className='text-xs h-8 rounded-lg gap-1.5'>
      <Icons.add className='h-3.5 w-3.5' />
      <span>Thêm mới</span>
    </Button>
  </div>
</div>
```

---

### 2.6. Khung Xem Trước Mobile Thời Gian Thực (Live Phone Preview)

Bố cục 2 cột đặc trưng của Tiệm Nhỏ (Cột trái 7 cột cho Form, Cột phải 5 cột cho Live Preview):

```tsx
<div className='grid grid-cols-1 lg:grid-cols-12 gap-6 items-start'>
  {/* Cột Trái: Form cài đặt (7 Cột) */}
  <div className='lg:col-span-7 space-y-6'>
    {/* Form contents */}
  </div>

  {/* Cột Phải: Phone Mockup (5 Cột) */}
  <div className='lg:col-span-5 sticky top-6 space-y-3'>
    <div className='rounded-xl border bg-card p-3 shadow-xs flex items-center justify-between text-xs'>
      <div className='flex items-center gap-2'>
        <span className='relative flex h-2 w-2'>
          <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75'></span>
          <span className='relative inline-flex rounded-full h-2 w-2 bg-emerald-500'></span>
        </span>
        <span className='font-medium text-foreground'>Xem trước thời gian thực</span>
      </div>
      <a
        href={`/@${username}`}
        target='_blank'
        rel='noreferrer'
        className='text-primary hover:underline font-medium inline-flex items-center gap-1 text-[11px]'
      >
        Mở link Bio
        <Icons.externalLink className='h-3 w-3' />
      </a>
    </div>

    <PhoneMockup
      profile={livePreviewProfile}
      products={products}
      paymentConfig={paymentConfig}
      className='scale-[0.92] sm:scale-100 origin-top'
    />
  </div>
</div>
```

---

## 3. Bảng Tra Cứu Icon Thường Dùng (`Icons.*`)

| Mục đích | Mã sử dụng | Ghi chú |
| :--- | :--- | :--- |
| **Hành động** | `Icons.add`, `Icons.edit`, `Icons.trash`, `Icons.upload`, `Icons.check`, `Icons.close` | Thao tác CRUD |
| **Điều hướng** | `Icons.arrowLeft`, `Icons.arrowRight`, `Icons.chevronDown`, `Icons.chevronUp`, `Icons.externalLink` | Di chuyển trang / mở tab |
| **Sản phẩm & Đơn** | `Icons.product`, `Icons.post`, `Icons.gift`, `Icons.link`, `Icons.truck`, `Icons.camera`, `Icons.receipt` | Phân loại sản phẩm & vận chuyển |
| **Mạng xã hội** | `Icons.tiktok`, `Icons.instagram`, `Icons.youtube`, `Icons.facebook`, `Icons.zalo`, `Icons.threads` | Kênh Bio Storefront |
| **Trạng thái** | `Icons.spinner` (kèm `animate-spin`), `Icons.info`, `Icons.warning`, `Icons.sparkles` | Loading & Thông báo |

---

## 4. Checklist Trước Khi Hoàn Tất Giao Diện Mới

- [ ] Không còn màu HEX hardcode lạ ngoài Tailwind tokens.
- [ ] Mọi icon đều import từ `@/components/icons`.
- [ ] Không có dữ liệu mẫu giả (fake text/unsplash placeholder) trong defaultValues.
- [ ] Form có đầy đủ thông báo `toast.success()` / `toast.error()` từ `sonner`.
- [ ] Chạy lệnh `yarn typecheck` đạt kết quả `0 errors`.
