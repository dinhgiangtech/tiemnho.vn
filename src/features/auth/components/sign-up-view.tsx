import { Metadata } from 'next';
import { StanStoreRegisterForm } from './stan-store-register-form';

export const metadata: Metadata = {
  title: 'Khởi tạo Tiệm Nhỏ | Đăng ký',
  description: "Let's monetize your following!"
};

export default function SignUpViewPage() {
  return (
    <div className='min-h-screen w-full flex flex-col justify-center items-center py-8 px-4'>
      <StanStoreRegisterForm />
    </div>
  );
}
