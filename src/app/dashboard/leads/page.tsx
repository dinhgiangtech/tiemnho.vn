import PageContainer from '@/components/layout/page-container';
import { LeadsTable } from '@/features/tiemnho/components/leads/leads-table';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Danh bạ khách | Tiệm Nhỏ'
};

export default function LeadsPage() {
  return (
    <PageContainer
      pageTitle='Danh bạ khách'
      pageDescription='Danh sách thông tin liên hệ thu thập tự động từ quà tặng 0đ và đơn hàng. Dễ dàng xuất CSV để gửi email marketing và chăm sóc khách hàng.'
    >
      <LeadsTable />
    </PageContainer>
  );
}
