'use server';

import { resend, DEFAULT_FROM_EMAIL } from '@/lib/resend';
import { ProductType, type Order } from '@/constants/mock-tiemnho';

export interface EmailResult {
  success: boolean;
  id?: string;
  simulated?: boolean;
  error?: string;
}

export interface SendDigitalDeliveryParams {
  to: string;
  customerName: string;
  orderCode: string;
  productTitle: string;
  amount: number;
  downloadUrl: string;
  creatorName?: string;
  expiresHours?: number;
}

export interface SendPhysicalConfirmationParams {
  to: string;
  customerName: string;
  orderCode: string;
  productTitle: string;
  amount: number;
  shippingAddress?: string;
  creatorName?: string;
}

export interface SendLeadMagnetParams {
  to: string;
  customerName: string;
  productTitle: string;
  downloadUrl: string;
  creatorName?: string;
}

export interface SendOnboardingOtpParams {
  to: string;
  name?: string;
  otpCode: string;
  expiresMinutes?: number;
}

/**
 * Format VNĐ currency
 */
function formatVND(amount: number): string {
  if (amount === 0) return '0 đ (Miễn phí)';
  return `${new Intl.NumberFormat('vi-VN').format(amount)} đ`;
}

/**
 * Base email layout wrapper
 */
function wrapEmailTemplate(
  content: string,
  previewText?: string,
  tagText: string = 'Tiệm Nhỏ'
): string {
  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tiệm Nhỏ</title>
  ${previewText ? `<meta name="description" content="${previewText}">` : ''}
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body, table, td, p, a, li, blockquote {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table, td {
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      -ms-interpolation-mode: bicubic;
      border: 0;
      outline: none;
      text-decoration: none;
    }
    body {
      margin: 0;
      padding: 0;
      width: 100% !important;
      height: 100% !important;
      background-color: #f7f7f8;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #18181b;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #f7f7f8;
      padding-bottom: 40px;
    }
    .container {
      width: 100%;
      max-width: 540px;
      margin: 32px auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid #e5e7eb;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
      border-bottom: 1px solid #f3f4f6;
    }
    .header-cell {
      padding: 20px 28px;
    }
    .brand-title {
      font-size: 16px;
      font-weight: 800;
      color: #111827;
      letter-spacing: -0.02em;
      text-decoration: none;
      display: inline-block;
    }
    .brand-dot {
      color: #fe2c55;
    }
    .tag-badge {
      font-size: 11px;
      font-weight: 700;
      background: #f3f4f6;
      color: #4b5563;
      padding: 4px 10px;
      border-radius: 9999px;
      letter-spacing: 0.02em;
      text-transform: uppercase;
    }
    .content-body {
      padding: 32px 28px;
    }
    .footer-cell {
      padding: 24px 28px;
      background: #fafafa;
      border-top: 1px solid #f3f4f6;
      text-align: center;
      font-size: 11px;
      color: #9ca3af;
      line-height: 1.6;
    }
    .title {
      font-size: 20px;
      font-weight: 800;
      color: #111827;
      margin: 0 0 8px 0;
      line-height: 1.3;
      letter-spacing: -0.02em;
    }
    .greeting {
      font-size: 13px;
      color: #6b7280;
      margin: 0 0 20px 0;
      line-height: 1.6;
    }
    .card {
      background: #fafafa;
      border: 1px solid #f3f4f6;
      border-radius: 12px;
      padding: 18px;
      margin: 20px 0;
    }
    .item-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      font-size: 13px;
      border-bottom: 1px dashed #e5e7eb;
    }
    .item-row:last-child {
      border-bottom: none;
    }
    .item-label {
      color: #6b7280;
    }
    .item-value {
      font-weight: 600;
      color: #111827;
    }
    .btn {
      display: block;
      width: 100%;
      box-sizing: border-box;
      background-color: #111827;
      color: #ffffff !important;
      text-decoration: none;
      text-align: center;
      padding: 13px 20px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 700;
      margin: 24px 0 16px 0;
    }
    .notice {
      font-size: 12px;
      color: #6b7280;
      line-height: 1.6;
      margin-top: 20px;
      padding: 14px 16px;
      background: #f9fafb;
      border: 1px solid #f3f4f6;
      border-radius: 10px;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <table class="header-table" role="presentation">
        <tr>
          <td class="header-cell" align="left">
            <span class="brand-title">Tiệm Nhỏ<span class="brand-dot">.</span></span>
          </td>
          <td class="header-cell" align="right">
            <span class="tag-badge">${tagText}</span>
          </td>
        </tr>
      </table>
      <div class="content-body">
        ${content}
      </div>
      <table width="100%" role="presentation">
        <tr>
          <td class="footer-cell">
            <p style="margin: 0 0 4px 0;">Email tự động gửi từ hệ thống <strong>Tiệm Nhỏ</strong></p>
            <p style="margin: 0;">Nền tảng Storefront tinh gọn dành cho Creator Việt Nam</p>
          </td>
        </tr>
      </table>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * 1. Gửi email giao sản phẩm số (DIGITAL)
 */
export async function sendDigitalDeliveryEmail(
  params: SendDigitalDeliveryParams
): Promise<EmailResult> {
  const {
    to,
    customerName,
    orderCode,
    productTitle,
    amount,
    downloadUrl,
    creatorName = 'Chủ Tiệm',
    expiresHours = 72
  } = params;

  const subject = `[${orderCode}] Link nhận tài liệu: ${productTitle} - Tiệm Nhỏ`;

  const html = wrapEmailTemplate(
    `
    <h1 class="title">Thanh toán thành công!</h1>
    <p class="greeting">Chào <strong>${customerName}</strong>, cảm ơn bạn đã ủng hộ tiệm của <strong>${creatorName}</strong>. Đơn hàng của bạn đã được kích hoạt thành công.</p>
    
    <div class="card">
      <div class="item-row">
        <span class="item-label">Mã đơn hàng:</span>
        <span class="item-value" style="font-family: monospace; color: #d97706;">#${orderCode}</span>
      </div>
      <div class="item-row">
        <span class="item-label">Sản phẩm:</span>
        <span class="item-value">${productTitle}</span>
      </div>
      <div class="item-row">
        <span class="item-label">Số tiền:</span>
        <span class="item-value" style="color: #059669;">${formatVND(amount)}</span>
      </div>
      <div class="item-row">
        <span class="item-label">Phương thức:</span>
        <span class="item-value">VietQR Napas247</span>
      </div>
    </div>

    <a href="${downloadUrl}" class="btn" target="_blank" rel="noreferrer">
      Mở & Tải tài liệu ngay
    </a>

    <div class="notice">
      <strong>Lưu ý bảo mật:</strong> Liên kết tải tài liệu có giá trị truy cập trong <strong>${expiresHours} giờ</strong>. Vui lòng lưu tài nguyên về thiết bị hoặc tài khoản cá nhân của bạn.
    </div>
  `,
    `Đơn hàng #${orderCode} đã thanh toán thành công. Bấm để nhận tài liệu.`,
    'Giao tài liệu'
  );

  if (!resend) {
    console.info(`[Resend Simulated] Gửi email Digital Delivery tới ${to}:`, {
      orderCode,
      downloadUrl,
      subject
    });
    return { success: true, simulated: true };
  }

  try {
    const data = await resend.emails.send({
      from: DEFAULT_FROM_EMAIL,
      to: [to],
      subject,
      html
    });

    if (data.error) {
      console.error('[Resend Error] Không thể gửi email:', data.error);
      return { success: false, error: data.error.message };
    }

    return { success: true, id: data.data?.id };
  } catch (error: any) {
    console.error('[Resend Exception]:', error);
    return { success: false, error: error?.message || 'Lỗi gửi email Resend' };
  }
}

/**
 * 2. Gửi email xác nhận đơn hàng vật lý (PHYSICAL)
 */
export async function sendPhysicalOrderConfirmationEmail(
  params: SendPhysicalConfirmationParams
): Promise<EmailResult> {
  const {
    to,
    customerName,
    orderCode,
    productTitle,
    amount,
    shippingAddress,
    creatorName = 'Chủ Tiệm'
  } = params;

  const subject = `[${orderCode}] Xác nhận đặt hàng: ${productTitle} - Tiệm Nhỏ`;

  const html = wrapEmailTemplate(
    `
    <h1 class="title">Xác nhận đơn hàng thành công!</h1>
    <p class="greeting">Chào <strong>${customerName}</strong>, đơn hàng của bạn tại tiệm của <strong>${creatorName}</strong> đã được ghi nhận và xác thực thanh toán.</p>
    
    <div class="card">
      <div class="item-row">
        <span class="item-label">Mã đơn hàng:</span>
        <span class="item-value" style="font-family: monospace; color: #d97706;">#${orderCode}</span>
      </div>
      <div class="item-row">
        <span class="item-label">Sản phẩm:</span>
        <span class="item-value">${productTitle}</span>
      </div>
      <div class="item-row">
        <span class="item-label">Tổng thanh toán:</span>
        <span class="item-value" style="color: #059669;">${formatVND(amount)}</span>
      </div>
      ${
        shippingAddress
          ? `
      <div class="item-row">
        <span class="item-label">Địa chỉ giao hàng:</span>
        <span class="item-value" style="text-align: right; max-width: 60%;">${shippingAddress}</span>
      </div>`
          : ''
      }
      <div class="item-row">
        <span class="item-label">Trạng thái:</span>
        <span class="item-value" style="color: #2563eb;">Đang chuẩn bị hàng</span>
      </div>
    </div>

    <div class="notice">
      Người bán sẽ sớm tiến hành đóng gói và giao hàng theo địa chỉ bạn cung cấp. Thông tin vận đơn sẽ được cập nhật trực tiếp.
    </div>
  `,
    `Xác nhận đơn hàng #${orderCode} đã thanh toán thành công.`,
    'Đơn hàng'
  );

  if (!resend) {
    console.info(`[Resend Simulated] Gửi email Physical Order tới ${to}:`, {
      orderCode,
      subject
    });
    return { success: true, simulated: true };
  }

  try {
    const data = await resend.emails.send({
      from: DEFAULT_FROM_EMAIL,
      to: [to],
      subject,
      html
    });

    if (data.error) {
      console.error('[Resend Error] Không thể gửi email:', data.error);
      return { success: false, error: data.error.message };
    }

    return { success: true, id: data.data?.id };
  } catch (error: any) {
    console.error('[Resend Exception]:', error);
    return { success: false, error: error?.message || 'Lỗi gửi email Resend' };
  }
}

/**
 * 3. Gửi email quà tặng miễn phí (LEAD_MAGNET 0đ)
 */
export async function sendLeadMagnetEmail(params: SendLeadMagnetParams): Promise<EmailResult> {
  const { to, customerName, productTitle, downloadUrl, creatorName = 'Chủ Tiệm' } = params;

  const subject = `Món quà từ ${creatorName}: ${productTitle}`;

  const html = wrapEmailTemplate(
    `
    <h1 class="title">Món quà dành riêng cho bạn!</h1>
    <p class="greeting">Chào <strong>${customerName}</strong>, cảm ơn bạn đã quan tâm. Dưới đây là liên kết truy cập tài liệu miễn phí từ <strong>${creatorName}</strong>.</p>
    
    <div class="card">
      <div class="item-row">
        <span class="item-label">Tài liệu:</span>
        <span class="item-value">${productTitle}</span>
      </div>
      <div class="item-row">
        <span class="item-label">Chi phí:</span>
        <span class="item-value" style="color: #059669;">0 đ (Miễn phí)</span>
      </div>
    </div>

    <a href="${downloadUrl}" class="btn" target="_blank" rel="noreferrer">
      Nhận & Xem tài liệu ngay
    </a>
  `,
    `Tài liệu miễn phí ${productTitle} đã sẵn sàng.`,
    'Quà tặng'
  );

  if (!resend) {
    console.info(`[Resend Simulated] Gửi email Lead Magnet tới ${to}:`, {
      productTitle,
      downloadUrl,
      subject
    });
    return { success: true, simulated: true };
  }

  try {
    const data = await resend.emails.send({
      from: DEFAULT_FROM_EMAIL,
      to: [to],
      subject,
      html
    });

    if (data.error) {
      console.error('[Resend Error] Không thể gửi email:', data.error);
      return { success: false, error: data.error.message };
    }

    return { success: true, id: data.data?.id };
  } catch (error: any) {
    console.error('[Resend Exception]:', error);
    return { success: false, error: error?.message || 'Lỗi gửi email Resend' };
  }
}

/**
 * 4. Helper tự động kích hoạt gửi email cho đơn hàng dựa trên Product Type
 */
export async function sendOrderFulfillmentEmail(
  order: Order,
  options?: {
    downloadUrl?: string;
    creatorName?: string;
    expiresHours?: number;
  }
): Promise<EmailResult> {
  if (!order.customerEmail) {
    return { success: false, error: 'Đơn hàng không có địa chỉ email người nhận' };
  }

  const rawUrl = options?.downloadUrl || order.downloadUrl || '#';
  let effectiveDownloadUrl = rawUrl;

  // Nếu là đường dẫn cục bộ (ví dụ: /uploads/products/xyz.pdf), chuyển thành URL tuyệt đối
  if (effectiveDownloadUrl.startsWith('/')) {
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/+$/, '');
    effectiveDownloadUrl = `${appUrl}${effectiveDownloadUrl}`;
  }

  if (order.productType === ProductType.DIGITAL) {
    return sendDigitalDeliveryEmail({
      to: order.customerEmail,
      customerName: order.customerName,
      orderCode: order.orderCode,
      productTitle: order.productTitle,
      amount: order.amount,
      downloadUrl: effectiveDownloadUrl,
      creatorName: options?.creatorName,
      expiresHours: options?.expiresHours ?? 72
    });
  }

  if (order.productType === ProductType.PHYSICAL) {
    return sendPhysicalOrderConfirmationEmail({
      to: order.customerEmail,
      customerName: order.customerName,
      orderCode: order.orderCode,
      productTitle: order.productTitle,
      amount: order.amount,
      shippingAddress: order.shippingAddress,
      creatorName: options?.creatorName
    });
  }

  if (order.productType === ProductType.LEAD_MAGNET) {
    return sendLeadMagnetEmail({
      to: order.customerEmail,
      customerName: order.customerName,
      productTitle: order.productTitle,
      downloadUrl: effectiveDownloadUrl,
      creatorName: options?.creatorName
    });
  }

  return { success: true, simulated: true };
}

/**
 * 5. Gửi email kiểm tra cấu hình Resend (Ping Test)
 */
export async function sendTestEmail(to: string): Promise<EmailResult> {
  if (!resend) {
    return {
      success: false,
      simulated: true,
      error: 'RESEND_API_KEY chưa được cấu hình trong biến môi trường (.env).'
    };
  }

  try {
    const data = await resend.emails.send({
      from: DEFAULT_FROM_EMAIL,
      to: [to],
      subject: 'Tiệm Nhỏ: Kiểm tra kết nối dịch vụ gửi email Resend thành công',
      html: wrapEmailTemplate(`
        <h1 class="title">Kết nối Resend thành công!</h1>
        <p class="greeting">Hệ thống gửi email tự động của Tiệm Nhỏ đã được thiết lập chính xác.</p>
        <div class="notice">
          Thời gian kiểm tra: <strong>${new Date().toLocaleString('vi-VN')}</strong>
        </div>
      `)
    });

    if (data.error) {
      return { success: false, error: data.error.message };
    }

    return { success: true, id: data.data?.id };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Lỗi gửi email kiểm tra' };
  }
}

/**
 * 6. Gửi mã OTP xác thực email khi mở tiệm (Onboarding)
 */
export async function sendOnboardingOtpEmail(
  params: SendOnboardingOtpParams
): Promise<EmailResult> {
  const { to, name = 'bạn', otpCode, expiresMinutes = 10 } = params;
  const subject = `[${otpCode}] Mã xác thực mở tiệm - Tiệm Nhỏ`;

  const html = wrapEmailTemplate(
    `
    <h1 class="title">Xác thực địa chỉ email</h1>
    <p class="greeting">Chào <strong>${name}</strong>, cảm ơn bạn đã đăng ký mở tiệm trên Tiệm Nhỏ. Vui lòng nhập mã xác thực (OTP) dưới đây để hoàn tất kích hoạt tài khoản của bạn:</p>
    
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 28px 16px; text-align: center; margin: 28px 0;">
      <div style="font-family: ui-monospace, 'SFMono-Regular', Menlo, Monaco, Consolas, monospace; font-size: 38px; font-weight: 800; letter-spacing: 12px; color: #0f172a; display: inline-block; padding-left: 12px;">
        ${otpCode}
      </div>
      <p style="margin: 10px 0 0 0; font-size: 13px; color: #64748b; font-weight: 500;">
        Mã xác thực có hiệu lực trong vòng <strong>${expiresMinutes} phút</strong>
      </p>
    </div>

    <div style="background-color: #fafafa; border-left: 3px solid #0f172a; padding: 14px 16px; border-radius: 0 8px 8px 0; margin: 24px 0;">
      <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #475569;">
        <strong>Lưu ý bảo mật:</strong> Không chia sẻ mã xác thực này cho bất kỳ ai, kể cả nhân viên hỗ trợ của Tiệm Nhỏ. Nếu bạn không thực hiện yêu cầu này, bạn có thể an tâm bỏ qua email.
      </p>
    </div>
  `,
    `Mã xác thực Tiệm Nhỏ của bạn là ${otpCode}`,
    'Bảo mật'
  );

  if (!resend) {
    console.info(`[Resend Simulated] Gửi email OTP Onboarding tới ${to}:`, {
      otpCode,
      subject
    });
    return { success: true, simulated: true };
  }

  try {
    const data = await resend.emails.send({
      from: DEFAULT_FROM_EMAIL,
      to: [to],
      subject,
      html
    });

    if (data.error) {
      console.error('[Resend Error] Không thể gửi email OTP:', data.error);
      return { success: false, error: data.error.message };
    }

    return { success: true, id: data.data?.id };
  } catch (error: any) {
    console.error('[Resend Exception]:', error);
    return { success: false, error: error?.message || 'Lỗi gửi email Resend' };
  }
}

export interface SendLoginOtpParams {
  to: string;
  name?: string;
  otpCode: string;
  expiresMinutes?: number;
}

/**
 * 7. Gửi mã OTP đăng nhập nhanh qua email (Passwordless Login)
 */
export async function sendLoginOtpEmail(params: SendLoginOtpParams): Promise<EmailResult> {
  const { to, name = 'bạn', otpCode, expiresMinutes = 10 } = params;
  const subject = `[${otpCode}] Mã đăng nhập Tiệm Nhỏ`;

  const html = wrapEmailTemplate(
    `
    <h1 class="title">Mã xác thực đăng nhập</h1>
    <p class="greeting">Chào <strong>${name}</strong>, bạn vừa yêu cầu đăng nhập nhanh vào tài khoản Tiệm Nhỏ. Vui lòng nhập mã xác thực (OTP) dưới đây để tiếp tục:</p>
    
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 28px 16px; text-align: center; margin: 28px 0;">
      <div style="font-family: ui-monospace, 'SFMono-Regular', Menlo, Monaco, Consolas, monospace; font-size: 38px; font-weight: 800; letter-spacing: 12px; color: #0f172a; display: inline-block; padding-left: 12px;">
        ${otpCode}
      </div>
      <p style="margin: 10px 0 0 0; font-size: 13px; color: #64748b; font-weight: 500;">
        Mã xác thực có hiệu lực trong vòng <strong>${expiresMinutes} phút</strong>
      </p>
    </div>

    <div style="background-color: #fafafa; border-left: 3px solid #0f172a; padding: 14px 16px; border-radius: 0 8px 8px 0; margin: 24px 0;">
      <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #475569;">
        <strong>Lưu ý bảo mật:</strong> Không chia sẻ mã xác thực này cho bất kỳ ai. Nếu bạn không yêu cầu đăng nhập, vui lòng kiểm tra lại bảo mật tài khoản hoặc bỏ qua email này.
      </p>
    </div>
  `,
    `Mã đăng nhập Tiệm Nhỏ của bạn là ${otpCode}`,
    'Đăng nhập'
  );

  if (!resend) {
    console.info(`[Resend Simulated] Gửi email OTP Login tới ${to}:`, {
      otpCode,
      subject
    });
    return { success: true, simulated: true };
  }

  try {
    const data = await resend.emails.send({
      from: DEFAULT_FROM_EMAIL,
      to: [to],
      subject,
      html
    });

    if (data.error) {
      console.error('[Resend Error] Không thể gửi email OTP Login:', data.error);
      return { success: false, error: data.error.message };
    }

    return { success: true, id: data.data?.id };
  } catch (error: any) {
    console.error('[Resend Exception]:', error);
    return { success: false, error: error?.message || 'Lỗi gửi email Resend' };
  }
}
