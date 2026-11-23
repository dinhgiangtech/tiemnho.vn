import KBar from '@/components/kbar';
import AdminSidebar from '@/components/layout/admin-sidebar';
import Header from '@/components/layout/header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';

export const metadata: Metadata = {
  title: 'Super Admin | Tiệm Nhỏ',
  description: 'Quản trị hệ thống sàn thương mại điện tử Tiệm Nhỏ',
  robots: {
    index: false,
    follow: false
  }
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  // Bắt buộc phải đăng nhập và có role ADMIN
  if (!user) {
    redirect('/login');
  }

  if (user.role !== 'ADMIN') {
    // Không có quyền Super Admin -> Chuyển về Dashboard của Creator
    redirect('/dashboard/overview');
  }

  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get('sidebar_state')?.value === 'true';

  return (
    <KBar>
      <SidebarProvider defaultOpen={defaultOpen}>
        <AdminSidebar />
        <SidebarInset id='main-content' tabIndex={-1} className='scroll-mt-16'>
          <Header />
          <div className='flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto'>{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </KBar>
  );
}
