'use client';

import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className='absolute top-1/2 left-1/2 mb-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center text-center'>
      <span className='from-foreground bg-linear-to-b to-transparent bg-clip-text text-[10rem] leading-none font-extrabold text-transparent'>
        404
      </span>
      <h2 className='font-heading my-2 text-2xl font-bold'>Trang không tồn tại</h2>
      <p className='text-sm text-muted-foreground max-w-sm mx-auto'>
        Rất tiếc, trang bạn đang tìm kiếm không tồn tại hoặc đã được chuyển sang địa chỉ khác.
      </p>
      <div className='mt-8 flex justify-center gap-2'>
        <Button onClick={() => router.back()} variant='default' size='lg' className='rounded-xl'>
          Quay lại
        </Button>
        <Button onClick={() => router.push('/')} variant='ghost' size='lg' className='rounded-xl'>
          Về trang chủ
        </Button>
      </div>
    </div>
  );
}
