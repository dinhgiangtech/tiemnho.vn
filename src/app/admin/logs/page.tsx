import { getPaymentLogs } from '@/features/tiemnho/api/services/payment-log.service';
import { AdminLogsView } from '@/features/admin/components/admin-logs-view';

export const metadata = {
  title: 'Nhật ký & Đối soát giao dịch | Super Admin'
};

export default async function AdminLogsPage() {
  const logs = await getPaymentLogs({ limit: 200 });

  return <AdminLogsView initialLogs={logs} />;
}
