import PageContainer from '@/components/layout/page-container';
import { LeadsTable } from '@/features/tiemnho/components/leads/leads-table';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Khách hàng | Tiệm Nhỏ'
};

export default function CustomersPage() {
  return (
    <PageContainer>
      <LeadsTable />
    </PageContainer>
  );
}
