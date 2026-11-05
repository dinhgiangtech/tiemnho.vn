# Quy Chuẩn UI/UX & Design System Tiệm Nhỏ (Modern Clean SaaS)

Tài liệu này là **Single Source of Truth (SSOT)** về quy chuẩn giao diện, hệ thống typography, màu sắc thương hiệu, bố cục Bento, thanh điều hướng và cách dựng component của dự án **Tiệm Nhỏ**. 

Mỗi khi phát triển màn hình mới, tinh chỉnh giao diện hoặc refactor code, **AI Agent và lập trình viên bắt buộc phải tuân theo hướng dẫn này**.

---

## 1. Triết Lý Thiết Kế Cốt Lõi (Core Principles)

1. **Đồng Bộ Hoàn Toàn Với Theme Dự Án (Strict Theme Synchronization)**:
   - Toàn bộ nút bấm (buttons), thanh điều hướng (tabbar), menu thanh bên (sidebar), bộ lọc (filter tabs), công tắc (switches) **bắt buộc phải sử dụng Semantic Theme Tokens** của Tailwind/shadcn (`bg-primary`, `text-primary`, `bg-sidebar-primary`, `text-primary-foreground`, `border-border`, `bg-background`, `bg-card`, v.v.).
   - **Tuyệt đối không hardcode mã màu** như `bg-[#FE2C55]`, `hover:bg-[#E0264B]` hay `bg-[#161823]` trên các nút bấm hay thanh điều hướng.
   - Nhờ đó, khi người dùng đổi theme trên Header (sang Supabase, Discord, Claude, Vercel, TikTok, WhatsApp, Notebook...), toàn bộ giao diện tự động đồng bộ theo bảng màu tương ứng của theme đó.
2. **Modern Clean SaaS & Creator-First**:
   - Giao diện hiện đại, tối giản nhưng đậm chất cao cấp (phong cách Bento UI, Stan Store kết hợp TikTok / Apple).
   - Ưu tiên trải nghiệm mượt mà trên Mobile Webview/Smartphone (chiếm >80% lượng truy cập creator) song song với giao diện quản trị Desktop chuyên nghiệp.
3. **Không Lặp Tiêu Đề Trang (No Duplicate Page Title)**:
   - Thanh Breadcrumbs trên Header (`BreadcrumbPage`) đã luôn hiển thị tên trang in đậm (`font-bold text-sm md:text-base`).
   - Tuyệt đối **không** thêm thẻ `<h1 className="text-2xl font-bold">` lớn trùng lặp ở đầu nội dung trang trừ khi trang đó có sub-navigation riêng. Trong `PageContainer`, không truyền `pageTitle` nếu breadcrumbs đã đủ rõ nghĩa.
4. **Typography To, Đậm & Rõ Nét (Bold & Legible)**:
   - Font chủ đạo: **Plus Jakarta Sans** (hoặc Inter/Geist), luôn có `letter-spacing` rộng nhẹ (`tracking-[0.015em]`) tạo cảm giác thoáng mắt và sang trọng.
   - Các tiêu đề, nhãn (label), button, thông số tiền tệ phải luôn có độ đậm (`font-bold` hoặc `font-extrabold`).
5. **Bảo Toàn Tuyệt Đối Tỉ Lệ Ảnh (Strict Image Preservation)**:
   - Mọi ảnh đại diện (avatar) hay ảnh bìa sản phẩm (thumbnail) **bắt buộc** phải có thẻ bọc cố định kích thước (`shrink-0 overflow-hidden`) và ảnh bên trong phải dùng `w-full h-full object-cover shrink-0`. Tuyệt đối không để ảnh bị méo hoặc bung vỡ layout.
6. **Icon System Kiểm Soát Chặt Chẽ**:
   - Tất cả icon chức năng đều gọi qua `@/components/icons` (`Icons.xxx`). Không import trực tiếp từ bên ngoài.
   - Icon mạng xã hội / Brand Icons trong `@/components/common/social-icons.tsx` phải có khung cố định kích thước (ví dụ `w-6 h-6`, SVG con `w-4 h-4 object-contain`), không được để SVG bung kích thước tự do.
7. **Khoảng Chạm Cảm Ứng An Toàn (Safe Touch Target >= 36px)**:
   - Trên thiết bị di động, mọi nút bấm, công tắc, icon thao tác (Sửa, Xóa, Bật/Tắt) phải có kích thước tối thiểu **36x36px** (`min-h-[36px] min-w-[36px]`) và khoảng cách đệm (gap) hợp lý để tránh hoàn toàn việc bấm nhầm trên màn hình cảm ứng.

---

## 2. Hệ Thống Màu Sắc & Tokens Đồng Bộ (Theme Token System)

Hệ thống theme được định nghĩa qua CSS Variables trong `src/styles/themes/*.css` và kích hoạt tự động qua thuộc tính `[data-theme='<theme-name>']`.

| Token ngữ nghĩa | Class Tailwind tương ứng | Mục đích sử dụng | Hành vi theo Theme |
| :--- | :--- | :--- | :--- |
| `--primary` | `bg-primary`, `text-primary` | Nút CTA chính ("+ Thêm sản phẩm", "Lưu thay đổi"), Tabbar active, Icon active | Đỏ TikTok `#FE2C55` trong theme TikTok; Xanh ngọc trong Supabase; Tím Blurple trong Discord; Đất nung trong Claude; Đen/Trắng trong Vercel. |
| `--primary-foreground` | `text-primary-foreground` | Màu chữ trên nền primary | Tự động tương phản (Trắng hoặc Đen) theo chuẩn WCAG AAA. |
| `--sidebar-primary` | `bg-sidebar-primary` | Nền mục menu đang chọn trên Sidebar | Tự động đồng bộ với Primary Color của Theme. |
| `--background` | `bg-background` | Nền toàn trang, nền thanh đáy Mobile `bg-background/95` | Trắng tinh/Xám nhạt ở Light mode, Đen dịu mắt ở Dark mode. |
| `--foreground` | `text-foreground` | Chữ chính, tiêu đề quan trọng | Tự động tương phản theo Theme. |
| `--muted`, `--muted-foreground` | `bg-muted`, `text-muted-foreground` | Tab không active, nhãn phụ, placeholder | Muted tone chuẩn của từng Theme. |
| `--border` | `border-border` | Viền thẻ Card, viền thanh đáy Mobile | Viền chuẩn theme, tự thích ứng Dark/Light. |

### Màu Phân Loại Sản Phẩm (Category Pastel Badges & Icons):
- **Sản phẩm số (Digital)**: 
  - Icon Box: `bg-blue-50 border-blue-100 text-blue-600` (`Icons.sparkles` hoặc `Icons.zap`).
  - Badge: `bg-blue-50 text-blue-700 border-blue-150` ("Tự động 24/7").
- **Quà tặng 0đ (Lead Magnet)**: 
  - Icon Box: `bg-emerald-50 border-emerald-100 text-emerald-600` (`Icons.gift`).
  - Badge: `bg-emerald-50 text-emerald-700 border-emerald-150` ("Thu hút khách hàng").
- **Hàng đặt trước (Physical)**: 
  - Icon Box: `bg-amber-50 border-amber-100 text-amber-600` (`Icons.shoppingBag`).
  - Badge: `bg-amber-50 text-amber-700 border-amber-150` ("Thủ công / Đặt trước").
- **Nút liên kết (External Link)**: 
  - Icon Box: `bg-purple-50 border-purple-100 text-purple-600` (`Icons.link`).
  - Badge: `bg-purple-50 text-purple-700 border-purple-150` ("Dẫn link Bio").

---

## 3. Quy Chuẩn Typography & Trọng Số Chữ (Typography Scale)

Được cấu hình toàn cục tại `src/styles/globals.css`:

```css
body {
  font-size: 15px;
  font-weight: 500;
  letter-spacing: 0.015em;
}

h1, h2, h3, h4, h5, h6 {
  font-weight: 700;
  letter-spacing: 0.01em;
  color: var(--foreground);
}

label {
  font-weight: 700;
  font-size: 14px;
  letter-spacing: 0.01em;
}
```

- **Tiêu đề khối / Section Title**: `text-base md:text-lg font-bold tracking-tight text-foreground`.
- **Nội dung thẻ / Body Text**: `text-[15px] font-medium leading-relaxed text-muted-foreground`.
- **Mô tả nhỏ / Helper Text**: `text-[13px] md:text-sm font-medium text-muted-foreground`.
- **Giá tiền / Numbers**: `font-extrabold text-foreground tracking-tight font-mono` hoặc `tabular-nums`.

---

## 4. Kiến Trúc Điều Hướng (Navigation Architecture)

Dashboard sử dụng hệ thống điều hướng 2 lớp thích ứng theo kích thước màn hình và **đồng bộ 100% với Theme**:

### 4.1. Desktop Sidebar (`src/components/layout/app-sidebar.tsx`)
- Hiển thị cố định bên trái trên màn hình Desktop (`>= md`).
- Mục đang chọn (Active Menu Item):
  ```tsx
  className={cn(
    'h-11 px-3.5 rounded-xl transition-all font-semibold text-sm flex items-center gap-3 cursor-pointer',
    isActive
      ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs'
      : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent'
  )}
  ```
- Icon của mục active: `text-primary-foreground`, strokeWidth 2.2.

### 4.2. Mobile Bottom Navigation Bar (`src/components/layout/bottom-nav-bar.tsx`)
- Hiển thị cố định ở chân trang trên thiết bị di động (`< md`), dính sát mép dưới và hỗ trợ `safe-area-inset-bottom`.
- 6 mục điều hướng chính:
  1. **Tổng quan** (`/dashboard/overview`) — `Icons.dashboard` / `LayoutDashboard`
  2. **Tiệm của bạn** (`/dashboard/products`) — `Icons.store`
  3. **Thiết kế tiệm** (`/dashboard/design`) — `Icons.palette`
  4. **Đơn hàng** (`/dashboard/orders`) — `Icons.shoppingBag`
  5. **Khách hàng** (`/dashboard/customers`) — `Icons.users`
  6. **Nhận tiền** (`/dashboard/payouts`) — `Icons.creditCard`
- Trạng thái Active trên Bottom Bar (Đồng bộ theo Theme):
  - Khung bọc: `bg-background/95 backdrop-blur-md border-t border-border`.
  - Khi tab được kích hoạt:
    - Vạch chỉ báo trên đầu tab: `<span className="absolute top-0 h-0.5 w-6 rounded-full bg-primary" />`.
    - Icon: `text-primary scale-105 transition-transform`, `strokeWidth={2.2}`.
    - Nhãn chữ: `text-primary font-bold`.
  - Tab không kích hoạt: `text-muted-foreground hover:text-foreground font-medium`.

### 4.3. Quy Tắc Tự Động Ẩn Bottom Bar Trên Màn Hình Con / Biểu Mẫu:
- Khi người dùng di chuyển vào các màn hình tạo mới hoặc chỉnh sửa (ví dụ: `/dashboard/products/create` hoặc `/dashboard/products/[id]/edit`):
  - `BottomNavBar` **tự động ẩn hoàn toàn** (`return null`).
  - Mục đích: Trả lại toàn bộ không gian đáy màn hình cho **Sticky Bottom Action Bar** của biểu mẫu, tránh việc thanh điều hướng đè lên hoặc che lấp nút bấm lưu dữ liệu.

---

## 5. Các Quy Chuẩn Thành Phần (Component Standards)

### 5.1. Nút Bấm Chính (Primary Action Button)
Sử dụng mặc định variant chuẩn của shadcn `Button` (`bg-primary text-primary-foreground hover:bg-primary/90`):
```tsx
<Button
  size="sm"
  className="h-10 px-5 py-2.5 text-sm font-bold gap-2 rounded-xl shadow-sm cursor-pointer transition-all active:scale-[0.98]"
>
  <Icons.add className="w-4 h-4" />
  <span>+ Thêm sản phẩm</span>
</Button>
```
*Lưu ý: Không thêm `bg-[#FE2C55]` hay bất kỳ màu cố định nào để nút tự động nhận màu sắc theo Theme đang chọn.*

### 5.2. Thẻ Profile Người Bán Đáp Ứng Đa Thiết Bị (Creator Profile Card)
Bố cục thẻ thông minh giải quyết triệt để vấn đề cụt tên và chật chội trên màn hình nhỏ:

- **Trên Desktop (`>= md`)**: Bố cục nằm ngang 1 hàng tinh gọn: Cụm thông tin bên trái, nút "Chỉnh sửa hồ sơ" bên phải.
- **Trên Mobile (`< md`)**: Bố cục 2 tầng thoáng mắt:
  - **Tầng trên (Cụm thông tin)**:
    - Avatar tròn cố định 56x56px (`w-14 h-14 rounded-full overflow-hidden border border-border bg-muted shrink-0`).
    - Khối chữ bên cạnh: Tên hiển thị đầy đủ (text-base font-bold text-foreground, tuyệt đối không dùng `line-clamp-1` bóp nghẹt chữ).
    - Ngay dưới tên là liên kết Bio `tiemnho.vn/@username` kèm icon sao chép nhỏ.
    - Hàng icon mạng xã hội (TikTok, Instagram, Facebook) bọc khung chuẩn `w-6 h-6`, icon con `16px`.
  - **Tầng dưới (Nút thao tác Mobile)**:
    - Nút "Chỉnh sửa hồ sơ" dãn rộng toàn bộ chiều ngang (`w-full mt-3.5 py-2.5 rounded-xl border border-border text-sm font-semibold flex items-center justify-center gap-2 bg-muted/50 active:bg-muted`).

### 5.3. Thẻ Sản Phẩm Danh Sách 2 Tầng (Product Row Card - 2-Tier Layout)
Thay thế dạng hàng ngang 1 dòng đơn điệu bằng bố cục 2 tầng giúp tiêu đề hiển thị trọn vẹn và các nút thao tác chạm an toàn:

- **Tầng 1 (Hình ảnh & Thông tin sản phẩm)**:
  - Nút kéo thả: `Icons.gripVertical className="w-4 h-4 text-muted-foreground cursor-grab shrink-0"`.
  - Ảnh bìa sản phẩm tỷ lệ vuông 1:1: `w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-border bg-muted` chứa `<img className="w-full h-full object-cover shrink-0" />`.
  - Badge HOT (nếu có): `bg-primary text-primary-foreground`.
  - Khối thông tin: Badge danh mục pastel nhỏ phía trên, Tiêu đề cho phép hiển thị **2 dòng đầy đủ** (`text-[15px] font-bold text-foreground leading-snug line-clamp-2 mt-1 hover:text-primary transition-colors`).
- **Tầng 2 (Thanh trạng thái, giá tiền & Cụm thao tác cảm ứng)**:
  - Phía trái: Giá bán in đậm to rõ (`text-base font-extrabold text-foreground`) kèm nhãn `Đã bán: X lượt` (`bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-md font-medium`).
  - Phía phải: Cụm thao tác với khoảng chạm an toàn **tối thiểu 36px** (`h-9 w-9 min-h-[36px] min-w-[36px]`):
    - Switch bật/tắt hiển thị sản phẩm (sử dụng `data-checked:bg-primary`).
    - Nút Sửa (`Icons.edit` / `Pencil`) bo tròn, padding chạm 36px.
    - Nút Xóa (`Icons.trash` / `Trash2`) bo tròn, padding chạm 36px.

### 5.4. Quy Chuẩn Bộ Lọc Dữ Liệu Đồng Bộ Theme (Filtering Patterns)
- **Trên Desktop (`>= md`)**: Sử dụng thanh Tabs dạng Pill dàn hàng ngang:
  ```tsx
  className={cn(
    'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer',
    isActive
      ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
      : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
  )}
  ```
  - Badge số lượng trong tab active: `bg-primary-foreground/20 text-primary-foreground`.
- **Trên Mobile (`< md`)**: Tự động chuyển sang hộp chọn **`<select>` Dropdown** native-feel với biểu tượng lọc, nhãn trạng thái và đếm số lượng:
  ```tsx
  className="w-full h-11 pl-10 pr-10 text-xs font-semibold rounded-xl border border-input bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-xs appearance-none transition-colors"
  ```
- **Ngoại lệ màn hình Quản lý Tiệm (`/dashboard/products`)**:
  - Ẩn hoàn toàn bộ lọc phân loại sản phẩm để hiển thị danh mục sản phẩm nguyên bản, đảm bảo tính năng Kéo Thả Sắp Xếp Thứ Tự (Drag & Drop Reordering) hoạt động chuẩn xác 1:1 theo mảng gốc mà không bị lệch chỉ mục (index mismatch).

### 5.5. Hiển Thị Dữ Liệu: Desktop Tables vs Mobile Bento Cards
- **Desktop (`>= md`)**: Trình bày dưới dạng Bảng dữ liệu chuẩn (`TanStack Table`) với đầy đủ các cột: Mã đơn, Thời gian, Tên khách hàng, Trạng thái đơn, Số tiền, Thao tác.
- **Mobile (`< md`)**: Tự động chuyển đổi sang dạng **Thẻ Bento Card**:
  - Mỗi đơn hàng/khách hàng là 1 thẻ bo góc độc lập.
  - Mã đơn và Trạng thái đặt ở hàng đầu.
  - Số tiền hiển thị to đậm (`font-extrabold text-base text-primary`).
  - Nút xem chi tiết dãn rộng dễ bấm bằng ngón tay cái.

---

## 6. Quy Chuẩn Sticky Bottom Action Bar (Thanh Thao Tác Dính Đáy)

Mọi màn hình biểu mẫu (Form tạo/sửa sản phẩm `ProductForm.tsx`, thiết lập tiệm `StorefrontSettingsView`, cấu hình thanh toán `PaymentSettingsView`...) **bắt buộc** phải cố định các nút hành động cốt lõi ("Lưu thay đổi", "Tạo sản phẩm", "Hủy") ở đáy màn hình:

### 6.1. Trên Mobile (`< lg` / `< md`)
- Dính sát mép dưới cùng của màn hình thiết bị:
  ```tsx
  className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-border px-4 py-3 flex items-center justify-between shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
  style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
  ```
- **Vùng đệm an toàn**: Vùng nội dung cuộn bên trong của form phải có padding dưới **`pb-28`** để các trường nhập liệu cuối cùng không bao giờ bị thanh nút bấm che khuất.

### 6.2. Trên Desktop (`>= lg`)
- Thanh nút dính nổi nhẹ nhàng ở đáy cột biểu mẫu:
  ```tsx
  className="lg:sticky lg:bottom-4 lg:z-20 lg:rounded-2xl lg:border lg:py-3.5 lg:px-6 lg:shadow-lg lg:mt-6 bg-card/95 backdrop-blur-md"
  ```
- Nút submit chính bên trong Action Bar luôn dùng `Button` variant default (nhận màu từ `bg-primary text-primary-foreground hover:bg-primary/90`).

---

## 7. Checklist Tự Kiểm Tra Trước Khi Xuất Bản UI (Self-Verification Checklist)

Mỗi khi phát triển hoặc kiểm thử giao diện, đối chiếu với 10 tiêu chuẩn sau:

- [ ] **Đồng bộ Theme Token**: Tất cả button, tabbar, sidebar có sử dụng `bg-primary`, `text-primary`, `bg-sidebar-primary` thay vì hardcode `#FE2C55` / `#161823` chưa?
- [ ] **Breadcrumbs & Title**: Header Breadcrumbs đã hiển thị rõ tên trang? Đã loại bỏ các thẻ `<h1>` lớn trùng lặp ở đầu trang chưa?
- [ ] **Active Tab Navigation**: Tab đang chọn trên Bottom Navigation Bar có vạch `bg-primary` và chữ/icon `text-primary` chưa? Sidebar có `bg-primary text-primary-foreground` chưa?
- [ ] **Sticky Bottom Action Bar**: Các nút hành động chính của biểu mẫu (Lưu, Tạo, Cập nhật) đã được dính cố định ở đáy màn hình chưa? Form có đủ `pb-28` đệm an toàn chưa?
- [ ] **Ẩn BottomNavBar trên Form**: Khi vào trang con tạo/sửa, `BottomNavBar` đã được tự động ẩn để nhường chỗ cho Action Bar chưa?
- [ ] **Profile Card 2 Tầng**: Thẻ Profile người bán có tự dãn nút "Chỉnh sửa hồ sơ" 100% full-width trên mobile và giữ nguyên tên không bị cắt cụt chưa?
- [ ] **Product Card 2 Tầng**: Thẻ sản phẩm đã có 2 tầng (ảnh vuông 1:1 + tên 2 dòng; giá tiền + cụm nút touch target >= 36px) chưa?
- [ ] **Bộ lọc Mobile**: Màn hình bảng dữ liệu đã chuyển bộ lọc sang Dropdown `<select>` trên mobile với `focus:ring-primary/20` chưa? Màn hình Quản lý Tiệm đã ẩn bộ lọc để giữ tính năng kéo thả chưa?
- [ ] **Switch đồng bộ**: Công tắc Switch có dùng `data-checked:bg-primary` để chuyển màu theo theme chưa?
- [ ] **Bảo toàn ảnh & Icon**: Mọi ảnh đại diện/thumbnail có thẻ bọc `shrink-0 overflow-hidden` + `object-cover shrink-0` chưa? Icon có import qua `@/components/icons` chưa?
