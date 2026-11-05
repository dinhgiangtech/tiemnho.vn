'use client';

import * as React from 'react';
import Image from 'next/image';
import { CreatorProfile } from '@/constants/mock-tiemnho';
import { SocialIconBadge } from '@/components/common/social-icons';
import { BadgeCheck, Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface ProfileHeaderProps {
  profile: CreatorProfile;
  variant?: 'mobile' | 'desktop';
  className?: string;
}

export function ProfileHeader({ profile, variant = 'mobile', className = '' }: ProfileHeaderProps) {
  const handleShareBio = () => {
    const url =
      typeof window !== 'undefined' ? `${window.location.origin}/@${profile.username}` : '';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      toast.success('Đã sao chép liên kết tiệm của bạn!');
    }
  };

  // ==========================================
  // MOBILE / IN-APP WEBVIEW HEADER (Căn giữa 1 cột chuẩn Stan Store)
  // ==========================================
  if (variant === 'mobile') {
    return (
      <div className={`flex flex-col items-center text-center space-y-2.5 pt-2 pb-4 ${className}`}>
        {/* Avatar tròn lớn ở tâm w-28 h-28 */}
        <div className='relative'>
          <div className='w-28 h-28 rounded-full overflow-hidden bg-neutral-100 shadow-sm mx-auto'>
            <Image
              src={profile.avatarUrl || '/default-avatar.svg'}
              alt={profile.displayName}
              width={112}
              height={112}
              className='w-full h-full object-cover'
              unoptimized
            />
          </div>
        </div>

        {/* Tên Creator in đậm */}
        <div className='space-y-0.5 pt-1'>
          <div className='flex items-center justify-center gap-1.5'>
            <h1 className='text-2xl font-extrabold tracking-tight text-neutral-900'>
              {profile.displayName || profile.username}
            </h1>
            {profile.verified && (
              <span title='Creator đã xác thực' className='inline-flex items-center shrink-0'>
                <BadgeCheck className='w-5 h-5 text-neutral-400 fill-neutral-100 stroke-[2.2]' />
              </span>
            )}
          </div>
        </div>

        {/* Dòng Bio tóm tắt */}
        <p className='font-normal text-[13.5px] leading-relaxed text-neutral-600 text-center max-w-[300px] mt-2'>
          {profile.bio}
        </p>

        {/* Hàng icon mạng xã hội bọc trong ô vuông bo góc xám nhạt w-8 h-8 */}
        {profile.socials && Object.values(profile.socials).some(Boolean) && (
          <div className='flex items-center justify-center gap-2 mt-3 text-neutral-700 flex-wrap'>
            {profile.socials.instagram && (
              <a
                href={profile.socials.instagram}
                target='_blank'
                rel='noreferrer'
                className='w-8 h-8 rounded-lg bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-700 transition-colors shadow-2xs'
                title='Instagram'
              >
                <SocialIconBadge platform='instagram' size='sm' />
              </a>
            )}
            {profile.socials.tiktok && (
              <a
                href={profile.socials.tiktok}
                target='_blank'
                rel='noreferrer'
                className='w-8 h-8 rounded-lg bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-700 transition-colors shadow-2xs'
                title='TikTok'
              >
                <SocialIconBadge platform='tiktok' size='sm' />
              </a>
            )}
            {profile.socials.youtube && (
              <a
                href={profile.socials.youtube}
                target='_blank'
                rel='noreferrer'
                className='w-8 h-8 rounded-lg bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-700 transition-colors shadow-2xs'
                title='YouTube'
              >
                <SocialIconBadge platform='youtube' size='sm' />
              </a>
            )}
            {profile.socials.facebook && (
              <a
                href={profile.socials.facebook}
                target='_blank'
                rel='noreferrer'
                className='w-8 h-8 rounded-lg bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-700 transition-colors shadow-2xs'
                title='Facebook'
              >
                <SocialIconBadge platform='facebook' size='sm' />
              </a>
            )}
            {profile.socials.zalo && (
              <a
                href={`https://zalo.me/${profile.socials.zalo}`}
                target='_blank'
                rel='noreferrer'
                className='w-8 h-8 rounded-lg bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-700 transition-colors shadow-2xs'
                title='Zalo'
              >
                <SocialIconBadge platform='zalo' size='sm' />
              </a>
            )}
            <button
              type='button'
              onClick={handleShareBio}
              className='w-8 h-8 rounded-lg bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-700 transition-colors cursor-pointer shadow-2xs'
              title='Chia sẻ tiệm'
            >
              <Share2 className='w-3.5 h-3.5' />
            </button>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // DESKTOP HERO SECTION (Phong cách Bento / Creator với Cover Banner)
  // ==========================================
  return (
    <div
      className={`w-full bg-white rounded-3xl border border-neutral-200/80 shadow-xs overflow-hidden mb-8 ${className}`}
    >
      {/* Dải Cover Banner tinh tế phía sau */}
      <div className='h-36 md:h-44 w-full bg-gradient-to-r from-neutral-100 via-neutral-200/60 to-neutral-100 relative overflow-hidden'>
        {profile.coverUrl ? (
          <Image
            src={profile.coverUrl}
            alt='Cover Banner'
            fill
            className='object-cover opacity-90'
            unoptimized
          />
        ) : (
          <div className='w-full h-full flex items-center justify-end pr-10 opacity-15'>
            <span className='text-6xl font-black tracking-tighter text-neutral-400 select-none'>
              {profile.displayName || profile.username}
            </span>
          </div>
        )}
      </div>

      {/* Thông tin Creator dàn ngang bên dưới banner */}
      <div className='px-8 pb-6 pt-2 flex flex-col md:flex-row items-start md:items-end justify-between gap-6'>
        {/* Avatar đè nhẹ lên góc banner + Tên & Bio */}
        <div className='flex flex-col md:flex-row items-center md:items-start gap-5 -mt-14 z-10'>
          <div className='w-28 h-28 rounded-full border-4 border-white shadow-md bg-white overflow-hidden shrink-0'>
            <Image
              src={profile.avatarUrl || '/default-avatar.svg'}
              alt={profile.displayName}
              width={112}
              height={112}
              className='w-full h-full object-cover'
              unoptimized
            />
          </div>

          <div className='space-y-1.5 text-center md:text-left pt-2 md:pt-14'>
            <div className='flex items-center justify-center md:justify-start gap-2'>
              <h1 className='text-2xl font-extrabold tracking-tight text-neutral-900'>
                {profile.displayName}
              </h1>
              {profile.verified && (
                <span title='Creator đã xác thực' className='inline-flex items-center shrink-0'>
                  <BadgeCheck className='w-5 h-5 text-neutral-400 fill-neutral-100 stroke-[2.2]' />
                </span>
              )}
            </div>
            <p className='text-xs font-mono font-medium text-neutral-400'>@{profile.username}</p>
            <p className='font-normal text-[13.5px] leading-relaxed text-neutral-600 max-w-xl'>
              {profile.bio}
            </p>
          </div>
        </div>

        {/* Hàng Social Icons trên Desktop */}
        {profile.socials && Object.values(profile.socials).some(Boolean) && (
          <div className='flex items-center gap-2 pb-1 mx-auto md:mx-0'>
            {profile.socials.instagram && (
              <a
                href={profile.socials.instagram}
                target='_blank'
                rel='noreferrer'
                className='w-9 h-9 rounded-xl bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-700 transition-colors shadow-2xs'
                title='Instagram'
              >
                <SocialIconBadge platform='instagram' size='sm' />
              </a>
            )}
            {profile.socials.tiktok && (
              <a
                href={profile.socials.tiktok}
                target='_blank'
                rel='noreferrer'
                className='w-9 h-9 rounded-xl bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-700 transition-colors shadow-2xs'
                title='TikTok'
              >
                <SocialIconBadge platform='tiktok' size='sm' />
              </a>
            )}
            {profile.socials.youtube && (
              <a
                href={profile.socials.youtube}
                target='_blank'
                rel='noreferrer'
                className='w-9 h-9 rounded-xl bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-700 transition-colors shadow-2xs'
                title='YouTube'
              >
                <SocialIconBadge platform='youtube' size='sm' />
              </a>
            )}
            {profile.socials.facebook && (
              <a
                href={profile.socials.facebook}
                target='_blank'
                rel='noreferrer'
                className='w-9 h-9 rounded-xl bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-700 transition-colors shadow-2xs'
                title='Facebook'
              >
                <SocialIconBadge platform='facebook' size='sm' />
              </a>
            )}
            {profile.socials.zalo && (
              <a
                href={`https://zalo.me/${profile.socials.zalo}`}
                target='_blank'
                rel='noreferrer'
                className='w-9 h-9 rounded-xl bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-700 transition-colors shadow-2xs'
                title='Zalo'
              >
                <SocialIconBadge platform='zalo' size='sm' />
              </a>
            )}
            <button
              type='button'
              onClick={handleShareBio}
              className='w-9 h-9 rounded-xl bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-700 transition-colors cursor-pointer shadow-2xs'
              title='Chia sẻ tiệm'
            >
              <Share2 className='w-4 h-4' />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
