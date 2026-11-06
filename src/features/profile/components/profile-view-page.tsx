import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ProfileViewPage() {
  return (
    <div className='flex w-full flex-col p-6 max-w-xl mx-auto space-y-4'>
      <h1 className='text-2xl font-bold'>Thông tin Tiệm của bạn</h1>
      <p className='text-muted-foreground text-sm'>
        Quản lý giao diện, thông tin cửa hàng và liên kết mạng xã hội của bạn.
      </p>
      <Link href='/dashboard/settings/storefront'>
        <Button className='rounded-xl font-semibold'>Đi tới Cài đặt Tiệm →</Button>
      </Link>
    </div>
  );
}
