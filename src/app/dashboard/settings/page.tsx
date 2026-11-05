import PageContainer from '@/components/layout/page-container';
import { PaymentSettingsView } from '@/features/tiemnho/components/settings/payment-settings-view';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nhận tiền QR | Tiệm Nhỏ'
};

export default function SettingsPaymentPage() {
  return (
    <PageContainer>
      <PaymentSettingsView />
    </PageContainer>
  );
}
