import { Metadata } from 'next';
import { StanStoreLoginForm } from '@/features/auth/components/stan-store-login-form';

export const metadata: Metadata = {
  title: 'Đăng nhập | Tiệm Nhỏ',
  description: 'Đăng nhập vào Tiệm Nhỏ của bạn.'
};

export default function LoginPage() {
  return <StanStoreLoginForm />;
}
