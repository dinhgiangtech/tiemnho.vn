import PageContainer from '@/components/layout/page-container';
import { ProductsTable } from '@/features/tiemnho/components/products/products-table';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Quản lý Sản phẩm | Tiệm Nhỏ'
};

export default function ProductsPage() {
  return (
    <PageContainer
      pageTitle='Quản lý Sản phẩm'
      pageDescription='Đăng bán 4 loại sản phẩm: Tài liệu số (Digital), Quà tặng 0đ (Lead Magnet), Hàng vật lý và Nút chuyển hướng.'
    >
      <ProductsTable />
    </PageContainer>
  );
}
