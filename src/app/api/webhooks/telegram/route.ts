import { NextRequest, NextResponse } from 'next/server';
import { handleTelegramWebhookUpdate } from '@/features/tiemnho/api/services/telegram.service';

export const runtime = 'nodejs';

/**
 * Webhook tiếp nhận sự kiện từ Telegram Bot API
 * Endpoint: /api/webhooks/telegram
 */
export async function POST(req: NextRequest) {
  try {
    const update = await req.json();
    if (!update) {
      return NextResponse.json({ ok: true });
    }

    // Xử lý bất đồng bộ hoặc tuần tự các action từ bot
    await handleTelegramWebhookUpdate(update);

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('[Telegram Webhook Handler Exception]:', error);
    // Luôn trả về 200 OK cho Telegram Bot để tránh Telegram retry liên tục
    return NextResponse.json({ ok: true, error: error?.message });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'online',
    message: 'Telegram Webhook listener is running'
  });
}
