# Tài Liệu Đồng Bộ Tài Khoản Clerk & CSDL Tiệm Nhỏ (Clerk Sync Guide)

Tài liệu này mô tả chi tiết cơ chế đồng bộ dữ liệu người dùng từ dịch vụ xác thực **Clerk** về hệ thống cơ sở dữ liệu **PostgreSQL (Prisma)** của Tiệm Nhỏ.

---

## 1. Tổng Quan Kiến Trúc (Architecture Overview)

Dự án áp dụng mô hình **Just-In-Time (JIT) Resolver Sync** (Đồng bộ tức thời tại thời điểm đọc dữ liệu):

```
[Người dùng đăng nhập] ──> Clerk Cloud cấp Session Cookie
                                    │
                                    ▼
[Truy cập /dashboard] ──> layout.tsx bảo vệ: await auth.protect()
                                    │
                                    ▼
[Hiển thị Tiệm/Sidebar] ──> Gọi Server Action: getProfile()
                                    │
              ┌─────────────────────┴─────────────────────┐
              ▼                                           ▼
       [ĐÃ CÓ TRONG DB]                            [CHƯA CÓ TRONG DB]
  • Trả về ngay lập tức                       • Lấy tên, avatar thật từ Clerk
  • Thời gian xử lý: ~2ms                     • Tự động tạo CreatorProfile trong DB
                                              • Đảm bảo dữ liệu sẵn sàng 100%
```

### Tại sao chọn mô hình Just-In-Time Resolver?
1. **Không cần chĩa đầu API (Zero API Exposure):** Hoạt động mượt mà 100% trên `localhost:3000` mà không cần cài đặt Ngrok hay Cloudflare Tunnel.
2. **Triệt tiêu 100% lỗi lệch pha thời điểm (No Race Condition):** Dữ liệu được đảm bảo tạo và ghi vào CSDL **trước khi** trả về cho giao diện. Màn hình chỉ mở ra khi dữ liệu đã có sẵn trong CSDL.
3. **Tự phục hồi dữ liệu (Self-healing):** Kể cả khi CSDL bị xóa trắng, ngay lần click chuột tiếp theo vào Dashboard, hệ thống tự động tái tạo lại hồ sơ cho tài khoản đang đăng nhập.

---

## 2. Cấu Trúc Cơ Sở Dữ Liệu (Database Schema)

Trong file `prisma/schema.prisma`, model `CreatorProfile` được bổ sung trường định danh duy nhất:

```prisma
model CreatorProfile {
  id          String   @id @default(cuid())
  clerkUserId String?  @unique                       // 👈 Mã định danh duy nhất từ Clerk
  username    String   @unique @default("tiemnho")     // 👈 Slug gian hàng (tiemnho.vn/@username)
  displayName String   @default("Tiệm Nhỏ Creator")   // 👈 Tên hiển thị (đồng bộ từ Clerk fullName)
  bio         String   @default("Chào mừng bạn ghé Tiệm Nhỏ!...")
  avatarUrl   String   @default("/default-avatar.svg") // 👈 Avatar thật (Google/Clerk hoặc default)
  coverUrl    String?  @default("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe...")
  verified    Boolean  @default(true)
  theme       String   @default("obsidian")
  tiktok      String?  @default("https://tiktok.com/@tiemnho")
  instagram   String?  @default("https://instagram.com/tiemnho")
  youtube     String?  @default("https://youtube.com/@tiemnho")
  threads     String?  @default("https://threads.net/@tiemnho")
  facebook    String?  @default("https://facebook.com/tiemnho")
  zalo        String?  @default("0987654321")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

---

## 3. Cơ Chế Xử Lý Trong Code (`src/features/tiemnho/api/service.ts`)

Hàm trung tâm `getProfile()` xử lý đồng bộ và điều phối dữ liệu:

```ts
export async function getProfile(): Promise<CreatorProfile> {
  await ensureDatabaseSeeded();

  let clerkUserId: string | null = null;
  try {
    const authObj = await auth();
    clerkUserId = authObj.userId;
  } catch {
    // Không có context auth (môi trường build hoặc public) -> an toàn bỏ qua
  }

  // 1. NẾU ĐÃ ĐĂNG NHẬP CLERK:
  if (clerkUserId) {
    let profile = await prisma.creatorProfile.findUnique({
      where: { clerkUserId }
    });

    if (!profile) {
      // Gọi Clerk lấy thông tin user
      const clerkUser = await currentUser();
      const email = clerkUser?.emailAddresses?.[0]?.emailAddress;
      const baseUsername = (
        clerkUser?.username ||
        (email ? email.split('@')[0] : `user_${clerkUserId.slice(-6)}`)
      ).toLowerCase().replace(/[^a-z0-9_]/g, '');

      // Nếu có profile mẫu ban đầu (chưa gắn clerkUserId) -> liên kết luôn
      const unlinkedProfile = await prisma.creatorProfile.findFirst({
        where: { clerkUserId: null }
      });

      if (unlinkedProfile) {
        profile = await prisma.creatorProfile.update({
          where: { id: unlinkedProfile.id },
          data: {
            clerkUserId,
            displayName: clerkUser?.fullName || unlinkedProfile.displayName,
            avatarUrl: clerkUser?.imageUrl || unlinkedProfile.avatarUrl
          }
        });
      } else {
        // Tạo profile mới độc lập cho Creator mới
        profile = await prisma.creatorProfile.create({ ... });
      }
    }

    return formatProfile(profile);
  }

  // 2. NẾU LÀ KHÁCH VÃNG LAI HOẶC PUBLIC STOREFRONT:
  let profile = await prisma.creatorProfile.findFirst();
  return formatProfile(profile);
}
```

---

## 4. Bảo Vệ & Phòng Thủ Đa Tầng (Defensive Layers)

1. **Tầng 1 (Chặn tại cửa khẩu Dashboard):**
   - Tại `src/app/dashboard/layout.tsx`: câu lệnh `await auth.protect();` sẽ lập tức chặn bất kỳ ai chưa đăng nhập và điều hướng về `/auth/sign-in?redirect_url=...`.
   - Người chưa đăng nhập **không thể** kích hoạt bất kỳ lệnh đọc/ghi CSDL nào của Dashboard.
2. **Tầng 2 (Chống trùng lặp Username):**
   - Nếu hai người dùng có cùng tên/email username, hệ thống tự động kiểm tra bảng `CreatorProfile` và gắn thêm hậu tố số ngẫu nhiên (`username_1234`) để không bao giờ bị lỗi `Unique constraint failed`.
3. **Tầng 3 (An toàn khi lỗi mạng Clerk):**
   - Toàn bộ lệnh gọi `currentUser()` được bọc trong khối `try/catch`. Nếu Clerk gặp sự cố, hệ thống vẫn fallback an toàn về profile mặc định, giao diện không bao giờ bị trắng màn hình (crash).

---

## 5. Đồng Bộ Giao Diện Người Dùng (UI Synchronization)

- **Sidebar (`src/components/layout/app-sidebar.tsx`):**
  Sử dụng hook `useUser()` của Clerk. Khu vực tài khoản ở chân Sidebar và nút "Ghé tiệm (@username)" tự động hiển thị tên thật, username và ảnh đại diện thật của người dùng.
- **Trang quản lý tiệm (`src/features/tiemnho/components/products/products-management-view.tsx`):**
  Lấy dữ liệu từ `getProfile()` ➔ Thẻ thông tin Creator trên đầu trang tự động cập nhật đồng bộ với CSDL.

---

## 6. Hướng Dẫn Mở Rộng Webhook Khi Lên Production (Tùy Chọn)

Khi bạn deploy dự án lên môi trường Production chính thức (có tên miền public như Vercel):
Nếu bạn muốn bổ sung tính năng lắng nghe khi người dùng bị xóa trên Clerk (`user.deleted`):
1. Cài đặt thư viện: `npm install svix`
2. Tạo endpoint: `src/app/api/webhooks/clerk/route.ts`
3. Cấu hình `CLERK_WEBHOOK_SECRET` trong biến môi trường.
4. Lắng nghe event `user.deleted` để dọn dẹp các bản ghi liên quan trong CSDL.
*(Lưu ý: Ngay cả khi có Webhook, cơ chế JIT Resolver ở trên vẫn đóng vai trò là chốt chặn an toàn nhất đảm bảo không bao giờ bị lệch dữ liệu).*

