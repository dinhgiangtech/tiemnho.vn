# Quy Trình Onboarding Khởi Tạo Tiệm Nhỏ (Creator Onboarding Guide)

Tài liệu này mô tả chi tiết luồng **Onboarding thiết lập tiệm** dành cho Creator sau khi đăng nhập qua Clerk trên nền tảng Tiệm Nhỏ.

---

## 1. Mục Đích & Nguyên Tắc Hoạt Động

Trong mô hình SaaS nhiều chủ tiệm (Multi-tenant):
- Mỗi Creator khi đăng ký tài khoản cần được tự do **chọn tên tiệm** và **chọn đường link độc bản** (`tiemnho.vn/@username`) của riêng họ.
- **Tiêu chí tối giản:** Chỉ gồm 2 trường nhập liệu thiết yếu, mất đúng **5 giây** là hoàn tất và vào thẳng trang quản lý.

---

## 2. Vòng Đời Kiểm Tra Trạng Thái (Lifecycle Guard)

```
[Người dùng Đăng nhập qua Clerk]
               │
               ▼
[Chuyển hướng vào /dashboard/products]
               │
               ▼ (Tại src/app/dashboard/layout.tsx)
Kiểm tra: prisma.creatorProfile.findUnique({ where: { clerkUserId } })
               │
       ┌───────┴───────┐
       ▼               ▼
  [CHƯA CÓ TIỆM]   [ĐÃ CÓ TIỆM]
       │               │
       ▼               ▼
Chuyển hướng       Vào thẳng
 /onboarding     /dashboard/products
```

- **Tại trang `/onboarding`:**
  - Nếu người dùng chưa đăng nhập ➔ Chuyển hướng về `/auth/sign-in`.
  - Nếu người dùng đã mở tiệm rồi ➔ Tự động chuyển hướng ngay sang `/dashboard/products` (tránh tạo trùng lặp).

---

## 3. Giao Diện Trang Onboarding (`src/app/onboarding/page.tsx`)

- **Bố cục:** Căn giữa màn hình chuẩn UX tối giản (`max-w-md mx-auto py-12 px-6`).
- **Logo & Tiêu đề:**
  - Tiêu đề: **"Khởi tạo Tiệm Nhỏ của bạn"** (`text-2xl font-extrabold text-neutral-900`).
  - Phụ đề: *"Chỉ mất 5 giây để sở hữu đường link bio nhận tiền tự động."*
- **Hộp thông tin tài khoản:** Hiển thị avatar tròn thật từ Google và email đã xác thực.
- **2 Ô nhập liệu:**
  1. **"Tên tiệm của bạn"** (Bắt buộc):
     - Tự động điền sẵn (pre-fill) từ họ tên Google (`user.fullName` hoặc `user.firstName`).
  2. **"Đường link tiệm của bạn"** (Bắt buộc):
     - Định dạng: `tiemnho.vn/@` + ô input slug.
     - Tự động điền sẵn từ tiền tố email (`email.split('@')[0]`).
     - Tự động chuẩn hóa: Chỉ dùng chữ thường không dấu, số và dấu gạch dưới (`[a-z0-9_]`), độ dài 3 - 30 ký tự.
     - Kiểm tra trùng lặp thời gian thực (Real-time debounced check):
       - `✓ Đường link khả dụng` (màu xanh lục).
       - `✗ Đường link đã có người sử dụng` (màu đỏ).
- **Nút bấm chính:**
  - `[ 🚀 Bắt đầu mở tiệm ]`: Màu đỏ hồng TikTok (`#FE2C55`), bo tròn `rounded-xl`, hiệu ứng active bấm nảy, có spinner trạng thái khi đang lưu.

---

## 4. Xử Lý Lưu Trữ Cơ Sở Dữ Liệu (`src/features/tiemnho/api/onboarding-actions.ts`)

Khi người dùng bấm nút:
1. Server Action `createStoreOnboarding` xác thực phiên người dùng qua `auth()`.
2. Kiểm tra tính hợp lệ và không trùng lặp của slug.
3. Tạo bản ghi mới trong bảng `CreatorProfile`:
   - `clerkUserId`: ID duy nhất từ Clerk.
   - `displayName`: Tên tiệm người dùng vừa đặt.
   - `username`: Đường link tiệm người dùng vừa chọn.
   - `avatarUrl`: Ảnh đại diện từ tài khoản Google/Clerk.
   - `bio`: Lời giới thiệu mặc định.
4. Trình duyệt tự động chuyển hướng ngay vào `/dashboard/products`.

---

## 5. Danh Sách File Liên Quan

- `src/app/onboarding/page.tsx`: Server Component kiểm tra quyền và render trang.
- `src/app/onboarding/onboarding-form.tsx`: Client Component quản lý form và tương tác thời gian thực.
- `src/features/tiemnho/api/onboarding-actions.ts`: Server Actions kiểm tra slug và lưu CSDL.
- `src/app/dashboard/layout.tsx`: Chặn và điều hướng Creator chưa mở tiệm sang `/onboarding`.

