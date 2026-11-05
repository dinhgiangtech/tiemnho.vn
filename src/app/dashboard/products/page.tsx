import PageContainer from '@/components/layout/page-container';
import { ProductsManagementView } from '@/features/tiemnho/components/products/products-management-view';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tiệm của bạn | Tiệm Nhỏ'
};

export default function ProductsPage() {
  return (
    <PageContainer>
      <ProductsManagementView />
    </PageContainer>
  );
}
