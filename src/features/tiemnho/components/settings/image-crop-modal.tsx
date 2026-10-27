'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Icons } from '@/components/icons';

interface ImageCropModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string | null;
  onConfirmCrop: (croppedFile: File) => Promise<void> | void;
}

export function ImageCropModal({
  open,
  onOpenChange,
  imageUrl,
  onConfirmCrop
}: ImageCropModalProps) {
  const [zoom, setZoom] = React.useState<number>(1);
  const [position, setPosition] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [saving, setSaving] = React.useState(false);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const imageRef = React.useRef<HTMLImageElement>(null);

  // Reset state mỗi khi mở ảnh mới
  React.useEffect(() => {
    if (open) {
      setZoom(1);
      setPosition({ x: 0, y: 0 });
      setSaving(false);
    }
  }, [open, imageUrl]);

  // Xử lý kéo thả ảnh (Drag / Pan)
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Hỗ trợ Touch trên điện thoại/màn hình cảm ứng
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setPosition({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Cắt ảnh bằng HTML5 Canvas và xuất ra file WebP/PNG
  const handleCropAndSave = async () => {
    if (!imageUrl || !imageRef.current) return;
    setSaving(true);

    try {
      const cropSize = 400; // Độ phân giải đầu ra 400x400 tiêu chuẩn
      const canvas = document.createElement('canvas');
      canvas.width = cropSize;
      canvas.height = cropSize;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Canvas 2D context không khả dụng');
      }

      const img = imageRef.current;
      const containerSize = 256; // Kích thước khung tròn hiển thị (256x256)
      const scale = zoom;

      // Tính toán tỉ lệ giữa ảnh gốc và khung hiển thị
      const renderedWidth = img.naturalWidth * (containerSize / img.naturalHeight) * scale;
      const renderedHeight = containerSize * scale;

      // Vẽ nền trắng bo tròn
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, cropSize, cropSize);

      ctx.save();
      // Mask hình tròn (Circular Clip)
      ctx.beginPath();
      ctx.arc(cropSize / 2, cropSize / 2, cropSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      // Tính toạ độ vẽ vào canvas theo tỉ lệ
      const ratio = cropSize / containerSize;
      const drawX = (containerSize / 2 + position.x - renderedWidth / 2) * ratio;
      const drawY = (containerSize / 2 + position.y - renderedHeight / 2) * ratio;
      const drawW = renderedWidth * ratio;
      const drawH = renderedHeight * ratio;

      ctx.drawImage(img, drawX, drawY, drawW, drawH);
      ctx.restore();

      // Xuất file ảnh dưới dạng Blob
      canvas.toBlob(async (blob) => {
        if (!blob) {
          setSaving(false);
          return;
        }
        const croppedFile = new File([blob], `avatar-${Date.now()}.png`, {
          type: 'image/png'
        });

        await onConfirmCrop(croppedFile);
        setSaving(false);
        onOpenChange(false);
      }, 'image/png');
    } catch {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md p-6 rounded-2xl'>
        <DialogHeader className='text-left pb-2'>
          <DialogTitle className='text-base font-bold text-foreground'>
            Chỉnh sửa & Cắt ảnh đại diện
          </DialogTitle>
          <DialogDescription className='text-xs text-muted-foreground'>
            Kéo để căn chỉnh vị trí hoặc dùng thanh trượt để phóng to/thu nhỏ ảnh của bạn.
          </DialogDescription>
        </DialogHeader>

        {/* Khung Crop tròn tương tác trực tiếp */}
        <div className='flex flex-col items-center justify-center py-2'>
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className='relative h-64 w-64 rounded-full overflow-hidden border-2 border-primary/60 bg-muted/40 shadow-inner cursor-grab active:cursor-grabbing select-none flex items-center justify-center'
          >
            {imageUrl && (
              <img
                ref={imageRef}
                src={imageUrl}
                alt='Crop preview'
                draggable={false}
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                  transformOrigin: 'center center',
                  maxHeight: '100%',
                  objectFit: 'contain'
                }}
                className='transition-transform duration-75 pointer-events-none select-none max-w-none'
              />
            )}

            {/* Grid đường kẻ hỗ trợ canh góc */}
            <div className='absolute inset-0 pointer-events-none border border-white/20 rounded-full' />
          </div>

          <div className='flex items-center gap-1.5 mt-3 text-[11px] text-muted-foreground'>
            <Icons.info className='h-3.5 w-3.5 text-primary' />
            <span>Kéo chuột để di chuyển ảnh vào tâm khung tròn</span>
          </div>
        </div>

        {/* Thanh trượt điều chỉnh độ phóng to (Zoom Slider) */}
        <div className='space-y-2 pt-2 px-1'>
          <div className='flex items-center justify-between text-xs font-semibold'>
            <span className='flex items-center gap-1 text-muted-foreground'>
              <Icons.search className='h-3.5 w-3.5' /> Thu nhỏ
            </span>
            <span className='font-mono text-primary'>{Math.round(zoom * 100)}%</span>
            <span className='flex items-center gap-1 text-muted-foreground'>
              <Icons.search className='h-3.5 w-3.5' /> Phóng to
            </span>
          </div>

          <Slider
            value={[zoom]}
            min={1}
            max={3}
            step={0.05}
            onValueChange={(val) => {
              if (Array.isArray(val) && typeof val[0] === 'number') {
                setZoom(val[0]);
              } else if (typeof val === 'number') {
                setZoom(val);
              }
            }}
            className='w-full cursor-pointer'
          />
        </div>

        {/* Nút hành động chuẩn base */}
        <DialogFooter className='flex flex-row items-center justify-end gap-2 pt-3 border-t border-border/80'>
          <Button
            type='button'
            variant='outline'
            size='sm'
            disabled={saving}
            onClick={() => onOpenChange(false)}
            className='h-8.5 text-xs rounded-lg'
          >
            Hủy bỏ
          </Button>
          <Button
            type='button'
            size='sm'
            disabled={saving}
            onClick={handleCropAndSave}
            className='h-8.5 px-4 text-xs font-semibold rounded-lg'
          >
            {saving ? (
              <>
                <Icons.spinner className='h-3.5 w-3.5 animate-spin mr-1.5' />
                Đang xử lý...
              </>
            ) : (
              <>
                <Icons.check className='h-3.5 w-3.5 mr-1.5' />
                Áp dụng ảnh
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
