# HƯỚNG DẪN ĐÓNG GÓI DOCKER & TRIỂN KHAI PRODUCTION LÊN VPS (tiemnho.vn)

Tài liệu hướng dẫn từng bước (Step-by-Step) để build, đóng gói ứng dụng **Tiệm Nhỏ** bằng Docker và triển khai lên máy chủ VPS (Debian 12 / Ubuntu) với PostgreSQL, Nginx Reverse Proxy và SSL Let's Encrypt tự động.

---

## MỤC LỤC
1. [Chuẩn bị máy chủ VPS, SSH & Tạo SWAP (Chống tràn RAM)](#bước-1-chuẩn-bị-máy-chủ-vps-ssh--tạo-swap)
2. [Cài đặt Docker & Git trên VPS](#bước-2-cài-đặt-docker--git-trên-vps)
3. [Tải mã nguồn về VPS](#bước-3-tải-mã-nguồn-về-vps)
4. [Cấu hình biến môi trường (.env)](#bước-4-cấu-hình-biến-môi-trường-env)
5. [Build và khởi chạy Docker Compose](#bước-5-build-và-khởi-chạy-docker-compose)
6. [Đồng bộ cơ sở dữ liệu (Prisma db push chuẩn Prisma v6)](#bước-6-đồng-bộ-cơ-sở-dữ-liệu-prisma-db-push)
7. [Mở cổng tường lửa kiểm tra web trực tiếp](#bước-7-mở-cổng-tường-lửa-kiểm-tra-web-trực-tiếp)
8. [Cấu hình Nginx Reverse Proxy & SSL (HTTPS)](#bước-8-cấu-hình-nginx-reverse-proxy--ssl-https)
9. [Các lệnh quản trị và bảo trì thường dùng](#bước-9-các-lệnh-quản-trị-và-bảo-trì-thường-dùng)

---

## BƯỚC 1: Chuẩn bị máy chủ VPS, SSH & Tạo SWAP

### 1.1 Khắc phục lỗi SSH & Cấp quyền truy cập từ máy tính
Nếu gặp lỗi `WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED!`, trên máy tính cá nhân (PowerShell) chạy:
```powershell
ssh-keygen -R <IP_VPS>
```

Nếu SSH bị ngắt ngay lập tức (`Connection closed by port 22`), đăng nhập qua Web Console của VPS và chạy:
```bash
chmod 700 /root && chmod 700 /root/.ssh
chmod 600 /root/.ssh/authorized_keys 2>/dev/null || true
sed -i 's/^#*PermitRootLogin.*/PermitRootLogin yes/' /etc/ssh/sshd_config
sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication yes/' /etc/ssh/sshd_config
systemctl restart ssh || systemctl restart sshd
```

### 1.2 Tạo bộ nhớ ảo SWAP (Bắt buộc cho VPS <= 2GB RAM để tránh lỗi Out of Memory)
```bash
# Tạo file swap 3GB
fallocate -l 3G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

# Tự động mount swap khi reboot server
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# Kiểm tra dung lượng RAM & Swap
free -h
```

---

## BƯỚC 2: Cài đặt Docker & Git trên VPS

SSH vào VPS (`ssh root@<IP_VPS>`) và chạy:

```bash
# 1. Cập nhật hệ điều hành và cài đặt Git, cURL
apt update && apt install -y git curl ufw

# 2. Cài đặt Docker Engine chính thức
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 3. Kiểm tra phiên bản
docker --version
docker compose version
```

---

## BƯỚC 3: Tải mã nguồn về VPS

```bash
# Clone source code từ GitHub về thư mục root hoặc /opt/tiemnho
git clone https://github.com/dinhgiangtech/tiemnho.vn.git ~/tiemnho.vn

# Di chuyển vào thư mục dự án
cd ~/tiemnho.vn
```

---

## BƯỚC 4: Cấu hình biến môi trường (.env)

Tạo file `.env` trong thư mục dự án:

```bash
nano .env
```

Dán nội dung cấu hình Production mẫu bên dưới (thay đổi theo thông tin thực tế của bạn):

```env
# =================================================================
# Database & Container Configuration
# =================================================================
POSTGRES_USER="tiemnho"
POSTGRES_PASSWORD="tiemnho_secret_password"
POSTGRES_DB="tiemnho_db"

# Port mapping ngoài VPS
APP_PORT=3088
DB_PORT=5488

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

## BƯỚC 5: Build và khởi chạy Docker Compose

Dự án đã có sẵn cấu hình tối ưu đa tầng (Multi-stage build) trong `Dockerfile` bằng Node.js 22 chuẩn:
- Tự động bỏ qua lint/typecheck lặp lại để tăng tốc build tối đa.
- Cấp sẵn dummy `DATABASE_URL` và `SESSION_SECRET` lúc build để biên dịch trơn tru các server action.
- Tự động mount persistent volume `uploads_data` giữ an toàn cho file tải lên.

Chạy lệnh build:

```bash
# Build images và khởi chạy ngầm
docker compose up -d --build

# Kiểm tra trạng thái containers
docker compose ps
```

*Kết quả mong đợi:*
- `tiemnho-postgres`: `Up (healthy)`
- `tiemnho-app`: `Up ... 0.0.0.0:3088->3000/tcp`

---

## BƯỚC 6: Đồng bộ cơ sở dữ liệu (Prisma db push)

> [!IMPORTANT]
> **Chú ý phiên bản Prisma:** Dự án đang sử dụng **Prisma v6**. Không chạy lệnh `npx prisma db push` trần vì npx sẽ tự kéo Prisma v8 (bị đổi lệnh gây lỗi). Hãy chỉ định rõ `@6`:

```bash
# Đồng bộ schema vào PostgreSQL container
docker compose run --rm app npx prisma@6 db push
```

*(Tùy chọn) Nâng quyền Super Admin cho tài khoản của bạn ngay trong DB container:*
```bash
docker compose exec app node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.user.updateMany({ where: { email: 'truonggiangdinh1862@gmail.com' }, data: { role: 'ADMIN' } }).then(() => { console.log('Đã cấp quyền Super Admin thành công!'); process.exit(0); });"
```

---

## BƯỚC 7: Mở cổng tường lửa kiểm tra web trực tiếp

Mở cổng `3088` trên VPS:
```bash
ufw allow 3088/tcp 2>/dev/null || true
iptables -I INPUT -p tcp --dport 3088 -j ACCEPT
```

Bây giờ bạn có thể mở trình duyệt trên máy tính gõ:
```text
http://<IP_VPS>:3088
```
để kiểm tra xem trang chủ và dashboard đã hoạt động trơn tru hay chưa.

---

## BƯỚC 8: Cấu hình Nginx Reverse Proxy & SSL (HTTPS)

Trỏ tên miền `tiemnho.vn` và `www.tiemnho.vn` về IP của VPS trên trang quản lý DNS (Cloudflare, Namecheap, v.v.).

Cài đặt Nginx và Certbot:

```bash
apt install -y nginx certbot python3-certbot-nginx
```

Tạo file cấu hình Virtual Host:

```bash
nano /etc/nginx/sites-available/tiemnho.vn
```

Dán nội dung cấu hình sau:

```nginx
server {
    server_name tiemnho.vn www.tiemnho.vn;

    location / {
        proxy_pass http://127.0.0.1:3088;
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
ln -s /etc/nginx/sites-available/tiemnho.vn /etc/nginx/sites-enabled/

# Kiểm tra cú pháp cấu hình Nginx
nginx -t

# Tải lại cấu hình Nginx
systemctl reload nginx

# Cấp chứng chỉ SSL tự động gia hạn (Let's Encrypt)
certbot --nginx -d tiemnho.vn -d www.tiemnho.vn
```

---

## BƯỚC 9: Các lệnh quản trị và bảo trì thường dùng

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
cd ~/tiemnho.vn
git pull origin main
docker compose up -d --build
docker compose run --rm app npx prisma@6 db push
```

### 3. Dọn sạch Docker cache khi cần build lại từ đầu
```bash
docker builder prune -a -f
docker system prune -f
```

### 4. Sao lưu (Backup) Database định kỳ
```bash
# Tạo file backup sql
docker compose exec -t postgres pg_dump -U tiemnho tiemnho_db > backup_$(date +%F).sql
```
