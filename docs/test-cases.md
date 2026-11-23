# BỘ TEST CASE TỔNG THỂ HỆ THỐNG TIỆM NHỎ (tiemnho.vn)

Tài liệu kiểm thử tích hợp toàn diện (End-to-End Test Suite) cho nền tảng thương mại điện tử **Tiệm Nhỏ** (`tiemnho.vn`), bao quát toàn bộ quy trình từ Creator tạo shop, Khách mua hàng, Cổng thanh toán Hybrid (payOS / VietQR), Bot Telegram, Giao hàng (Fulfillment) và Super Admin.

---

## MỤC LỤC
1. [Module 1: Khởi tạo Shop & Quản lý Sản phẩm (Creator)](#module-1-khởi-tạo-shop--quản-lý-sản-phẩm-creator)
2. [Module 2: Thanh toán Hybrid (payOS tự động & VietQR 1 chạm)](#module-2-thanh-toán-hybrid-payos-tự-động--vietqr-1-chạm)
3. [Module 3: Giao hàng (Fulfillment) & Tải file số bảo mật](#module-3-giao-hàng-fulfillment--tải-file-số-bảo-mật)
4. [Module 4: Danh sách dữ liệu, Tìm kiếm & Phân trang](#module-4-danh-sách-dữ-liệu-tìm-kiếm--phân-trang)
5. [Module 5: Super Admin Platform (/admin)](#module-5-super-admin-platform-admin)
6. [Checklist kiểm tra trước khi Release Production](#checklist-kiểm-tra-trước-khi-release-production)

---

## Module 1: Khởi tạo Shop & Quản lý Sản phẩm (Creator)

| Mã TC | Tên Test Case | Các bước thực hiện (Steps) | Kết quả mong đợi (Expected Result) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- |
| **TC-01** | Đăng ký & Onboarding shop mới | 1. Vào `/register`.<br>2. Điền email, password, username shop (`dinhgiang`).<br>3. Bấm "Hoàn tất đăng ký". | Tạo tài khoản thành công, tự động chuyển vào `/dashboard/overview`. Gian hàng công khai `/@dinhgiang` sẵn sàng truy cập. | Sẵn sàng |
| **TC-02** | Đổi Theme & Thiết kế Tiệm | 1. Vào `/dashboard/settings/storefront`.<br>2. Đổi theme sang **Tiki Blue** hoặc **TikTok**.<br>3. Thay ảnh đại diện, Bio, thêm link mạng xã hội (TikTok, Zalo). | Mobile preview cập nhật ngay tức thì. Xem tiệm ngoài `/@username` hiển thị đúng màu chủ đạo và logo đổi màu xanh thẫm `#0D5CB6` đồng bộ. | Sẵn sàng |
| **TC-03** | Đăng Sản phẩm số (Digital Product) | 1. Vào `/dashboard/products` $\rightarrow$ Thêm sản phẩm.<br>2. Chọn loại: `Sản phẩm số`.<br>3. Tải lên tệp PDF/ZIP hoặc dán link Google Drive/Notion.<br>4. Nhập giá: `50.000đ` $\rightarrow$ Bấm Lưu. | Sản phẩm xuất hiện ngay lập tức trên trang storefront `/@username` với nút "Mua ngay". | Sẵn sàng |
| **TC-04** | Đăng Quà tặng 0đ (Lead Magnet) | 1. Thêm sản phẩm loại `Quà tặng miễn phí (0đ)`.<br>2. Nhập tiêu đề, đính kèm tài liệu $\rightarrow$ Bấm Lưu. | Sản phẩm có giá 0đ, nút hành động tự động chuyển thành "Nhận miễn phí". | Sẵn sàng |
| **TC-05** | Đăng Sản phẩm vật lý (Physical Product) | 1. Thêm sản phẩm loại `Sản phẩm vật lý`.<br>2. Nhập giá: `150.000đ`, số lượng kho: `20` $\rightarrow$ Lưu. | Khi khách đặt mua, form checkout tự động mở thêm trường nhập **"Địa chỉ nhận hàng"** và **"Ghi chú giao hàng"**. | Sẵn sàng |

---

## Module 2: Thanh toán Hybrid (payOS tự động & VietQR 1 chạm)

| Mã TC | Tên Test Case | Các bước thực hiện (Steps) | Kết quả mong đợi (Expected Result) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- |
| **TC-06** | Bật / Tắt cổng tự động payOS | 1. Vào `/dashboard/settings` $\rightarrow$ Bật công tắc `payOS`.<br>2. Nhập đủ 3 key: `Client ID`, `API Key`, `Checksum Key`.<br>3. Bấm "Lưu & Xác thực payOS". | Hệ thống lưu `isPayosEnabled = true`. Công tắc giữ nguyên trạng thái ON (không bị nhảy về OFF). | Sẵn sàng |
| **TC-07** | Mua hàng qua payOS (Tự động) | 1. Bật payOS.<br>2. Khách vào `/@username` $\rightarrow$ Chọn mua sản phẩm số `50.000đ`.<br>3. Điền Tên, Email, SĐT $\rightarrow$ Tiếp tục.<br>4. Quét mã QR payOS hoặc chuyển khoản đúng nội dung. | Tiền vào tài khoản ngân hàng $\rightarrow$ Webhook payOS gọi về hệ thống $\rightarrow$ Màn hình checkout của khách tự động chuyển sang màu xanh **"Thanh toán thành công"** trong vòng 2-3s mà không cần tải lại trang. | Sẵn sàng |
| **TC-08** | Mua hàng qua VietQR tĩnh (Dự phòng khi tắt payOS) | 1. Tắt payOS trong Settings.<br>2. Khách mua hàng $\rightarrow$ Popup hiển thị VietQR tĩnh của Creator.<br>3. Khách chuyển khoản xong và bấm nút **"Tôi đã chuyển khoản"**. | 1. Popup chuyển sang màn hình "Đang chờ chủ tiệm duyệt đơn".<br>2. Hệ thống gửi tin nhắn thông báo khẩn cấp về **Bot Telegram của Creator** kèm nút `[✅ Đã nhận tiền - Duyệt đơn ngay]`. | Sẵn sàng |
| **TC-09** | Duyệt đơn 1 chạm trên Telegram | 1. Creator mở Telegram, nhận thông báo đơn hàng mới.<br>2. Bấm nút `[✅ Đã nhận tiền - Duyệt đơn ngay]`. | 1. Bot Telegram phản hồi: `✅ Đơn hàng #TNxxxx đã được duyệt thành công!`.<br>2. Đơn hàng chuyển sang `PAID` trong Database.<br>3. Email đính kèm link tải tài liệu tự động gửi cho khách hàng. | Sẵn sàng |

---

## Module 3: Giao hàng (Fulfillment) & Tải file số bảo mật

| Mã TC | Tên Test Case | Các bước thực hiện (Steps) | Kết quả mong đợi (Expected Result) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- |
| **TC-10** | Tải file số từ link `/download/[token]` | 1. Sau khi đơn `PAID`, khách bấm nút "Tải tài liệu" trên popup hoặc click vào link trong email: `/download/gr_xxx?file=...`. | File PDF/ZIP được **stream tải về máy ngay lập tức** (không gặp lỗi 404). Nếu là link ngoài (Drive/Notion) thì tự động chuyển tiếp an toàn. | Sẵn sàng |
| **TC-11** | Nhận quà 0đ (Lead Magnet Flow) | 1. Khách điền Tên, Email, SĐT để nhận tài liệu 0đ.<br>2. Bấm "Nhận ngay". | Không cần thanh toán. Đơn tự động `PAID`, cấp link tải file ngay lập tức, thông tin khách tự động lưu vào bảng `/dashboard/customers`. | Sẵn sàng |
| **TC-12** | Cập nhật giao hàng cho Đơn vật lý | 1. Creator vào `/dashboard/orders`.<br>2. Tìm đơn vật lý đang có trạng thái `Chờ gửi hàng`.<br>3. Đổi dropdown sang `Đang giao` hoặc `Đã hoàn thành`. | Trạng thái lưu ngay vào DB, bảng tự cập nhật không cần load lại trang. | Sẵn sàng |

---

## Module 4: Danh sách dữ liệu, Tìm kiếm & Phân trang

| Mã TC | Tên Test Case | Các bước thực hiện (Steps) | Kết quả mong đợi (Expected Result) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- |
| **TC-13** | Phân trang bảng Đơn hàng (`/dashboard/orders`) | 1. Vào trang Đơn hàng.<br>2. Đổi số dòng: 10 $\rightarrow$ 20 $\rightarrow$ 50 dòng/trang.<br>3. Bấm nút `Trang sau`, `Trang cuối`. | Bảng hiển thị đúng số dòng và dải `Hiển thị 1 - 10 trên tổng N mục`. Chuyển trang mượt mà cả trên Desktop lẫn Mobile. | Sẵn sàng |
| **TC-14** | Tìm kiếm kết hợp Phân trang | 1. Gõ từ khóa tìm kiếm mã đơn hoặc tên khách vào ô Search. | Danh sách lọc tức thời và **tự động reset về Trang 1**. | Sẵn sàng |
| **TC-15** | Xuất file Excel/CSV gửi bưu cục | 1. Trong trang Đơn hàng, bấm nút `Xuất CSV`. | File `.csv` mã hóa UTF-8 BOM được tải về, mở trên Excel tiếng Việt không bị lỗi font, có đầy đủ: Tên, SĐT, Địa chỉ, Số tiền. | Sẵn sàng |

---

## Module 5: Super Admin Platform (/admin)

| Mã TC | Tên Test Case | Các bước thực hiện (Steps) | Kết quả mong đợi (Expected Result) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- |
| **TC-16** | Chặn truy cập trái phép (RBAC Security) | 1. Đăng nhập bằng tài khoản role `CREATOR`.<br>2. Cố tình gõ trực tiếp URL `http://localhost:3000/admin`. | Bị Server chặn ngay lập tức và redirect ngược về `/dashboard/overview`. | Sẵn sàng |
| **TC-17** | Truy cập Super Admin | 1. Đăng nhập bằng tài khoản role `ADMIN`.<br>2. Vào `/admin`. | Vào thành công giao diện Master Shell của Admin với Sidebar màu riêng biệt, thấy số liệu Tổng GMV, Creators, Đơn toàn sàn. | Sẵn sàng |
| **TC-18** | Cấp/Gỡ Tick Xanh (Verified) cho Creator | 1. Vào `/admin/creators`.<br>2. Bấm nút "Cấp tick" cho shop `dinhgiang`.<br>3. Mở tab mới vào `/@dinhgiang`. | Shop được gắn huy hiệu **Verified (Tick xanh)** uy tín ngay bên cạnh tên hiển thị. | Sẵn sàng |
| **TC-19** | Khóa/Mở shop vi phạm chính sách | 1. Trong `/admin/creators`, bấm nút "Khóa shop". | Tài khoản chuyển trạng thái "Đã khóa", khách không thể đặt mua hàng tại shop này nữa. | Sẵn sàng |
| **TC-20** | Kiểm duyệt & Gỡ sản phẩm vi phạm | 1. Vào `/admin/products`.<br>2. Tìm sản phẩm vi phạm $\rightarrow$ Bấm nút "Gỡ/Ẩn". | Sản phẩm ngay lập tức bị ẩn khỏi tiệm công khai, khách không thể nhìn thấy hoặc mua được nữa. | Sẵn sàng |

---

## Checklist kiểm tra trước khi Release Production

- [ ] **NEXT_PUBLIC_APP_URL**: Đã cấu hình đúng tên miền chính thức (ví dụ: `https://tiemnho.vn`).
- [ ] **Cổng payOS**: Đã chuyển sang API Keys của môi trường Production (Live) trên payos.vn.
- [ ] **Webhook payOS**: Đã cấu hình URL `https://tiemnho.vn/api/webhooks/payos` trên Dashboard của payOS.
- [ ] **Telegram Bot**: Đã thiết lập webhook Telegram trỏ về `https://tiemnho.vn/api/webhooks/telegram`.
- [ ] **Email Resend**: Đã cấu hình `RESEND_API_KEY` và xác thực Domain gửi mail để tránh spam.
- [ ] **Đường dẫn tải file**: Đã có route `src/app/download/[token]/route.ts` hoạt động ổn định.
- [ ] **Kiểm tra TypeScript**: Chạy `npm run typecheck` đạt `0 errors`.
