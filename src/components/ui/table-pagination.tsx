import * as React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
}

export function TablePagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50]
}: TablePaginationProps) {
  if (totalItems === 0) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className='flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t bg-muted/20 text-xs text-muted-foreground'>
      <div className='flex items-center gap-2'>
        <span>
          Hiển thị <strong className='text-foreground font-semibold'>{startItem}</strong> -{' '}
          <strong className='text-foreground font-semibold'>{endItem}</strong> trên tổng{' '}
          <strong className='text-foreground font-semibold'>{totalItems}</strong> mục
        </span>

        {onPageSizeChange && (
          <div className='flex items-center gap-1.5 ml-4'>
            <span>Số dòng:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className='h-7 rounded-md border border-input bg-background px-2 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-ring'
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className='flex items-center gap-1'>
        <span className='mr-2 font-medium'>
          Trang <strong className='text-foreground'>{currentPage}</strong> / {totalPages || 1}
        </span>

        <Button
          variant='outline'
          size='icon'
          className='h-7 w-7 rounded-md'
          onClick={() => onPageChange(1)}
          disabled={currentPage <= 1}
          title='Trang đầu'
        >
          <ChevronsLeft className='h-3.5 w-3.5' />
        </Button>

        <Button
          variant='outline'
          size='icon'
          className='h-7 w-7 rounded-md'
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          title='Trang trước'
        >
          <ChevronLeft className='h-3.5 w-3.5' />
        </Button>

        <Button
          variant='outline'
          size='icon'
          className='h-7 w-7 rounded-md'
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          title='Trang sau'
        >
          <ChevronRight className='h-3.5 w-3.5' />
        </Button>

        <Button
          variant='outline'
          size='icon'
          className='h-7 w-7 rounded-md'
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage >= totalPages}
          title='Trang cuối'
        >
          <ChevronsRight className='h-3.5 w-3.5' />
        </Button>
      </div>
    </div>
  );
}
