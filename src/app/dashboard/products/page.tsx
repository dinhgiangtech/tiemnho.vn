import PageContainer from '@/components/layout/page-container';
import { ProductsManagementView } from '@/features/tiemnho/components/products/products-management-view';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Quản lý Sản phẩm | Tiệm Nhỏ'
};

export default function ProductsPage() {
  return (
    <PageContainer
      pageTitle='Quản lý Sản phẩm & Storefront'
      pageDescription='Kéo thả sắp xếp thứ tự hiển thị, bật/tắt bán hàng và xem trước thời gian thực trên khung giả lập điện thoại.'
    >
      <ProductsManagementView />
    </PageContainer>
  );
}
