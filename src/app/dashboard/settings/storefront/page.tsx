import PageContainer from '@/components/layout/page-container';
import { StorefrontSettingsView } from '@/features/tiemnho/components/settings/storefront-settings-view';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Thiết kế tiệm | Tiệm Nhỏ'
};

export default function StorefrontSettingsPage() {
  return (
    <PageContainer>
      <StorefrontSettingsView />
    </PageContainer>
  );
}
