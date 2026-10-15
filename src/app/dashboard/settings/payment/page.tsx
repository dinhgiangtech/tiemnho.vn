import PageContainer from '@/components/layout/page-container';
import { PaymentSettingsView } from '@/features/tiemnho/components/settings/payment-settings-view';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cài đặt Thanh toán VietQR | Tiệm Nhỏ'
};

export default function PaymentSettingsPage() {
  return (
    <PageContainer
      pageTitle='Cài đặt Thanh toán VietQR'
      pageDescription='Cấu hình số tài khoản ngân hàng chính chủ để tiền về thẳng tài khoản Creator (0% hoa hồng, No Escrow) và kết nối Webhook payOS/SePay.'
    >
      <PaymentSettingsView />
    </PageContainer>
  );
}
