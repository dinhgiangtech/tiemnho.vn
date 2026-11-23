# HƯỚNG DẪN ĐÓNG GÓI DOCKER & TRIỂN KHAI PRODUCTION LÊN VPS (tiemnho.vn)

Tài liệu hướng dẫn từng bước (Step-by-Step) để build, đóng gói ứng dụng **Tiệm Nhỏ** bằng Docker và triển khai lên máy chủ VPS (Ubuntu/Debian) với PostgreSQL, Nginx Reverse Proxy và SSL Let's Encrypt tự động.

---

## MỤC LỤC
1. [Chuẩn bị máy chủ VPS](#bước-1-chuẩn-bị-và-cài-đặt-docker-trên-vps)
2. [Tải mã nguồn về VPS](#bước-2-tải-mã-nguồn-về-vps)
3. [Cấu hình biến môi trường (.env)](#bước-3-cấu-hình-biến-môi-trường-env)
4. [Build và khởi chạy Docker Compose](#bước-4-build-và-khởi-chạy-docker-compose)
5. [Đồng bộ cơ sở dữ liệu (Prisma db push)](#bước-5-đồng-bộ-cơ-sở-dữ-liệu-prisma-db-push)
6. [Cấu hình Nginx Reverse Proxy & SSL (HTTPS)](#bước-6-cấu-hình-nginx-reverse-proxy--ssl-https)
7. [Các lệnh quản trị và bảo trì thường dùng](#bước-7-các-lệnh-quản-trị-và-bảo-trì-thường-dùng)

---

## BƯỚC 1: Chuẩn bị và cài đặt Docker trên VPS

Nếu VPS của bạn mới tạo chưa cài đặt Docker, hãy SSH vào VPS (`ssh root@<IP_VPS>`) và chạy lệnh:

```bash
# 1. Cập nhật các gói phần mềm của hệ thống
sudo apt update && sudo apt upgrade -y

# 2. Cài đặt Docker Engine chính thức
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 3. Phân quyền chạy Docker không cần sudo
sudo usermod -aG docker $USER
newgrp docker

# 4. Kiểm tra phiên bản cài đặt thành công
docker --version
docker compose version
```

---

## BƯỚC 2: Tải mã nguồn về VPS

```bash
# Tạo thư mục và clone source code từ GitHub
git clone https://github.com/dinhgiangtech/tiemnho.vn.git /opt/tiemnho

# Di chuyển vào thư mục dự án
cd /opt/tiemnho
```

---

## BƯỚC 3: Cấu hình biến môi trường (.env)

Tạo file `.env` trên VPS trong thư mục `/opt/tiemnho`:

```bash
nano .env
```

Dán nội dung cấu hình Production mẫu bên dưới (thay đổi theo thông tin thực tế của bạn):

```env
# =================================================================
# Database kết nối nội bộ giữa container App và PostgreSQL
# =================================================================
DATABASE_URL="postgresql://tiemnho:tiemnho_secret_password@postgres:5432/tiemnho_db?schema=public"

# =================================================================
# Khóa bí mật Session (tự tạo một chuỗi ngẫu nhiên dài >= 32 ký tự)
# =================================================================
SESSION_SECRET="tiemnho_super_production_secret_key_2026_xyz987"

# =================================================================
# Cấu hình Web Server & Tên miền chính thức
# =================================================================
NODE_ENV="production"
PORT=3000
NEXT_PUBLIC_APP_URL="https://tiemnho.vn"

# =================================================================
# Email Service (Resend)
# =================================================================
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxx"
RESEND_FROM_EMAIL="Tiệm Nhỏ <donhang@tiemnho.vn>"

# =================================================================
# Telegram Bot duyệt đơn
# =================================================================
TELEGRAM_BOT_TOKEN="9159348080:AAE3JwpBnGFOvy47f3bxXfusNl_x4roQ6IA"
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME="tiemnho_order_bot"

# =================================================================
# Cổng thanh toán payOS (Nếu dùng cổng chung hệ thống)
# =================================================================
PAYOS_CLIENT_ID=""
PAYOS_API_KEY=""
PAYOS_CHECKSUM_KEY=""
```

> **Cách lưu file trong nano**: Nhấn tổ hợp phím `Ctrl + O` $\rightarrow$ bấm `Enter` để lưu $\rightarrow$ bấm `Ctrl + X` để thoát.

---

## BƯỚC 4: Build và khởi chạy Docker Compose

Dự án đã có sẵn cấu hình tối ưu đa tầng (Multi-stage build) trong `Dockerfile` và `docker-compose.yml`:
- Tự động cài đặt OpenSSL cho Prisma.
- Đóng gói chế độ Next.js `standalone` siêu nhẹ (~150MB).
- Tự động gắn volume `uploads_data` để ảnh/file tài liệu số của Creator không bị mất khi restart container.

Chạy lệnh build:

```bash
# Build images và khởi chạy background
docker compose up -d --build

# Xem trạng thái các container đang chạy
docker compose ps
```

*Kết quả mong đợi:* Cả 2 container `tiemnho-app` và `tiemnho-postgres` đều có trạng thái `Up (healthy)`.

---

## BƯỚC 5: Đồng bộ cơ sở dữ liệu (Prisma db push)

Sau khi PostgreSQL khởi động thành công, chạy lệnh đẩy cấu trúc bảng vào DB container:

```bash
docker compose exec app npx prisma db push
```

*(Tùy chọn) Nâng quyền Super Admin cho tài khoản của bạn ngay trong DB container:*
```bash
docker compose exec app node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.user.updateMany({ where: { email: 'truonggiangdinh1862@gmail.com' }, data: { role: 'ADMIN' } }).then(() => { console.log('Đã cấp quyền Super Admin thành công!'); process.exit(0); });"
```

---

## BƯỚC 6: Cấu hình Nginx Reverse Proxy & SSL (HTTPS)

Trỏ tên miền `tiemnho.vn` và `www.tiemnho.vn` về IP của VPS trên trang quản lý DNS (Cloudflare, Namecheap, v.v.).

Cài đặt Nginx và Certbot:

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

Tạo file cấu hình Virtual Host:

```bash
sudo nano /etc/nginx/sites-available/tiemnho.vn
```

Dán nội dung cấu hình sau:

```nginx
server {
    server_name tiemnho.vn www.tiemnho.vn;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Cho phép upload file số kích thước lớn
        client_max_body_size 100M;
    }
}
```

Kích hoạt cấu hình và cấp chứng chỉ SSL miễn phí:

```bash
# Tạo symlink
sudo ln -s /etc/nginx/sites-available/tiemnho.vn /etc/nginx/sites-enabled/

# Kiểm tra cú pháp cấu hình Nginx
sudo nginx -t

# Tải lại cấu hình Nginx
sudo systemctl reload nginx

# Cấp chứng chỉ SSL tự động gia hạn
sudo certbot --nginx -d tiemnho.vn -d www.tiemnho.vn
```

---

## BƯỚC 7: Các lệnh quản trị và bảo trì thường dùng

### 1. Xem log ứng dụng
```bash
# Xem log container Next.js thời gian thực
docker compose logs -f app

# Xem log container PostgreSQL
docker compose logs -f postgres
```

### 2. Cập nhật phiên bản code mới từ GitHub
Mỗi khi bạn `git push` code mới lên GitHub, trên VPS chỉ cần chạy:

```bash
cd /opt/tiemnho
git pull origin main
docker compose up -d --build
docker compose exec app npx prisma db push
```

### 3. Sao lưu (Backup) Database định kỳ
```bash
# Tạo file backup sql
docker compose exec -t postgres pg_dump -U tiemnho tiemnho_db > backup_$(date +%F).sql
```
