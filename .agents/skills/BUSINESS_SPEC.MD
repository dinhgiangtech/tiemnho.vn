# Tài liệu Đặc tả Nghiệp vụ & Vận hành Hệ thống: Tiệm Nhỏ (TiemNho.vn)

---
---
name: tiemnho-business-core
description: >-
  Business logic specification, creator onboarding rules, VietQR payment automation, 
  and checkout flows for Tiệm Nhỏ (Stan Store alternative for Vietnam).
  Use this skill whenever building or modifying product management, checkout drawers,
  VietQR webhook handlers, payment settings, or buyer fulfillment flows.
---

# Nội dung nghiệp vụ ở đây...

## 1. Tổng quan & Định vị Thương hiệu

* **Tên nền tảng:** Tiệm Nhỏ (`tiemnho.vn`)
* **Định vị cốt lõi:** Nền tảng Bio Storefront (Link-in-bio) chuẩn phong cách Stan Store tối ưu riêng cho thị trường Việt Nam.
* **Mục tiêu:** Giúp Content Creator biến tài nguyên số và sản phẩm cá nhân thành thu nhập tự động 24/7 thông qua hình thức quét mã VietQR tự động.
* **Định dạng đường dẫn Storefront:** `tiemnho.vn/@username` (hoặc `app.vn/@username`).

---

## 2. Triết lý Dòng tiền & Mô hình Kinh doanh

### 2.1. Triết lý Dòng tiền (Bất di bất dịch)
* **Không giữ tiền trung gian (No Escrow):** Tiền người mua chuyển khoản qua mã VietQR sẽ chạy **thẳng 100% vào tài khoản ngân hàng chính chủ của Creator**.
* **Không cắt phế phần trăm đơn hàng:** Nền tảng áp dụng chính sách **0% hoa hồng**, Creator giữ trọn 100% doanh thu bán được.
* **An toàn pháp lý tuyệt đối:** Nền tảng chỉ đóng vai trò là phần mềm công cụ tự động hóa luồng mua bán (SaaS), không mở ví, không giữ tiền hộ, không vi phạm quy định về giấy phép trung gian thanh toán theo Nghị định 52/2024/NĐ-CP.

### 2.2. Mô hình Doanh thu Nền tảng (SaaS Thuần thuê bao)
Hệ thống kiếm tiền từ việc cung cấp dịch vụ phần mềm cho Creator theo chu kỳ:
* **Gói Trải nghiệm (Free Trial):** Miễn phí 14 ngày dùng thử đầy đủ tính năng kết nối VietQR.
* **Gói Creator Pro:** ~99.000 – 149.000 VNĐ / tháng (hoặc ~990.000 VNĐ / năm). Mở khóa không giới hạn sản phẩm, tắt huy hiệu "Powered by", xuất dữ liệu khách hàng.
* Luồng thanh toán gói dịch vụ: Creator quét VietQR trả phí thuê phần mềm vào tài khoản ngân hàng của nền tảng; hệ thống nhận webhook và tự động kích hoạt hạn dùng.

---

## 3. Ba Mắt xích Nghiệp vụ Vận hành (End-to-End)

### 3.1. Phía Creator (Người bán)
1. **Khởi tạo gian hàng:** Đăng ký bằng Google OAuth / Email -> Chọn slug cá nhân (VD: `@giangdinh`).
2. **Cài đặt nhận tiền:**
   * Nhập Tên ngân hàng + Số tài khoản chính chủ.
   * Kết nối đối tác bắt biến động số dư (payOS / SePay).
   * Thử nghiệm tính năng "Bắn thử giao dịch kiểm tra kết nối" (Ping test).
3. **Đăng bán sản phẩm:** Chọn loại sản phẩm, nhập tiêu đề, ảnh cover, mô tả, giá bán và đính kèm tài nguyên (upload file lên Cloudflare R2 hoặc dán link truy cập kín).
4. **Vận hành & Giám sát:** Gắn link bio lên kênh TikTok, Instagram, Threads; quản lý bảng đơn hàng và danh sách Email/SĐT khách hàng để remarketing.

### 3.2. Phía Khách mua (Người mua)
1. **Khám phá:** Khách lướt video ngắn trên TikTok/Reels -> Bấm vào link bio của Creator.
2. **Trải nghiệm 1-Tap Checkout:** Mở bio tức thì trên WebView (dưới 1.5 giây). Bấm sản phẩm -> Trượt mở Bottom Sheet / Drawer tại chỗ (không chuyển trang mới).
3. **Nhập thông tin siêu tốc:**
   * Sản phẩm số / Lead Magnet: Họ tên + Email (bắt buộc) + Số điện thoại.
   * Hàng vật lý: Thêm đúng 1 ô Text nhập địa chỉ chi tiết + Ghi chú size/màu.
4. **Quét VietQR:** Màn hình xuất mã VietQR động chuẩn NAPAS 247 (chứa sẵn STK Creator, số tiền chuẩn và nội dung có mã đơn). Khách mở app ngân hàng quét và xác nhận trong 10 giây.
5. **Nhận hàng tức thì:** Màn hình tự động lật sang trạng thái "Thành công" và hiển thị nút "Tải tài nguyên ngay" (kèm email dự phòng gửi thẳng về hộp thư).

### 3.3. Phía Hệ thống Lõi (Backend & Fulfillment)
1. **Sinh mã giao dịch:** Tạo `order_code` ngắn gọn duy nhất (VD: `TN10823`) gán vào nội dung VietQR.
2. **Lắng nghe Webhook (payOS / SePay):**
   * Xác thực chữ ký dữ liệu (Checksum/Signature).
   * Đảm bảo Idempotency (chống trùng lặp đơn hàng).
   * So khớp: `số tiền thực nhận >= tổng tiền đơn hàng` và `nội dung chứa mã order_code`.
   * Cập nhật trạng thái `status = PAID`.
   * Trả lời cổng thanh toán bằng HTTP `200 OK` trong vòng 1-2 giây.
3. **Phát hàng tự động (Fulfillment):**
   * Thông báo thời gian thực phía Client qua SSE hoặc Polling (2 giây/lần).
   * Tạo Pre-signed URL tải file (Cloudflare R2) có thời hạn giới hạn (24–72 giờ, giới hạn lượt tải).
   * Kích hoạt background worker gửi email giao dịch (Resend / SES) kèm link tài nguyên hoặc xác nhận đơn hàng.

---

## 4. Đặc tả 4 Loại Sản phẩm Giai đoạn 1 (Phase 1 MVP)

| Mã loại (`ProductType`) | Bản chất & Ứng dụng | Form thông tin yêu cầu người mua | Cơ chế trả hàng sau thanh toán |
| :--- | :--- | :--- | :--- |
| **`DIGITAL`**<br>(Sản phẩm số) | File PDF, Ebook, đề thi, Preset Lightroom, video LUTs, template Notion, bảng tính Excel... | • Họ và tên<br>• Email (bắt buộc)<br>• Số điện thoại | Kích hoạt nút **"Tải ngay"** (Pre-signed URL Cloudflare R2) + Gửi email link dự phòng. |
| **`LEAD_MAGNET`**<br>(Quà tặng 0đ) | Checklist, cẩm nang tóm tắt, tài liệu mẫu miễn phí nhằm thu thập data khách hàng tiềm năng. | • Họ và tên<br>• Email (bắt buộc)<br>• Số điện thoại | Không sinh mã VietQR. Submit form là trả link tải ngay và lưu data vào danh bạ Leads. |
| **`PHYSICAL`**<br>(Hàng theo yêu cầu) | Sách in kèm chữ ký, áo thun merch, đồ handmade làm theo yêu cầu với số lượng giới hạn. | • Họ và tên<br>• Số điện thoại (bắt buộc)<br>• **1 ô Text địa chỉ chi tiết**<br>• Ghi chú size/màu | Báo "Đặt hàng thành công" + Gửi email xác nhận. Dashboard Creator có nút **Xuất Excel/CSV** để đi gửi bưu cục. |
| **`EXTERNAL_LINK`**<br>(Nút chuyển hướng) | Trỏ sang gian hàng Shopee/TikTok Shop, nhóm kín Zalo/Telegram, kênh YouTube, link Affiliate. | *Không thu thập thông tin* | Khối hiển thị dạng thẻ tĩnh, bấm vào mở tab mới (`window.open`), không phát sinh đơn hàng. |

*Lưu ý:* Các danh mục như **Đặt lịch hẹn 1-1 (Booking Calls)**, **Khóa học video nhiều bài giảng (eCourses)** và **Hội viên định kỳ (Subscriptions)** tạm thời hoãn sang Phase 2 để bảo đảm tính tinh gọn.

---

## 5. Quy chuẩn Thiết kế Giao diện (UI/UX Specs)

### 5.1. Màn hình Bio Storefront (`tiemnho.vn/@username`)
* **Mobile-First & WebView Optimization:** Giao diện tối ưu tỉ lệ dọc màn hình điện thoại (container căn giữa `max-w-md` hoặc `max-w-lg`).
* **Header Bio:** Ảnh đại diện tròn, Tên hiển thị, Bio ngắn gọn, các nút icon mạng xã hội.
* **Danh sách sản phẩm:** Dạng thanh ngang (Row Cards) hoặc thẻ Accordion có thể gập/mở trực tiếp.
* **Luồng mua không rời trang:** Toàn bộ quá trình điền thông tin và thanh toán diễn ra trong Drawer (Bottom Sheet) hoặc Dialog popup. Tuyệt đối không redirect làm mất trải nghiệm trên in-app browser của TikTok/Instagram.
* **Hỗ trợ thanh toán 1 máy:** Cung cấp đầy đủ nút "Sao chép số tài khoản", "Sao chép nội dung" và nút dự phòng "Tôi đã chuyển khoản" để người mua chủ động kiểm tra nếu mạng chậm.

### 5.2. Màn hình Quản trị Creator Dashboard
* **Sidebar 2 cột kết hợp Live Mobile Preview:** Cột bên trái là danh sách quản lý; cột bên phải hiển thị khung điện thoại mô phỏng Storefront cập nhật thời gian thực.
* **Quản lý sản phẩm:** Kéo-thả sắp xếp vị trí hiển thị (`displayOrder`), nút bật/tắt hiển thị (`isPublished`).
* **Quản lý đơn hàng (TanStack Table):**
  * Bộ lọc trạng thái đơn: Chờ thanh toán (`PENDING`), Đã thanh toán (`PAID`), Đã hủy/Hết hạn.
  * Trạng thái giao hàng vật lý: Chưa giao (`UNFULFILLED`), Đang giao (`SHIPPING`), Hoàn thành (`COMPLETED`).
  * Nút hành động cốt lõi: **"Xuất file Excel / CSV"** để tạo vận đơn gửi bưu điện.
* **Cài đặt thanh toán (Settings):** Đơn giản hóa ngôn ngữ kỹ thuật:
  * "Số tài khoản nhận tiền" (thay cho Merchant Bank Account).
  * "Địa chỉ nhận thông báo" (thay cho Webhook URL).
  * "Mã kết nối bí mật" (thay cho API Key / Token / Checksum).
  * Nút "Lưu & Bắn thử giao dịch kiểm tra kết nối".

---

## 6. Kiến trúc Công nghệ & Hạ tầng Dữ liệu

### 6.1. Tech Stack Khuyến nghị
* **Frontend & Backend Framework:** Next.js 15 (App Router) + TypeScript.
* **Styling & UI Library:** Tailwind CSS + shadcn/ui (Radix UI).
* **Database & ORM:** PostgreSQL + Prisma ORM.
* **Lưu trữ tệp số:** Cloudflare R2 (Miễn phí 100% băng thông tải về - Zero Egress Fees, cấp Pre-signed URL).
* **Cổng đối soát VietQR:** SDK payOS (`@payos/node`) hoặc Webhook SePay.
* **Transactional Email:** Resend hoặc Amazon SES.

### 6.2. Cấu trúc Bảng Cơ sở Dữ liệu cốt lõi (Prisma Schema Summary)
* `User`: Quản lý tài khoản Creator, username định danh bio, cấu hình theme.
* `PaymentConfig`: Lưu thông tin ngân hàng nhận tiền và khóa API kết nối Webhook.
* `Product`: Chứa tiêu đề, giá, loại sản phẩm (4 loại), file key trên R2, số lượng tồn kho.
* `ProductVariant`: Hỗ trợ size/màu sắc cho hàng vật lý.
* `Order`: Quản lý mã đơn `orderCode`, thông tin người mua (Tên, Email, SĐT, Địa chỉ), trạng thái thanh toán và vận chuyển.
* `OrderItem`: Chi tiết từng mặt hàng trong đơn.
* `DownloadGrant`: Quản lý mã token tải file, hạn sử dụng và số lần tải tối đa.
* `PaymentLog`: Ghi nhận nhật ký webhook từ ngân hàng nhằm phục vụ kiểm toán và chống xử lý lặp đơn (Idempotency).
* `Subscription`: Quản lý thời hạn gói dịch vụ SaaS mà Creator thuê từ nền tảng.