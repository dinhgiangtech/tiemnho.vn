import { Metadata } from 'next';
import SignInViewPage from '@/features/auth/components/sign-in-view';

export const metadata: Metadata = {
  title: 'Đăng nhập | Tiệm Nhỏ',
  description: 'Mở tiệm và nhận thanh toán tự động qua VietQR chỉ trong 2 phút.'
};

export default function SignInPage() {
  return <SignInViewPage />;
}
