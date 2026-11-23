import { getAdminProducts } from '@/features/admin/api/admin.service';
import { AdminProductsView } from '@/features/admin/components/admin-products-view';

export const metadata = {
  title: 'Kiểm duyệt Sản phẩm | Super Admin'
};

export default async function AdminProductsPage() {
  const products = await getAdminProducts();

  return <AdminProductsView initialProducts={products} />;
}
