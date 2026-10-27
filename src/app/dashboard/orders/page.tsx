import PageContainer from '@/components/layout/page-container';
import { OrdersTable } from '@/features/tiemnho/components/orders/orders-table';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Doanh thu & Đơn hàng | Tiệm Nhỏ'
};

export default function OrdersPage() {
  return (
    <PageContainer
      pageTitle='Doanh thu & Đơn hàng'
      pageDescription='Theo dõi các giao dịch quét mã VietQR tự động, quản lý trạng thái đơn hàng và xuất file Excel / CSV gửi bưu cục.'
    >
      <OrdersTable />
    </PageContainer>
  );
}
