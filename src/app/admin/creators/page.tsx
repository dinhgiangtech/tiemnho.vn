import { getAdminCreators } from '@/features/admin/api/admin.service';
import { AdminCreatorsView } from '@/features/admin/components/admin-creators-view';

export const metadata = {
  title: 'Quản lý Creators | Super Admin'
};

export default async function AdminCreatorsPage() {
  const creators = await getAdminCreators();

  return <AdminCreatorsView initialCreators={creators} />;
}
