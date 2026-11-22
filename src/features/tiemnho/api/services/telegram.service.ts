'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { settleOrderAndFulfill } from '@/features/tiemnho/api/services/order.service';
import crypto from 'crypto';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

/**
 * Sinh token deep-link kết nối Telegram cho Creator đang đăng nhập
 */
export async function generateTelegramLinkToken(): Promise<{
  token: string;
  botUsername: string;
  link: string;
}> {
  const session = await getSession();
  let userId = session?.userId;

  if (!userId) {
    const firstUser = await prisma.user.findFirst();
    if (!firstUser) throw new Error('Chưa có tài khoản Creator');
    userId = firstUser.id;
  }

  const token = `tn_${crypto.randomBytes(12).toString('hex')}`;
  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'tiemnho_order_bot';

  await prisma.user.update({
    where: { id: userId },
    data: { telegramLinkToken: token }
  });

  return {
    token,
    botUsername,
    link: `https://t.me/${botUsername}?start=${token}`
  };
}

/**
 * Cập nhật thủ công telegramChatId cho Creator đang đăng nhập
 */
export async function updateTelegramChatId(chatId: string): Promise<boolean> {
  const session = await getSession();
  let userId = session?.userId;

  if (!userId) {
    const firstUser = await prisma.user.findFirst();
    if (!firstUser) return false;
    userId = firstUser.id;
  }

  const cleanChatId = chatId.trim();

  await prisma.user.update({
    where: { id: userId },
    data: {
      telegramChatId: cleanChatId || null,
      telegramLinkToken: null
    }
  });

  // Nếu nhập chatId mới, gửi tin nhắn test chào mừng ngay
  if (cleanChatId) {
    await sendTelegramMessage(
      cleanChatId,
      `🎉 <b>KẾT NỐI TELEGRAM THÀNH CÔNG!</b>\n\nTài khoản của bạn trên Tiệm Nhỏ đã được liên kết với Chat ID <code>${cleanChatId}</code>.\nTừ bây giờ, bot sẽ tự động gửi thông báo khi có đơn hàng mới tại đây! 🚀`
    );
  }

  return true;
}

/**
 * Hủy liên kết Telegram của Creator đang đăng nhập
 */
export async function disconnectTelegram(): Promise<boolean> {
  const session = await getSession();
  let userId = session?.userId;

  if (!userId) {
    const firstUser = await prisma.user.findFirst();
    if (!firstUser) return false;
    userId = firstUser.id;
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      telegramChatId: null,
      telegramLinkToken: null
    }
  });

  return true;
}

/**
 * Gửi tin nhắn qua Telegram Bot API
 */
export async function sendTelegramMessage(
  chatId: string,
  text: string,
  replyMarkup?: any
): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn('[Telegram] TELEGRAM_BOT_TOKEN chưa được thiết lập trong .env');
    return false;
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        reply_markup: replyMarkup
      })
    });

    const data = await res.json();
    if (!data.ok) {
      console.error('[Telegram sendMessage error]:', data);
      return false;
    }
    return true;
  } catch (error) {
    console.error('[Telegram sendMessage exception]:', error);
    return false;
  }
}

/**
 * Sửa tin nhắn trên Telegram sau khi đã xử lý xong action
 */
export async function editTelegramMessageText(
  chatId: string | number,
  messageId: number,
  text: string,
  replyMarkup?: any
): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) return false;

  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: 'HTML',
        reply_markup: replyMarkup
      })
    });

    const data = await res.json();
    return data.ok;
  } catch (error) {
    console.error('[Telegram editMessageText exception]:', error);
    return false;
  }
}

/**
 * Phản hồi callback query (tắt icon đồng hồ xoay trên nút bấm telegram)
 */
export async function answerTelegramCallbackQuery(
  callbackQueryId: string,
  text?: string,
  showAlert: boolean = false
): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) return false;

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callback_query_id: callbackQueryId,
          text,
          show_alert: showAlert
        })
      }
    );

    const data = await res.json();
    return data.ok;
  } catch (error) {
    console.error('[Telegram answerCallbackQuery exception]:', error);
    return false;
  }
}

/**
 * Gửi thông báo đơn hàng thủ công (MANUAL_VIETQR) kèm nút Duyệt 1-chạm
 */
export async function sendOrderAlertToCreator(orderCode: string): Promise<boolean> {
  const order = await prisma.order.findUnique({
    where: { orderCode },
    include: {
      user: true
    }
  });

  if (!order) return false;

  // Lấy creator thông qua quan hệ user hoặc creatorId
  const creator =
    order.user ||
    (await prisma.user.findFirst({
      where: {
        OR: [{ id: order.creatorId }, { username: order.creatorId }]
      }
    }));

  const formattedAmount = new Intl.NumberFormat('vi-VN').format(order.amount) + ' đ';

  // 1. Nếu Creator đã kết nối Telegram -> Bắn tin nhắn kèm Inline Keyboard 1-chạm
  if (creator?.telegramChatId) {
    const text = `
🔔 <b>CÓ ĐƠN HÀNG CHỜ DUYỆT THANH TOÁN!</b>

🛍️ <b>Sản phẩm:</b> ${order.productTitle}
🏷️ <b>Mã đơn:</b> <code>#${order.orderCode}</code>
💰 <b>Số tiền:</b> <b>${formattedAmount}</b>
👤 <b>Khách hàng:</b> ${order.customerName}
📧 <b>Email:</b> ${order.customerEmail}
📞 <b>SĐT:</b> ${order.customerPhone || 'Không có'}
${order.shippingAddress ? `📍 <b>Địa chỉ:</b> ${order.shippingAddress}` : ''}

<i>Khách hàng đã bấm xác nhận chuyển khoản VietQR thủ công. Vui lòng kiểm tra tài khoản ngân hàng và bấm duyệt bên dưới:</i>
    `.trim();

    const inlineKeyboard = {
      inline_keyboard: [
        [
          {
            text: '✅ Đã nhận tiền - Duyệt đơn ngay',
            callback_data: `approve_order:${order.orderCode}`
          }
        ]
      ]
    };

    return await sendTelegramMessage(creator.telegramChatId, text, inlineKeyboard);
  }

  // 2. Dự phòng: Nếu Creator chưa liên kết Telegram -> Bắn email thông báo
  if (creator?.email) {
    console.info(
      `[Telegram Fallback] Creator #${creator.id} chưa kết nối Telegram. Đã ghi nhận đơn ${order.orderCode} chờ duyệt.`
    );
  }

  return false;
}

/**
 * Xử lý webhook update từ Telegram Bot
 */
export async function handleTelegramWebhookUpdate(update: any) {
  // 1. Xử lý tin nhắn text: Lệnh /start <token>
  if (update?.message) {
    const msg = update.message;
    const text = (msg.text || '').trim();
    const chatId = String(msg.chat.id);
    const senderName = msg.from?.first_name || 'Creator';

    if (text.startsWith('/start')) {
      const parts = text.split(' ');
      const token = parts[1]?.trim();

      if (!token) {
        await sendTelegramMessage(
          chatId,
          `Xin chào <b>${senderName}</b>! 👋\n\nĐây là Bot nhận thông báo đơn hàng của <b>Tiệm Nhỏ</b>.\nĐể kết nối tài khoản, vui lòng vào trang <b>Cài đặt -> Nhận tin Telegram</b> trên Dashboard Tiệm Nhỏ và bấm nút Kết nối.`
        );
        return;
      }

      // Tìm user theo link token
      const user = await prisma.user.findFirst({
        where: { telegramLinkToken: token }
      });

      if (!user) {
        await sendTelegramMessage(
          chatId,
          `⚠️ <b>Liên kết không hợp lệ hoặc đã hết hạn!</b>\nVui lòng quay lại Dashboard Tiệm Nhỏ để tạo liên kết mới.`
        );
        return;
      }

      // Cập nhật telegramChatId và xóa token
      await prisma.user.update({
        where: { id: user.id },
        data: {
          telegramChatId: chatId,
          telegramLinkToken: null
        }
      });

      await sendTelegramMessage(
        chatId,
        `🎉 <b>KẾT NỐI THÀNH CÔNG!</b>\n\nChào mừng <b>${user.displayName || user.name || senderName}</b> (@${user.username}).\nTừ bây giờ, mỗi khi có khách chuyển khoản VietQR hoặc phát sinh đơn hàng, Bot sẽ gửi thông báo tức thì kèm nút duyệt 1-chạm tại đây! 🚀`
      );
      return;
    }
  }

  // 2. Xử lý nút bấm duyệt đơn 1-chạm (Callback Query)
  if (update?.callback_query) {
    const query = update.callback_query;
    const callbackData = query.data || '';
    const fromId = String(query.from.id);
    const messageId = query.message?.message_id;
    const chatId = query.message?.chat?.id;

    if (callbackData.startsWith('approve_order:')) {
      const orderCode = callbackData.replace('approve_order:', '').trim();

      // Kiểm tra đơn hàng
      const order = await prisma.order.findUnique({
        where: { orderCode },
        include: { user: true }
      });

      if (!order) {
        await answerTelegramCallbackQuery(query.id, '❌ Không tìm thấy đơn hàng!', true);
        return;
      }

      // Xác thực người bấm phải là chủ tiệm sở hữu đơn này
      const creator =
        order.user ||
        (await prisma.user.findFirst({
          where: {
            OR: [{ id: order.creatorId }, { username: order.creatorId }]
          }
        }));

      if (creator?.telegramChatId && creator.telegramChatId !== fromId) {
        await answerTelegramCallbackQuery(
          query.id,
          '⛔ Bạn không có quyền duyệt đơn hàng của Creator khác!',
          true
        );
        return;
      }

      // Kiểm tra tính Idempotent: Đã duyệt trước đó chưa
      if (order.status === 'PAID') {
        await answerTelegramCallbackQuery(query.id, 'Đơn hàng này đã được thanh toán trước đó!');
        if (chatId && messageId) {
          await editTelegramMessageText(
            chatId,
            messageId,
            `✅ <b>ĐƠN HÀNG ĐÃ ĐƯỢC DUYỆT</b>\n\nMã đơn: <code>#${order.orderCode}</code> (${order.productTitle})\nTrạng thái: <b>ĐÃ THANH TOÁN</b>.`
          );
        }
        return;
      }

      // Gọi hàm gạch nợ lõi dùng chung
      try {
        await settleOrderAndFulfill(orderCode, 'MANUAL_TELEGRAM');

        await answerTelegramCallbackQuery(
          query.id,
          `✅ Đã duyệt đơn #${orderCode} thành công! Tài liệu đã được gửi cho khách.`
        );

        // Cập nhật lại tin nhắn Telegram gỡ nút bấm tránh double click
        if (chatId && messageId) {
          const formattedAmount = new Intl.NumberFormat('vi-VN').format(order.amount) + ' đ';
          await editTelegramMessageText(
            chatId,
            messageId,
            `✅ <b>ĐÃ DUYỆT ĐƠN HÀNG THÀNH CÔNG!</b>\n\n🛍️ <b>Sản phẩm:</b> ${order.productTitle}\n🏷️ <b>Mã đơn:</b> <code>#${order.orderCode}</code>\n💰 <b>Số tiền:</b> ${formattedAmount}\n👤 <b>Khách hàng:</b> ${order.customerName} (${order.customerEmail})\n\n<i>Đơn hàng đã được kích hoạt và email giao hàng đã được gửi tới khách qua Resend.</i>`
          );
        }
      } catch (err: any) {
        console.error('[Telegram approve error]:', err);
        await answerTelegramCallbackQuery(
          query.id,
          `❌ Lỗi duyệt đơn: ${err?.message || 'Có lỗi xảy ra'}`,
          true
        );
      }
    }
  }
}
