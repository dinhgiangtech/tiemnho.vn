'use client';

import * as React from 'react';
import { PaymentConfig, VIETNAMESE_BANKS } from '@/constants/mock-tiemnho';
import { getPaymentConfig, updatePaymentConfig, pingTest } from '../../api/service';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { toast } from 'sonner';

export function PaymentSettingsView() {
  const [config, setConfig] = React.useState<PaymentConfig | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [pinging, setPinging] = React.useState(false);

  // Form states
  const [bankId, setBankId] = React.useState('MB');
  const [accountNumber, setAccountNumber] = React.useState('');
  const [accountName, setAccountName] = React.useState('');
  const [provider, setProvider] = React.useState<'payOS' | 'SePay'>('payOS');
  const [apiKey, setApiKey] = React.useState('');
  const [checksumKey, setChecksumKey] = React.useState('');
  const [pingResult, setPingResult] = React.useState<{
    success: boolean;
    message: string;
    code: string;
    amount: number;
    time: string;
  } | null>(null);

  const fetchConfig = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPaymentConfig();
      setConfig(data);
      setBankId(data.bankId);
      setAccountNumber(data.accountNumber);
      setAccountName(data.accountName);
      setProvider(data.provider);
      setApiKey(data.apiKey);
      setChecksumKey(data.checksumKey);
    } catch {
      toast.error('Lỗi khi tải cấu hình thanh toán');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountNumber.trim()) {
      toast.error('Vui lòng nhập số tài khoản ngân hàng');
      return;
    }
    if (!accountName.trim()) {
      toast.error('Vui lòng nhập tên chủ tài khoản (viết hoa không dấu)');
      return;
    }

    setSaving(true);
    try {
      const selectedBank = VIETNAMESE_BANKS.find((b) => b.id === bankId);
      const updated = await updatePaymentConfig({
        bankId,
        bankName: selectedBank ? `${selectedBank.name} (${selectedBank.shortName})` : bankId,
        accountNumber: accountNumber.trim(),
        accountName: accountName.trim().toUpperCase(),
        provider,
        apiKey: apiKey.trim(),
        checksumKey: checksumKey.trim()
      });
      setConfig(updated);
      toast.success('Đã lưu cấu hình thanh toán VietQR thành công!');
    } catch {
      toast.error('Không thể lưu cấu hình');
    } finally {
      setSaving(false);
    }
  };

  const handlePingTest = async () => {
    setPinging(true);
    try {
      const res = await pingTest();
      setPingResult({
        success: true,
        message: res.message,
        code: res.simulatedOrderCode,
        amount: res.amount,
        time: res.time
      });
      toast.success(res.message);
    } catch {
      toast.error('Lỗi khi bắn thử Ping Test');
    } finally {
      setPinging(false);
    }
  };

  const webhookUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/api/webhooks/vietqr`
      : 'https://tiemnho.vn/api/webhooks/vietqr';

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    toast.success('Đã sao chép địa chỉ Webhook!');
  };

  if (loading || !config) {
    return (
      <div className='p-8 text-center text-xs text-muted-foreground'>
        Đang tải cấu hình nhận tiền...
      </div>
    );
  }

  return (
    <div className='max-w-4xl space-y-6'>
      {/* Triết lý No Escrow Banner */}
      <div className='rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 flex items-start gap-3'>
        <div className='h-8 w-8 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5'>
          <Icons.check className='h-5 w-5' />
        </div>
        <div className='space-y-1 text-xs'>
          <h4 className='font-bold text-foreground text-sm flex items-center gap-2'>
            Triết lý Dòng tiền: Không giữ tiền trung gian (No Escrow)
            <Badge
              variant='outline'
              className='bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]'
            >
              0% Phí giao dịch
            </Badge>
          </h4>
          <p className='text-muted-foreground leading-relaxed'>
            Người mua quét mã VietQR thì tiền sẽ chuyển thẳng{' '}
            <strong>100% vào số tài khoản ngân hàng chính chủ của bạn</strong>. Tiệm Nhỏ không giữ
            tiền hộ, không trung gian ví và tuân thủ hoàn toàn theo Nghị định 52/2024/NĐ-CP.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className='space-y-6'>
        {/* Khối 1: Tài khoản ngân hàng nhận tiền */}
        <Card className='border border-border shadow-xs'>
          <CardHeader>
            <CardTitle className='text-base font-bold'>
              1. Tài khoản ngân hàng nhận tiền chính chủ
            </CardTitle>
            <CardDescription className='text-xs'>
              Mã VietQR động trên Storefront sẽ được sinh dựa trên thông tin tài khoản này.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4 text-xs'>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div className='space-y-1.5'>
                <label className='font-semibold text-foreground text-xs'>Ngân hàng nhận tiền</label>
                <select
                  value={bankId}
                  onChange={(e) => setBankId(e.target.value)}
                  className='w-full h-10 text-xs rounded-xl border border-border bg-background px-3 font-medium'
                >
                  {VIETNAMESE_BANKS.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.shortName} - {b.name} ({b.bin})
                    </option>
                  ))}
                </select>
              </div>

              <div className='space-y-1.5'>
                <label className='font-semibold text-foreground text-xs'>
                  Số tài khoản nhận tiền (STK) <span className='text-primary font-bold'>*</span>
                </label>
                <Input
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder='VD: 0988667788'
                  className='h-10 text-sm font-mono rounded-xl'
                  required
                />
              </div>
            </div>

            <div className='space-y-1.5'>
              <label className='font-semibold text-foreground text-xs'>
                Tên chủ tài khoản (Viết hoa không dấu){' '}
                <span className='text-primary font-bold'>*</span>
              </label>
              <Input
                value={accountName}
                onChange={(e) => setAccountName(e.target.value.toUpperCase())}
                placeholder='VD: DINH VAN GIANG'
                className='h-10 text-sm font-mono tracking-wide rounded-xl uppercase'
                required
              />
              <p className='text-[11px] text-muted-foreground'>
                Cần trùng khớp 100% với tên đăng ký tài khoản ngân hàng để VietQR hiển thị đúng trên
                app ngân hàng người mua.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Khối 2: Cổng kết nối Webhook bắt biến động */}
        <Card className='border border-border shadow-xs'>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <div>
                <CardTitle className='text-base font-bold'>
                  2. Kết nối tự động hóa biến động số dư (Webhook)
                </CardTitle>
                <CardDescription className='text-xs'>
                  Hệ thống sử dụng cổng đối soát payOS hoặc SePay để tự động kích hoạt trạng thái Đã
                  Thanh Toán và giao tài nguyên.
                </CardDescription>
              </div>
              <Badge
                variant='outline'
                className='bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs'
              >
                ● Hoạt động 24/7
              </Badge>
            </div>
          </CardHeader>
          <CardContent className='space-y-4 text-xs'>
            <div className='space-y-1.5'>
              <label className='font-semibold text-foreground text-xs'>
                Cổng đối soát được chọn:
              </label>
              <div className='flex gap-3'>
                {(['payOS', 'SePay'] as const).map((p) => (
                  <button
                    key={p}
                    type='button'
                    onClick={() => setProvider(p)}
                    className={`flex-1 p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      provider === p
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <div className='font-bold text-sm text-foreground'>{p}</div>
                    <div className='text-[11px] text-muted-foreground'>
                      {p === 'payOS'
                        ? 'Cổng thanh toán VietQR mã nguồn mở'
                        : 'Dịch vụ bắt biến động số dư ngân hàng'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className='space-y-1.5'>
              <label className='font-semibold text-foreground text-xs'>
                Địa chỉ nhận thông báo (Webhook URL)
              </label>
              <div className='flex gap-2'>
                <Input
                  readOnly
                  value={webhookUrl}
                  className='h-10 text-xs font-mono bg-muted/50 rounded-xl'
                />
                <Button
                  type='button'
                  variant='outline'
                  onClick={handleCopyWebhook}
                  className='h-10 px-3 text-xs gap-1 rounded-xl shrink-0'
                >
                  <Icons.copy className='h-3.5 w-3.5' />
                  Sao chép URL
                </Button>
              </div>
              <p className='text-[11px] text-muted-foreground'>
                Dán URL này vào mục Cấu hình Webhook trong trang quản trị {provider} của bạn.
              </p>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1'>
              <div className='space-y-1.5'>
                <label className='font-semibold text-foreground text-xs'>
                  Mã kết nối (Client ID / API Key)
                </label>
                <Input
                  type='password'
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder='pos_live_...'
                  className='h-10 text-xs font-mono rounded-xl'
                />
              </div>

              <div className='space-y-1.5'>
                <label className='font-semibold text-foreground text-xs'>
                  Khóa kiểm tra tính toàn vẹn (Checksum Key / Secret)
                </label>
                <Input
                  type='password'
                  value={checksumKey}
                  onChange={(e) => setChecksumKey(e.target.value)}
                  placeholder='cs_...'
                  className='h-10 text-xs font-mono rounded-xl'
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className='border-t border-border pt-4 flex flex-col sm:flex-row justify-between gap-3'>
            <Button
              type='button'
              variant='outline'
              onClick={handlePingTest}
              disabled={pinging}
              className='h-10 text-xs gap-1.5 rounded-xl border-dashed border-primary/50 text-primary hover:bg-primary/5'
            >
              <Icons.bolt className='h-4 w-4 text-amber-500' />
              {pinging ? 'Đang gửi giao dịch...' : 'Bắn thử giao dịch kiểm tra kết nối (Ping Test)'}
            </Button>

            <Button
              type='submit'
              disabled={saving}
              className='h-10 text-xs font-semibold rounded-xl px-5 shadow-xs'
            >
              {saving ? 'Đang lưu...' : 'Lưu cài đặt thanh toán'}
            </Button>
          </CardFooter>
        </Card>
      </form>

      {/* Ping Test Result Box */}
      {pingResult && (
        <Card className='border border-emerald-500/40 bg-emerald-500/5 shadow-xs animate-in fade-in-50'>
          <CardHeader className='pb-2'>
            <div className='flex items-center justify-between'>
              <CardTitle className='text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5'>
                <Icons.check className='h-4 w-4' />
                Kết quả Ping Test: Thành công tuyệt đối
              </CardTitle>
              <Badge
                variant='outline'
                className='bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px]'
              >
                HTTP 200 OK
              </Badge>
            </div>
          </CardHeader>
          <CardContent className='text-xs space-y-1.5 text-muted-foreground'>
            <p>• {pingResult.message}</p>
            <p>
              • Mã đơn giả lập:{' '}
              <strong className='font-mono text-foreground'>{pingResult.code}</strong> (đã kích hoạt
              trạng thái PAID trong bảng đơn hàng)
            </p>
            <p>
              • Thời gian phản hồi:{' '}
              <span className='font-mono text-foreground'>
                {new Date(pingResult.time).toLocaleString('vi-VN')}
              </span>
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
