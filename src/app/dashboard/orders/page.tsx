import PageContainer from '@/components/layout/page-container';
import { OrdersTable } from '@/features/tiemnho/components/orders/orders-table';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Doanh thu & Đơn hàng | Tiệm Nhỏ'
};

export default function OrdersPage() {
  return (
    <PageContainer>
      <OrdersTable />
    </PageContainer>
  );
}
