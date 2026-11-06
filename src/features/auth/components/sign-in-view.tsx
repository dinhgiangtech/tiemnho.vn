import { Metadata } from 'next';
import { StanStoreLoginForm } from './stan-store-login-form';

export const metadata: Metadata = {
  title: 'Đăng nhập | Tiệm Nhỏ',
  description: 'Đăng nhập vào Tiệm Nhỏ của bạn.'
};

export default function SignInViewPage() {
  return (
    <div className='min-h-screen w-full flex flex-col justify-center items-center py-8 px-4'>
      <StanStoreLoginForm />
    </div>
  );
}
