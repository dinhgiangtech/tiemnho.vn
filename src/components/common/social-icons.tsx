import * as React from 'react';
import { cn } from '@/lib/utils';
import { Icons } from '@/components/icons';
import {
  TiktokIcon,
  InstagramIcon,
  FacebookIcon,
  YoutubeIcon,
  ThreadsIcon,
  ZaloIcon
} from '@/components/common/brand-icons';

export interface SocialIconItem {
  key: string;
  label: string;
  color?: string;
  bgColor?: string;
  borderColor?: string;
  hoverBg?: string;
  renderIcon: (props: { className?: string }) => React.ReactNode;
}

// Bộ icon mạng xã hội & sàn TMĐT
export const SOCIAL_PLATFORMS: Record<string, SocialIconItem> = {
  tiktok: {
    key: 'tiktok',
    label: 'TikTok',
    renderIcon: ({ className }) => <TiktokIcon className={className} />
  },
  zalo: {
    key: 'zalo',
    label: 'Zalo',
    color: '#0068ff',
    renderIcon: ({ className }) => <ZaloIcon className={className} />
  },
  youtube: {
    key: 'youtube',
    label: 'YouTube',
    renderIcon: ({ className }) => <YoutubeIcon className={className} />
  },
  instagram: {
    key: 'instagram',
    label: 'Instagram',
    renderIcon: ({ className }) => <InstagramIcon className={className} />
  },
  facebook: {
    key: 'facebook',
    label: 'Facebook',
    renderIcon: ({ className }) => <FacebookIcon className={className} />
  },
  threads: {
    key: 'threads',
    label: 'Threads',
    renderIcon: ({ className }) => <ThreadsIcon className={className} />
  },
  external: {
    key: 'external',
    label: 'Liên kết',
    renderIcon: ({ className }) => <Icons.externalLink className={className} />
  }
};

interface SocialIconBadgeProps {
  platform: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'colored' | 'badge' | 'minimal';
  className?: string;
}

export function SocialIconBadge({
  platform,
  size = 'md',
  variant = 'colored',
  className
}: SocialIconBadgeProps) {
  const p = SOCIAL_PLATFORMS[platform] ||
    SOCIAL_PLATFORMS.external || {
      key: 'external',
      label: 'Liên kết',
      renderIcon: ({ className }: { className?: string }) => (
        <Icons.externalLink className={className} />
      )
    };

  const sizeClasses = {
    xs: 'h-4 w-4 text-[8px]',
    sm: 'h-6 w-6 text-[10px]',
    md: 'h-8 w-8 text-xs',
    lg: 'h-10 w-10 text-sm'
  };

  const iconSizeClasses = {
    xs: 'h-3.5 w-3.5 max-w-full max-h-full object-contain shrink-0',
    sm: 'h-4 w-4 max-w-full max-h-full object-contain shrink-0',
    md: 'h-5 w-5 max-w-full max-h-full object-contain shrink-0',
    lg: 'h-7 w-7 max-w-full max-h-full object-contain shrink-0'
  };

  if (variant === 'colored') {
    return (
      <div
        className={cn(
          'flex items-center justify-center transition-transform hover:scale-110 shrink-0',
          sizeClasses[size],
          className
        )}
        style={p.color ? { color: p.color } : undefined}
        title={p.label}
      >
        {p.renderIcon({ className: iconSizeClasses[size] })}
      </div>
    );
  }

  if (variant === 'badge') {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold shadow-xs',
          p.borderColor || 'border-border',
          'bg-muted/30 text-foreground',
          className
        )}
      >
        <div
          className={cn(
            'h-5 w-5 rounded-full flex items-center justify-center text-white shrink-0',
            p.bgColor || 'bg-muted'
          )}
        >
          {p.renderIcon({ className: 'h-3 w-3' })}
        </div>
        <span>{p.label}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center border transition-colors',
        'border-border/60 bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted',
        sizeClasses[size],
        className
      )}
      title={p.label}
    >
      {p.renderIcon({ className: iconSizeClasses[size] })}
    </div>
  );
}
