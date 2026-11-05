import PageContainer from '@/components/layout/page-container';
import { CreateProductView } from '@/features/tiemnho/components/products/create-product-view';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tạo sản phẩm mới | Tiệm Nhỏ'
};

export default function CreateProductPage() {
  return (
    <PageContainer>
      <CreateProductView />
    </PageContainer>
  );
}
