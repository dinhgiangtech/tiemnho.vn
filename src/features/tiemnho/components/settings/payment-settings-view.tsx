'use client';

import * as React from 'react';
import { PaymentConfig, VIETNAMESE_BANKS } from '@/constants/mock-tiemnho';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tiemNhoKeys, paymentConfigQueryOptions, profileQueryOptions } from '../../api/queries';
import {
  updatePaymentConfig,
  pingTest,
  generateTelegramLinkToken,
  disconnectTelegram,
  updateTelegramChatId
} from '../../api/service';
import { getAppBaseUrl } from '@/lib/utils';
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
import { Switch } from '@/components/ui/switch';
import { QrCode, Building2, CheckCircle2, Copy, Sparkles, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export function PaymentSettingsView() {
  const queryClient = useQueryClient();
  const { data: config, isLoading: loading } = useQuery(paymentConfigQueryOptions());
  const { data: profile, isLoading: loadingProfile } = useQuery(profileQueryOptions());

  // Form states
  const [bankId, setBankId] = React.useState('MB');
  const [accountNumber, setAccountNumber] = React.useState('');
  const [accountName, setAccountName] = React.useState('');
  const [isPayosEnabled, setIsPayosEnabled] = React.useState(false);
  const [provider, setProvider] = React.useState<'PAYOS' | 'SEPAY' | 'MANUAL_VIETQR'>('PAYOS');
  const [clientId, setClientId] = React.useState('');
  const [apiKey, setApiKey] = React.useState('');
  const [checksumKey, setChecksumKey] = React.useState('');
  const [savingBankOnly, setSavingBankOnly] = React.useState(false);
  const [togglingPayos, setTogglingPayos] = React.useState(false);
  const [savingPayosKeys, setSavingPayosKeys] = React.useState(false);
  const [manualChatId, setManualChatId] = React.useState('');
  const [savingChatId, setSavingChatId] = React.useState(false);
  const [generatingTelegramLink, setGeneratingTelegramLink] = React.useState(false);
  const [disconnectingTelegram, setDisconnectingTelegram] = React.useState(false);
  const [pingResult, setPingResult] = React.useState<{
    success: boolean;
    message: string;
    code: string;
    amount: number;
    time: string;
  } | null>(null);

  React.useEffect(() => {
    if (profile?.telegramChatId) {
      setManualChatId(profile.telegramChatId);
    }
  }, [profile?.telegramChatId]);

  const handleSaveManualChatId = async () => {
    if (!manualChatId.trim()) {
      toast.error('Vui lòng nhập Telegram Chat ID');
      return;
    }
    try {
      setSavingChatId(true);
      await updateTelegramChatId(manualChatId.trim());
      await queryClient.invalidateQueries({ queryKey: tiemNhoKeys.profile() });
      toast.success('Đã lưu Telegram Chat ID thành công! Hãy kiểm tra tin nhắn bot.');
    } catch (err: any) {
      toast.error(err?.message || 'Không thể lưu Telegram Chat ID');
    } finally {
      setSavingChatId(false);
    }
  };

  React.useEffect(() => {
    if (config) {
      setBankId(config.bankId || 'MB');
      setAccountNumber(config.bankAccountNumber || config.accountNumber || '');
      setAccountName(config.bankAccountName || config.accountName || '');
      if (config.isPayosEnabled !== undefined) {
        setIsPayosEnabled(Boolean(config.isPayosEnabled));
      }
      const rawProv = (config.provider as string)?.toUpperCase();
      if (rawProv === 'SEPAY') setProvider('SEPAY');
      else if (rawProv === 'MANUAL_VIETQR') setProvider('MANUAL_VIETQR');
      else setProvider('PAYOS');
      setClientId(config.clientId || '');
      setApiKey(config.apiKey || '');
      setChecksumKey(config.checksumKey || '');
    }
  }, [config?.id]);

  // Lưu thông tin thẻ 1: Tài khoản ngân hàng
  const handleSaveBankAccount = async () => {
    if (!accountNumber.trim()) {
      toast.error('Vui lòng nhập số tài khoản ngân hàng');
      return;
    }
    if (!accountName.trim()) {
      toast.error('Vui lòng nhập tên chủ tài khoản (viết hoa không dấu)');
      return;
    }

    try {
      setSavingBankOnly(true);
      const selectedBank = VIETNAMESE_BANKS.find((b) => b.id === bankId);
      await updatePaymentConfig({
        bankId,
        bankName: selectedBank ? `${selectedBank.name} (${selectedBank.shortName})` : bankId,
        bankBin: selectedBank?.bin || '970422',
        bankAccountNumber: accountNumber.trim(),
        bankAccountName: accountName.trim().toUpperCase(),
        accountNumber: accountNumber.trim(),
        accountName: accountName.trim().toUpperCase()
      });
      await queryClient.invalidateQueries({ queryKey: tiemNhoKeys.paymentConfig() });
      toast.success('Đã lưu tài khoản ngân hàng nhận tiền thành công!');
    } catch (err: any) {
      toast.error(err?.message || 'Không thể lưu tài khoản ngân hàng');
    } finally {
      setSavingBankOnly(false);
    }
  };

  // Bật / Tắt công tắc payOS
  const handleTogglePayos = async (checked: boolean) => {
    setIsPayosEnabled(checked);
    try {
      setTogglingPayos(true);
      const updated = await updatePaymentConfig({
        isPayosEnabled: checked
      });
      queryClient.setQueryData(tiemNhoKeys.paymentConfig(), updated);

      if (checked) {
        toast.success('Đã bật chế độ tự động duyệt đơn 24/7 qua payOS.');
      } else {
        toast.info('Đã chuyển sang chế độ duyệt đơn 1-chạm qua Telegram.');
      }
    } catch (err: any) {
      setIsPayosEnabled(!checked);
      toast.error('Không thể thay đổi trạng thái payOS: ' + (err?.message || 'Có lỗi xảy ra'));
    } finally {
      setTogglingPayos(false);
    }
  };

  // Lưu riêng bộ key payOS và kiểm tra kết nối
  const handleSavePayosKeys = async () => {
    if (!clientId.trim() || !apiKey.trim() || !checksumKey.trim()) {
      toast.error('Vui lòng nhập đầy đủ Client ID, API Key và Checksum Key');
      return;
    }

    try {
      setSavingPayosKeys(true);
      await updatePaymentConfig({
        clientId: clientId.trim(),
        apiKey: apiKey.trim(),
        checksumKey: checksumKey.trim(),
        isPayosEnabled: true
      });
      const testRes = await pingTest();
      await queryClient.invalidateQueries({ queryKey: tiemNhoKeys.paymentConfig() });
      setPingResult({
        success: true,
        message: 'Kết nối tài khoản ngân hàng & Webhook thành công!',
        code: testRes.simulatedOrderCode,
        amount: testRes.amount,
        time: testRes.time
      });
      toast.success('Đã lưu và xác thực kết nối payOS thành công!');
    } catch (err: any) {
      toast.error('Lỗi khi lưu key payOS hoặc kiểm tra kết nối');
    } finally {
      setSavingPayosKeys(false);
    }
  };

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
      toast.success('Lưu cấu hình thanh toán thành công!');
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
      bankBin: selectedBank?.bin || '970422',
      bankAccountNumber: accountNumber.trim(),
      bankAccountName: accountName.trim().toUpperCase(),
      accountNumber: accountNumber.trim(),
      accountName: accountName.trim().toUpperCase(),
      clientId: clientId.trim(),
      provider: provider as any,
      apiKey: apiKey.trim(),
      checksumKey: checksumKey.trim() || 'default_checksum'
    });
  };

  const handleConnectTelegram = async () => {
    try {
      setGeneratingTelegramLink(true);
      const res = await generateTelegramLinkToken();
      if (res?.link) {
        toast.info('Đang chuyển hướng sang Telegram Bot...');
        window.open(res.link, '_blank');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Không thể tạo liên kết kết nối Telegram');
    } finally {
      setGeneratingTelegramLink(false);
    }
  };

  const handleDisconnectTelegram = async () => {
    if (!confirm('Bạn có chắc muốn hủy kết nối Telegram nhận đơn hàng không?')) return;
    try {
      setDisconnectingTelegram(true);
      await disconnectTelegram();
      await queryClient.invalidateQueries({ queryKey: tiemNhoKeys.profile() });
      toast.success('Đã hủy kết nối Telegram');
    } catch (err: any) {
      toast.error('Lỗi khi hủy kết nối Telegram');
    } finally {
      setDisconnectingTelegram(false);
    }
  };

  const webhookUrl = `${getAppBaseUrl()}/api/webhooks/payos`;

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

      {/* THẺ LIÊN KẾT TELEGRAM BOT THÔNG BÁO ĐƠN & DUYỆT 1-CHẠM */}
      <Card className='border border-sky-500/30 bg-sky-500/5 shadow-xs rounded-2xl overflow-hidden'>
        <CardHeader className='pb-3 border-b border-sky-500/20 bg-sky-500/10'>
          <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
            <div className='flex items-center gap-2.5'>
              <div className='h-8 w-8 rounded-xl bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold text-xs'>
                <Icons.send className='h-4 w-4' />
              </div>
              <div>
                <CardTitle className='text-sm font-bold text-foreground flex items-center gap-2'>
                  Thông báo đơn hàng qua Telegram
                  {profile?.telegramChatId ? (
                    <Badge className='bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] gap-1'>
                      <CheckCircle2 className='h-3 w-3' /> Đã kết nối
                    </Badge>
                  ) : (
                    <Badge
                      variant='outline'
                      className='text-[10px] border-amber-500/40 text-amber-600 bg-amber-500/10'
                    >
                      Chưa kết nối
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className='text-xs text-muted-foreground mt-0.5'>
                  Nhận tin nhắn tức thì khi có khách mua hàng hoặc duyệt đơn VietQR thủ công 1-chạm
                </CardDescription>
              </div>
            </div>

            <div>
              {profile?.telegramChatId ? (
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  disabled={disconnectingTelegram}
                  onClick={handleDisconnectTelegram}
                  className='h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30'
                >
                  {disconnectingTelegram ? (
                    <Icons.spinner className='h-3.5 w-3.5 animate-spin mr-1' />
                  ) : (
                    <Icons.trash className='h-3.5 w-3.5 mr-1' />
                  )}
                  Hủy kết nối Telegram
                </Button>
              ) : (
                <Button
                  type='button'
                  size='sm'
                  disabled={generatingTelegramLink}
                  onClick={handleConnectTelegram}
                  className='h-8 text-xs bg-sky-600 hover:bg-sky-700 text-white gap-1.5 shadow-xs font-semibold'
                >
                  {generatingTelegramLink ? (
                    <Icons.spinner className='h-3.5 w-3.5 animate-spin' />
                  ) : (
                    <Icons.send className='h-3.5 w-3.5' />
                  )}
                  Kết nối Telegram 1-chạm
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className='pt-3.5 pb-4 text-xs text-muted-foreground leading-relaxed space-y-3.5'>
          {profile?.telegramChatId ? (
            <div className='flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium'>
              <CheckCircle2 className='h-4 w-4 shrink-0' />
              <span>
                Tài khoản Telegram của bạn đã liên kết thành công (Chat ID:{' '}
                <code className='font-mono font-bold'>{profile.telegramChatId}</code>). Mỗi khi có
                khách chuyển khoản hoặc đơn mới, bot{' '}
                <strong>
                  @{process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'tiemnho_order_bot'}
                </strong>{' '}
                sẽ gửi tin nhắn kèm nút duyệt đơn ngay trên điện thoại của bạn.
              </span>
            </div>
          ) : (
            <div className='space-y-3'>
              <div className='p-3 rounded-xl bg-background/80 border border-sky-500/20'>
                <div className='font-semibold text-foreground mb-1'>
                  Cách 1: Kết nối tự động 1-chạm (Khuyên dùng)
                </div>
                <p>
                  Bấm nút <strong>"Kết nối Telegram 1-chạm"</strong> phía trên, hệ thống sẽ mở ứng
                  dụng Telegram với bot{' '}
                  <strong>
                    @{process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'tiemnho_order_bot'}
                  </strong>
                  . Bạn chỉ cần bấm <strong>Start</strong> để bot tự nhận diện!
                </p>
              </div>

              <div className='p-3 rounded-xl bg-background/80 border border-border/80'>
                <div className='font-semibold text-foreground mb-1'>
                  Cách 2: Tự nhập Telegram Chat ID (Nếu chạy local chưa có Webhook)
                </div>
                <p className='mb-2 text-[11px]'>
                  Mở Telegram nhắn tin cho bot{' '}
                  <a
                    href='https://t.me/userinfobot'
                    target='_blank'
                    rel='noreferrer'
                    className='text-sky-600 underline font-medium'
                  >
                    @userinfobot
                  </a>{' '}
                  để lấy số <strong>Id</strong> của bạn, sau đó dán vào đây:
                </p>
                <div className='flex gap-2 max-w-sm'>
                  <Input
                    placeholder='Ví dụ: 123456789'
                    value={manualChatId}
                    onChange={(e) => setManualChatId(e.target.value)}
                    className='h-8.5 text-xs'
                  />
                  <Button
                    type='button'
                    size='sm'
                    disabled={savingChatId}
                    onClick={handleSaveManualChatId}
                    className='h-8.5 text-xs shrink-0 bg-primary'
                  >
                    {savingChatId ? <Icons.spinner className='h-3 w-3 animate-spin mr-1' /> : null}
                    Lưu Chat ID
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className='space-y-6'>
        {/* ==================================================== */}
        {/* THẺ 1: TÀI KHOẢN NHẬN TIỀN (LUÔN HOẠT ĐỘNG & BẮT BUỘC) */}
        {/* ==================================================== */}
        <Card className='border border-border/80 shadow-xs rounded-2xl overflow-hidden'>
          <CardHeader className='pb-3 border-b border-border/60 bg-muted/20'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2.5'>
                <div className='h-8 w-8 rounded-xl bg-primary text-primary-foreground font-bold flex items-center justify-center text-xs shadow-xs'>
                  1
                </div>
                <div>
                  <CardTitle className='text-sm font-bold flex items-center gap-2'>
                    <Building2 className='w-4.5 h-4.5 text-primary shrink-0' />
                    Tài khoản ngân hàng nhận tiền
                    <Badge className='bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] gap-1'>
                      <CheckCircle2 className='h-3 w-3' /> Đang hoạt động
                    </Badge>
                  </CardTitle>
                  <CardDescription className='text-xs'>
                    Mã VietQR sẽ đổ tiền thẳng 100% vào tài khoản này (Không qua trung gian).
                  </CardDescription>
                </div>
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
                Tiền khách quét VietQR sẽ chuyển thẳng 100% về tài khoản này. Cần trùng khớp với tên
                trên thẻ/tài khoản ngân hàng.
              </p>
            </div>

            <div className='pt-2 flex justify-end'>
              <Button
                type='button'
                disabled={savingBankOnly}
                onClick={handleSaveBankAccount}
                className='h-9 px-4 text-xs font-semibold rounded-xl gap-1.5 bg-primary'
              >
                {savingBankOnly ? (
                  <Icons.spinner className='h-3.5 w-3.5 animate-spin' />
                ) : (
                  <Icons.check className='h-3.5 w-3.5' />
                )}
                Lưu tài khoản ngân hàng
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ==================================================== */}
        {/* THẺ 2: TỰ ĐỘNG DUYỆT ĐƠN 24/7 QUA PAYOS (TÙY CHỌN NÂNG CAO) */}
        {/* ==================================================== */}
        <Card className='border border-border/80 shadow-xs rounded-2xl overflow-hidden'>
          <CardHeader className='pb-3 border-b border-border/60 bg-muted/20'>
            <div className='flex items-center justify-between gap-4'>
              <div className='flex items-center gap-2.5'>
                <div className='h-8 w-8 rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center text-xs shadow-xs'>
                  2
                </div>
                <div>
                  <CardTitle className='text-sm font-bold flex items-center gap-2'>
                    Tự động duyệt đơn 24/7 qua payOS
                    {isPayosEnabled ? (
                      <Badge className='bg-primary text-primary-foreground text-[10px]'>
                        Tự động bật
                      </Badge>
                    ) : (
                      <Badge variant='outline' className='text-[10px] text-muted-foreground'>
                        Đang tắt
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className='text-xs'>
                    Hỗ trợ tự động 100% với MBBank, BIDV, VietinBank, ACB qua payOS.
                  </CardDescription>
                </div>
              </div>

              {/* Nút gạt Switch Toggle Bật/Tắt */}
              <div className='flex items-center gap-2 shrink-0'>
                <span className='text-xs font-medium text-muted-foreground hidden sm:inline'>
                  {isPayosEnabled ? 'Bật tự động' : 'Tắt'}
                </span>
                <Switch
                  checked={isPayosEnabled}
                  disabled={togglingPayos}
                  onCheckedChange={handleTogglePayos}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className='pt-4 text-xs space-y-4'>
            {/* Trạng thái khi tắt công tắc payOS */}
            {!isPayosEnabled ? (
              <div className='p-3.5 rounded-xl border border-sky-500/30 bg-sky-500/5 text-sky-700 dark:text-sky-300 flex items-start gap-2.5 leading-relaxed'>
                <AlertCircle className='h-4 w-4 shrink-0 mt-0.5 text-sky-600 dark:text-sky-400' />
                <div>
                  <span className='font-semibold'>
                    Đang dùng chế độ VietQR tiêu chuẩn (Hỗ trợ tất cả ngân hàng).
                  </span>{' '}
                  Khi có đơn mới, hệ thống sẽ gửi thông báo tức thì về Telegram và Dashboard để bạn
                  kiểm tra tài khoản và duyệt đơn 1-chạm.
                </div>
              </div>
            ) : (
              /* Trạng thái khi bật công tắc payOS */
              <div className='space-y-4 animate-in fade-in-50 duration-200'>
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
                      className='h-10 px-3.5 text-xs gap-1.5 rounded-xl shrink-0 border-primary/40 text-primary hover:bg-primary/5 font-semibold cursor-pointer'
                    >
                      <Icons.copy className='h-3.5 w-3.5' />
                      Sao chép Webhook URL
                    </Button>
                  </div>
                  <p className='text-[11px] text-muted-foreground'>
                    Dán URL này vào mục Webhook trên Dashboard của payOS để nhận xác nhận thanh toán
                    tức thì.
                  </p>
                </div>

                {/* Bộ 3 khóa API của payOS */}
                <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
                  <div className='space-y-1.5'>
                    <label className='font-semibold text-foreground text-xs'>
                      Client ID (payOS) <span className='text-primary'>*</span>
                    </label>
                    <Input
                      type='text'
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      placeholder='Client ID từ payOS'
                      className='h-10 text-xs font-mono rounded-xl'
                    />
                  </div>

                  <div className='space-y-1.5'>
                    <label className='font-semibold text-foreground text-xs'>
                      API Key (payOS) <span className='text-primary'>*</span>
                    </label>
                    <Input
                      type='password'
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder='API Key bí mật'
                      className='h-10 text-xs font-mono rounded-xl'
                    />
                  </div>

                  <div className='space-y-1.5'>
                    <label className='font-semibold text-foreground text-xs'>
                      Checksum Key (payOS) <span className='text-primary'>*</span>
                    </label>
                    <Input
                      type='password'
                      value={checksumKey}
                      onChange={(e) => setChecksumKey(e.target.value)}
                      placeholder='Checksum Key'
                      className='h-10 text-xs font-mono rounded-xl'
                    />
                  </div>
                </div>

                <div className='flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-border/60'>
                  <p className='text-[11px] text-muted-foreground'>
                    Bộ 3 khóa này được lưu trữ an toàn trong CSDL để tạo link VietQR động và xác
                    thực chữ ký Webhook.
                  </p>

                  <Button
                    type='button'
                    disabled={savingPayosKeys}
                    onClick={handleSavePayosKeys}
                    className='w-full sm:w-auto h-9 px-4 text-xs font-semibold rounded-xl gap-1.5 bg-primary shrink-0'
                  >
                    {savingPayosKeys ? (
                      <>
                        <Icons.spinner className='h-3.5 w-3.5 animate-spin' />
                        Đang xác thực...
                      </>
                    ) : (
                      <>
                        <Icons.bolt className='h-3.5 w-3.5 text-amber-300' />
                        Lưu & Xác thực payOS
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
