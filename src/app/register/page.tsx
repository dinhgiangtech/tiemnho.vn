import { Metadata } from 'next';
import { StanStoreRegisterForm } from '@/features/auth/components/stan-store-register-form';

export const metadata: Metadata = {
  title: 'Khởi tạo Tiệm Nhỏ | Đăng ký',
  description: 'Khởi tạo Tiệm Nhỏ để bắt đầu bán tài nguyên số và nhận tiền tự động.'
};

export default function RegisterPage() {
  return <StanStoreRegisterForm />;
}
