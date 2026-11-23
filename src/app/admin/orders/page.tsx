import { getAdminOrders } from '@/features/admin/api/admin.service';
import { AdminOrdersView } from '@/features/admin/components/admin-orders-view';

export const metadata = {
  title: 'Giao dịch & Đơn hàng | Super Admin'
};

export default async function AdminOrdersPage() {
  const orders = await getAdminOrders();

  return <AdminOrdersView initialOrders={orders} />;
}
