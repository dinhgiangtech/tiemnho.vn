import { Metadata } from 'next';
import SignUpViewPage from '@/features/auth/components/sign-up-view';

export const metadata: Metadata = {
  title: 'Đăng ký mở tiệm | Tiệm Nhỏ',
  description: 'Mở tiệm và nhận thanh toán tự động qua VietQR chỉ trong 2 phút.'
};

export default function SignUpPage() {
  return <SignUpViewPage />;
}
