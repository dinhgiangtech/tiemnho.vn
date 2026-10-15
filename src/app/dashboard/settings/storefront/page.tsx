import PageContainer from '@/components/layout/page-container';
import { StorefrontSettingsView } from '@/features/tiemnho/components/settings/storefront-settings-view';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hồ sơ Storefront | Tiệm Nhỏ'
};

export default function StorefrontSettingsPage() {
  return (
    <PageContainer
      pageTitle='Tùy chỉnh Hồ sơ Bio Storefront'
      pageDescription='Chỉnh sửa thông tin cá nhân, username (@slug), tiểu sử và liên kết mạng xã hội với khung xem trước điện thoại cập nhật thời gian thực.'
    >
      <StorefrontSettingsView />
    </PageContainer>
  );
}
