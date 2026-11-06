'use client';

import * as React from 'react';
import { PaymentConfig, VIETNAMESE_BANKS } from '@/constants/mock-tiemnho';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tiemNhoKeys, paymentConfigQueryOptions } from '../../api/queries';
import { updatePaymentConfig, pingTest } from '../../api/service';
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
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { QrCode, Building2, CheckCircle2, Copy, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export function PaymentSettingsView() {
  const queryClient = useQueryClient();
  const { data: config, isLoading: loading } = useQuery(paymentConfigQueryOptions());

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

  React.useEffect(() => {
    if (config) {
      setBankId(config.bankId);
      setAccountNumber(config.accountNumber);
      setAccountName(config.accountName);
      setProvider(config.provider);
      setApiKey(config.apiKey);
      setChecksumKey(config.checksumKey);
    }
  }, [config]);

  const saveAndTestMutation = useMutation({
    mutationFn: async (payload: Parameters<typeof updatePaymentConfig>[0]) => {
      const updated = await updatePaymentConfig(payload);
      const testRes = await pingTest();
      return { updated, testRes };
    },
    onSuccess: ({ testRes }) => {
      queryClient.invalidateQueries({ queryKey: tiemNhoKeys.paymentConfig() });
      setPingResult({
        success: true,
        message: 'Kết nối tài khoản ngân hàng & Webhook thành công!',
        code: testRes.simulatedOrderCode,
        amount: testRes.amount,
        time: testRes.time
      });
      toast.success('Lưu & Bắn thử giao dịch VietQR thành công! Sẵn sàng nhận tiền 100%.');
    },
    onError: () => {
      toast.error('Không thể lưu hoặc kết nối giao dịch test');
    }
  });

  const saving = saveAndTestMutation.isPending;
  const pinging = saveAndTestMutation.isPending;

  const handleSaveAndTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountNumber.trim()) {
      toast.error('Vui lòng nhập số tài khoản ngân hàng');
      return;
    }
    if (!accountName.trim()) {
      toast.error('Vui lòng nhập tên chủ tài khoản (viết hoa không dấu)');
      return;
    }

    const selectedBank = VIETNAMESE_BANKS.find((b) => b.id === bankId);
    saveAndTestMutation.mutate({
      bankId,
      bankName: selectedBank ? `${selectedBank.name} (${selectedBank.shortName})` : bankId,
      accountNumber: accountNumber.trim(),
      accountName: accountName.trim().toUpperCase(),
      provider,
      apiKey: apiKey.trim(),
      checksumKey: checksumKey.trim() || 'default_checksum'
    });
  };

  const webhookUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/api/webhooks/vietqr`
      : 'https://tiemnho.vn/api/webhooks/vietqr';

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    toast.success('Đã sao chép địa chỉ nhận thông báo (Webhook URL)!');
  };

  if (loading || !config) {
    return (
      <div className='p-8 text-center text-xs text-muted-foreground'>
        <Icons.spinner className='h-5 w-5 animate-spin mx-auto mb-2 text-primary' />
        Đang tải cấu hình nhận tiền VietQR...
      </div>
    );
  }

  const selectedBank = VIETNAMESE_BANKS.find((b) => b.id === bankId);

  return (
    <div className='max-w-4xl space-y-6'>
      {/* Triết lý No Escrow Banner */}
      <div className='rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4.5 flex items-start gap-3.5 shadow-xs'>
        <div className='h-9 w-9 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5'>
          <Icons.check className='h-5 w-5 stroke-[2.5]' />
        </div>
        <div className='space-y-1 text-xs'>
          <div className='flex items-center gap-2'>
            <h4 className='font-bold text-foreground text-sm'>
              Dòng tiền trực tiếp: Không giữ tiền trung gian (No Escrow)
            </h4>
            <Badge
              variant='outline'
              className='bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]'
            >
              0% Phí sàn
            </Badge>
          </div>
          <p className='text-muted-foreground leading-relaxed'>
            Người mua quét mã VietQR thì tiền sẽ chuyển thẳng{' '}
            <strong>100% vào tài khoản ngân hàng chính chủ của bạn</strong>. Tiệm Nhỏ không giữ tiền
            hộ, không trung gian ví tiền và hoàn toàn minh bạch.
          </p>
        </div>
      </div>

      <form onSubmit={handleSaveAndTest} className='space-y-5'>
        {/* ==================================================== */}
        {/* BƯỚC 1: TÀI KHOẢN NHẬN TIỀN (Chuẩn Section 3.4) */}
        {/* ==================================================== */}
        <Card className='border border-border/80 shadow-xs rounded-2xl overflow-hidden'>
          <CardHeader className='pb-3 border-b border-border/60 bg-muted/20'>
            <div className='flex items-center gap-2.5'>
              <div className='h-7 w-7 rounded-xl bg-primary text-primary-foreground font-bold flex items-center justify-center text-xs shadow-xs'>
                1
              </div>
              <div>
                <CardTitle className='text-sm font-bold flex items-center gap-1.5'>
                  <QrCode className='w-4.5 h-4.5 text-primary shrink-0' strokeWidth={1.75} />
                  Bước 1: Cài đặt nhận tiền VietQR (Tài khoản ngân hàng)
                </CardTitle>
                <CardDescription className='text-xs'>
                  Mã VietQR động trên trang Storefront sẽ đổ thẳng tiền vào tài khoản này.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className='space-y-4 text-xs pt-4'>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              {/* Chọn ngân hàng */}
              <div className='space-y-1.5'>
                <label className='font-semibold text-foreground text-xs flex items-center justify-between'>
                  <span>Ngân hàng nhận tiền</span>
                  {selectedBank && (
                    <span className='text-[10px] text-muted-foreground font-mono'>
                      BIN: {selectedBank.bin}
                    </span>
                  )}
                </label>
                <select
                  value={bankId}
                  onChange={(e) => setBankId(e.target.value)}
                  className='w-full h-10 text-xs rounded-xl border border-border bg-background px-3 font-medium cursor-pointer shadow-xs'
                >
                  {VIETNAMESE_BANKS.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.shortName} - {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Số tài khoản */}
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

            {/* Tên chủ tài khoản tự động viết hoa */}
            <div className='space-y-1.5'>
              <label className='font-semibold text-foreground text-xs flex items-center justify-between'>
                <span>Tên chủ tài khoản (Viết hoa không dấu)</span>
                <span className='text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1'>
                  <Icons.check className='h-3 w-3' /> Tự động chuẩn hóa
                </span>
              </label>
              <Input
                value={accountName}
                onChange={(e) => setAccountName(e.target.value.toUpperCase())}
                placeholder='VD: DINH VAN GIANG'
                className='h-10 text-sm font-mono tracking-wide rounded-xl uppercase font-semibold'
                required
              />
              <p className='text-[11px] text-muted-foreground'>
                Cần trùng khớp với tên trên thẻ/tài khoản ngân hàng để mã VietQR hiển thị đúng trên
                app ngân hàng người mua.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* ==================================================== */}
        {/* BƯỚC 2: KẾT NỐI TỰ ĐỘNG HÓA (Chuẩn Section 3.4) */}
        {/* ==================================================== */}
        <Card className='border border-border/80 shadow-xs rounded-2xl overflow-hidden'>
          <CardHeader className='pb-3 border-b border-border/60 bg-muted/20'>
            <div className='flex items-center gap-2.5'>
              <div className='h-7 w-7 rounded-xl bg-primary text-primary-foreground font-bold flex items-center justify-center text-xs shadow-xs'>
                2
              </div>
              <div>
                <CardTitle className='text-sm font-bold'>
                  Bước 2: Kết nối tự động hóa đối soát
                </CardTitle>
                <CardDescription className='text-xs'>
                  Hệ thống tự động kích hoạt trạng thái Đã Thanh Toán khi tài khoản có biến động số
                  dư.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className='space-y-4 text-xs pt-4'>
            {/* Chọn Cổng đối soát */}
            <div className='space-y-1.5'>
              <label className='font-semibold text-foreground text-xs'>
                Dịch vụ đối soát biến động số dư:
              </label>
              <div className='flex gap-3'>
                {(['payOS', 'SePay'] as const).map((p) => (
                  <button
                    key={p}
                    type='button'
                    onClick={() => setProvider(p)}
                    className={`flex-1 p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      provider === p
                        ? 'border-primary bg-primary/5 ring-1.5 ring-primary shadow-xs'
                        : 'border-border hover:border-primary/40 bg-card'
                    }`}
                  >
                    <div className='font-bold text-xs text-foreground flex items-center gap-1.5'>
                      <span>{p}</span>
                      {provider === p && <Icons.check className='h-3.5 w-3.5 text-primary' />}
                    </div>
                    <div className='text-[11px] text-muted-foreground mt-0.5'>
                      {p === 'payOS'
                        ? 'Cổng thanh toán VietQR mã nguồn mở chuẩn NAPAS'
                        : 'Dịch vụ bắt biến động thông báo số dư ngân hàng'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 1 Nút bấm: Sao chép địa chỉ nhận thông báo */}
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
                  className='h-10 px-3.5 text-xs gap-1.5 rounded-xl shrink-0 border-primary/40 text-primary hover:bg-primary/5 font-semibold'
                >
                  <Icons.copy className='h-3.5 w-3.5' />
                  Sao chép địa chỉ nhận thông báo
                </Button>
              </div>
              <p className='text-[11px] text-muted-foreground'>
                Dán URL này vào mục cài đặt Webhook trên trang quản trị {provider} của bạn.
              </p>
            </div>

            {/* 1 Ô dán: Mã kết nối bí mật (API Key) */}
            <div className='space-y-1.5'>
              <label className='font-semibold text-foreground text-xs'>
                Mã kết nối bí mật (API Key từ {provider})
              </label>
              <Input
                type='password'
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder='pos_live_... hoặc mã kết nối API bí mật'
                className='h-10 text-xs font-mono rounded-xl'
              />
              <p className='text-[11px] text-muted-foreground'>
                Mã này được mã hóa an toàn trên hệ thống để đối soát chữ ký điện tử mỗi giao dịch.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* ==================================================== */}
        {/* BƯỚC 3: NÚT LƯU & BẮN THỬ GIAO DỊCH (Sticky Bottom)  */}
        {/* ==================================================== */}
        <div className='sticky bottom-20 md:bottom-4 z-20 flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl border border-neutral-200/90 dark:border-neutral-800 bg-white/95 dark:bg-card/95 backdrop-blur-md shadow-md'>
          <div className='space-y-0.5 text-xs text-left'>
            <div className='font-bold text-foreground text-sm flex items-center gap-1.5'>
              <Icons.sparkles className='h-4 w-4 text-primary' />
              Bước 3: Xác thực kết nối và lưu cấu hình
            </div>
            <div className='text-muted-foreground text-[11px]'>
              Hệ thống sẽ tự động gửi 1 lệnh ping giao dịch ảo để kiểm tra kênh đối soát VietQR ngay
              tức thì.
            </div>
          </div>

          <Button
            type='submit'
            disabled={saving || pinging}
            className='w-full sm:w-auto h-11 px-6 text-xs font-bold rounded-xl gap-2 shadow-md bg-primary hover:bg-primary/90 text-primary-foreground shrink-0 cursor-pointer'
          >
            {saving || pinging ? (
              <>
                <Icons.spinner className='h-4 w-4 animate-spin' />
                Đang kiểm tra kết nối...
              </>
            ) : (
              <>
                <Icons.bolt className='h-4 w-4 text-amber-300' />
                Lưu & Bắn thử giao dịch
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Ping Test Result Tích Xanh Thành Công */}
      {pingResult && (
        <Card className='border border-emerald-500/40 bg-emerald-500/5 shadow-xs rounded-2xl animate-in zoom-in-95 duration-300'>
          <CardHeader className='pb-2'>
            <div className='flex items-center justify-between'>
              <CardTitle className='text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5'>
                <Icons.check className='h-4 w-4 stroke-[3]' />
                {pingResult.message}
              </CardTitle>
              <Badge
                variant='outline'
                className='bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]'
              >
                TÍCH XANH HOẠT ĐỘNG
              </Badge>
            </div>
            <CardDescription className='text-xs text-muted-foreground'>
              Hệ thống đã kết nối thông suốt với máy chủ ngân hàng và webhook tự động.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-2 text-xs'>
            <div className='grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-background/80 border border-emerald-500/20'>
              <div>
                <span className='text-muted-foreground block text-[10px]'>Mã giao dịch test:</span>
                <span className='font-mono font-bold text-foreground text-xs'>
                  {pingResult.code}
                </span>
              </div>
              <div>
                <span className='text-muted-foreground block text-[10px]'>Số tiền đối soát:</span>
                <span className='font-bold text-emerald-600 dark:text-emerald-400 text-xs'>
                  {new Intl.NumberFormat('vi-VN').format(pingResult.amount)} đ
                </span>
              </div>
              <div>
                <span className='text-muted-foreground block text-[10px]'>Thời gian xác thực:</span>
                <span className='text-foreground text-xs'>
                  {new Date(pingResult.time).toLocaleTimeString('vi-VN')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
