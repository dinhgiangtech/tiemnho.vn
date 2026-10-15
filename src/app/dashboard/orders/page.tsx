import PageContainer from '@/components/layout/page-container';
import { OrdersTable } from '@/features/tiemnho/components/orders/orders-table';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Quản lý Đơn hàng | Tiệm Nhỏ'
};

export default function OrdersPage() {
  return (
    <PageContainer
      pageTitle='Quản lý Đơn hàng'
      pageDescription='Theo dõi các giao dịch quét mã VietQR tự động, quản lý trạng thái đơn hàng và xuất file Excel / CSV gửi bưu cục.'
    >
      <OrdersTable />
    </PageContainer>
  );
}
