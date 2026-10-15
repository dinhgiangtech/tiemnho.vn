import PageContainer from '@/components/layout/page-container';
import { LeadsTable } from '@/features/tiemnho/components/leads/leads-table';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Khách hàng & Leads | Tiệm Nhỏ'
};

export default function LeadsPage() {
  return (
    <PageContainer
      pageTitle='Khách hàng & Danh bạ Leads'
      pageDescription='Danh sách thông tin liên hệ thu thập tự động từ quà tặng 0đ (Lead Magnet) và đơn hàng. Dễ dàng xuất CSV để gửi email marketing.'
    >
      <LeadsTable />
    </PageContainer>
  );
}
