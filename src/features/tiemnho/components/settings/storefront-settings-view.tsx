'use client';

import { SocialIconBadge } from '@/components/common/social-icons';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CreatorProfile, PaymentConfig, Product } from '@/constants/mock-tiemnho';
import { uploadClientFile } from '@/lib/upload-client';
import Link from 'next/link';
import * as React from 'react';
import { toast } from 'sonner';
import { getPaymentConfig, getProducts, getProfile, updateProfile } from '../../api/service';
import { PhoneMockup } from '../mobile-preview/phone-mockup';
import { ImageCropModal } from './image-crop-modal';

interface SocialField {
  key: 'tiktok' | 'instagram' | 'youtube' | 'facebook' | 'zalo' | 'threads';
  label: string;
  placeholder: string;
}

const AVAILABLE_SOCIALS: SocialField[] = [
  {
    key: 'tiktok',
    label: 'TikTok',
    placeholder: 'https://tiktok.com/@username hoặc @username'
  },
  {
    key: 'instagram',
    label: 'Instagram',
    placeholder: 'https://instagram.com/username hoặc @username'
  },
  {
    key: 'youtube',
    label: 'YouTube',
    placeholder: 'https://youtube.com/@channel'
  },
  {
    key: 'facebook',
    label: 'Facebook',
    placeholder: 'https://facebook.com/username'
  },
  {
    key: 'zalo',
    label: 'Zalo',
    placeholder: 'Số điện thoại Zalo hoặc link https://zalo.me/...'
  },
  {
    key: 'threads',
    label: 'Threads',
    placeholder: 'https://threads.net/@username'
  }
];

export function StorefrontSettingsView() {
  const [profile, setProfile] = React.useState<CreatorProfile | null>(null);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [paymentConfig, setPaymentConfig] = React.useState<PaymentConfig | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [uploadingAvatar, setUploadingAvatar] = React.useState(false);

  // State cho Popup Crop ảnh đại diện
  const [cropModalOpen, setCropModalOpen] = React.useState(false);
  const [cropImageUrl, setCropImageUrl] = React.useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Form states
  const [displayName, setDisplayName] = React.useState('');
  const [username, setUsername] = React.useState('');
  const [bio, setBio] = React.useState('');
  const [avatarUrl, setAvatarUrl] = React.useState('');
  const [selectedTheme, setSelectedTheme] = React.useState<CreatorProfile['theme']>('obsidian');

  // Social Links State (dynamic list)
  const [socialsState, setSocialsState] = React.useState<Record<string, string>>({
    tiktok: '',
    instagram: '',
    youtube: '',
    facebook: '',
    zalo: '',
    threads: ''
  });

  // Track which socials are active/visible in form (mặc định trống, chỉ thêm khi bấm nút)
  const [activeSocialKeys, setActiveSocialKeys] = React.useState<string[]>([]);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [prof, prods, pay] = await Promise.all([
        getProfile(),
        getProducts(),
        getPaymentConfig()
      ]);
      setProfile(prof);
      setProducts(prods);
      setPaymentConfig(pay);

      setDisplayName(prof.displayName);
      setUsername(prof.username);
      setBio(prof.bio);
      setAvatarUrl(prof.avatarUrl);
      setSelectedTheme(prof.theme || 'obsidian');

      const s = {
        tiktok: prof.socials.tiktok || '',
        instagram: prof.socials.instagram || '',
        youtube: prof.socials.youtube || '',
        facebook: prof.socials.facebook || '',
        zalo: prof.socials.zalo || '',
        threads: prof.socials.threads || ''
      };
      setSocialsState(s);

      // Chỉ kích hoạt các MXH thực sự có dữ liệu từ DB (không ép mặc định)
      const existing = (Object.keys(s) as Array<keyof typeof s>).filter((k) =>
        Boolean(s[k]?.trim())
      );
      setActiveSocialKeys(existing);
    } catch {
      toast.error('Lỗi khi tải thông tin hồ sơ');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Khi người dùng chọn file ảnh từ máy: đọc DataURL và mở popup Crop
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file hình ảnh (JPG, PNG, WebP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCropImageUrl(reader.result as string);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);

    // Reset value input để có thể chọn lại cùng 1 file nếu muốn
    e.target.value = '';
  };

  // Nhận file ảnh sau khi crop xong từ ImageCropModal và upload lên server
  const handleConfirmCrop = async (croppedFile: File) => {
    setUploadingAvatar(true);
    const toastId = toast.loading('Đang tối ưu và tải ảnh đại diện lên...');
    try {
      const res = await uploadClientFile(croppedFile, { folder: 'avatars' });
      setAvatarUrl(res.url);
      toast.success('Đã tải ảnh đại diện đã cắt lên thành công!', { id: toastId });
    } catch {
      toast.error('Lỗi khi tải ảnh lên máy chủ', { id: toastId });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleAddSocial = (key: string) => {
    if (!activeSocialKeys.includes(key)) {
      setActiveSocialKeys((prev) => [...prev, key]);
    }
  };

  const handleRemoveSocial = (key: string) => {
    setActiveSocialKeys((prev) => prev.filter((k) => k !== key));
    setSocialsState((prev) => ({ ...prev, [key]: '' }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || !username.trim()) {
      toast.error('Vui lòng nhập tên hiển thị và username');
      return;
    }

    setSaving(true);
    try {
      const updated = await updateProfile({
        displayName: displayName.trim(),
        username: username.trim().toLowerCase(),
        bio: bio.trim(),
        avatarUrl: avatarUrl.trim(),
        theme: selectedTheme,
        socials: {
          tiktok: activeSocialKeys.includes('tiktok') ? socialsState.tiktok?.trim() : '',
          instagram: activeSocialKeys.includes('instagram') ? socialsState.instagram?.trim() : '',
          youtube: activeSocialKeys.includes('youtube') ? socialsState.youtube?.trim() : '',
          facebook: activeSocialKeys.includes('facebook') ? socialsState.facebook?.trim() : '',
          zalo: activeSocialKeys.includes('zalo') ? socialsState.zalo?.trim() : '',
          threads: activeSocialKeys.includes('threads') ? socialsState.threads?.trim() : ''
        }
      });
      setProfile(updated);
      toast.success('Đã lưu thông tin tài khoản & Tiệm thành công!');
    } catch {
      toast.error('Lỗi khi lưu thông tin hồ sơ');
    } finally {
      setSaving(false);
    }
  };

  // Preview profile based on active form edits
  const livePreviewProfile: CreatorProfile = React.useMemo(() => {
    return {
      id: profile?.id || 'creator-giangdinh',
      displayName: displayName || 'Tên Creator',
      username: username || 'username',
      bio: bio || 'Mô tả ngắn gọn về bạn...',
      avatarUrl: avatarUrl || '',
      verified: true,
      theme: selectedTheme || 'obsidian',
      socials: {
        tiktok: activeSocialKeys.includes('tiktok')
          ? socialsState.tiktok?.trim() || undefined
          : undefined,
        instagram: activeSocialKeys.includes('instagram')
          ? socialsState.instagram?.trim() || undefined
          : undefined,
        youtube: activeSocialKeys.includes('youtube')
          ? socialsState.youtube?.trim() || undefined
          : undefined,
        facebook: activeSocialKeys.includes('facebook')
          ? socialsState.facebook?.trim() || undefined
          : undefined,
        zalo: activeSocialKeys.includes('zalo')
          ? socialsState.zalo?.trim() || undefined
          : undefined,
        threads: activeSocialKeys.includes('threads')
          ? socialsState.threads?.trim() || undefined
          : undefined
      }
    };
  }, [
    profile,
    displayName,
    username,
    bio,
    avatarUrl,
    selectedTheme,
    socialsState,
    activeSocialKeys
  ]);

  if (loading || !profile || !paymentConfig) {
    return (
      <div className='p-16 text-center text-xs text-muted-foreground'>
        <Icons.spinner className='h-5 w-5 animate-spin mx-auto mb-2 text-primary' />
        Đang tải giao diện chỉnh sửa hồ sơ...
      </div>
    );
  }

  const unaddedSocials = AVAILABLE_SOCIALS.filter((s) => !activeSocialKeys.includes(s.key));

  return (
    <div className='space-y-6'>
      {/* Top Action bar */}
      <div className='flex items-center justify-end gap-2 pb-3 border-b border-border/80'>
        <Button
          type='button'
          onClick={handleSave}
          disabled={saving}
          size='sm'
          className='h-8.5 px-4 text-xs font-semibold rounded-lg'
        >
          {saving ? (
            <>
              <Icons.spinner className='h-3.5 w-3.5 animate-spin mr-1.5' />
              Đang lưu...
            </>
          ) : (
            <>
              <Icons.check className='h-3.5 w-3.5 mr-1.5' />
              Lưu hồ sơ
            </>
          )}
        </Button>
      </div>

      {/* Main Grid: Cột trái Form (Card shadcn) & Cột phải Phone Preview */}
      <div className='grid grid-cols-1 lg:grid-cols-12 gap-6 items-start'>
        {/* Form thiết lập (7 Cột) */}
        <div className='lg:col-span-7 space-y-6'>
          <form onSubmit={handleSave} className='space-y-6'>
            {/* 1. Ảnh đại diện Avatar */}
            <Card className='rounded-xl border shadow-xs'>
              <CardHeader className='pb-3'>
                <CardTitle className='text-sm font-semibold'>1. Ảnh đại diện (Avatar)</CardTitle>
                <CardDescription className='text-xs'>
                  Ảnh hiển thị chính trên trang Bio và thẻ chia sẻ của bạn.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4 pt-1'>
                <div className='flex items-center gap-4'>
                  <div className='relative group shrink-0'>
                    <input
                      ref={fileInputRef}
                      type='file'
                      accept='image/*'
                      onChange={handleAvatarFileChange}
                      className='hidden'
                    />
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className='relative h-20 w-20 rounded-full overflow-hidden border border-border bg-muted/30 flex items-center justify-center cursor-pointer transition-all hover:ring-2 hover:ring-primary/20 shadow-2xs'
                    >
                      <img
                        src={avatarUrl || '/default-avatar.svg'}
                        alt={displayName || 'Avatar'}
                        className='h-full w-full object-cover'
                      />

                      {uploadingAvatar && (
                        <div className='absolute inset-0 bg-background/80 flex items-center justify-center backdrop-blur-2xs'>
                          <Icons.spinner className='h-5 w-5 animate-spin text-primary' />
                        </div>
                      )}
                    </div>

                    <button
                      type='button'
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      title='Tải ảnh đại diện'
                      className='absolute bottom-0 right-0 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xs border-2 border-background hover:bg-primary/90 transition-all cursor-pointer'
                    >
                      <Icons.edit className='h-3 w-3' />
                    </button>
                  </div>

                  <div className='space-y-1.5 flex-1 min-w-0'>
                    <div className='flex flex-wrap items-center gap-2'>
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        disabled={uploadingAvatar}
                        onClick={() => fileInputRef.current?.click()}
                        className='h-8 text-xs rounded-lg'
                      >
                        <Icons.upload className='h-3.5 w-3.5 mr-1.5' />
                        {uploadingAvatar ? 'Đang tải lên...' : 'Tải ảnh mới'}
                      </Button>
                      {avatarUrl && (
                        <Button
                          type='button'
                          variant='ghost'
                          size='sm'
                          onClick={() => setAvatarUrl('')}
                          className='h-8 text-xs text-muted-foreground hover:text-destructive rounded-lg'
                        >
                          Xóa ảnh
                        </Button>
                      )}
                    </div>
                    <p className='text-[11px] text-muted-foreground'>
                      Khuyên dùng ảnh vuông 1:1, dung lượng dưới 5MB. Để trống sẽ dùng avatar mặc
                      định.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 2. Thông tin cá nhân */}
            <Card className='rounded-xl border shadow-xs'>
              <CardHeader className='pb-3'>
                <CardTitle className='text-sm font-semibold'>2. Thông tin cá nhân</CardTitle>
                <CardDescription className='text-xs'>
                  Tên hiển thị, đường dẫn Bio và phần giới thiệu ngắn.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4 pt-1'>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <div className='space-y-1.5'>
                    <label className='text-xs font-medium text-foreground'>
                      Tên hiển thị <span className='text-destructive'>*</span>
                    </label>
                    <Input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder='Đinh Trường Giang'
                      className='h-9 text-xs rounded-lg'
                      required
                    />
                  </div>

                  <div className='space-y-1.5'>
                    <label className='text-xs font-medium text-foreground'>
                      Username Bio <span className='text-destructive'>*</span>
                    </label>
                    <div className='relative'>
                      <span className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-xs'>
                        @
                      </span>
                      <Input
                        value={username}
                        onChange={(e) =>
                          setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))
                        }
                        placeholder='dinhgiang'
                        className='pl-7 h-9 text-xs font-mono rounded-lg'
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className='space-y-1.5'>
                  <div className='flex items-center justify-between'>
                    <label className='text-xs font-medium text-foreground'>Tiểu sử (Bio)</label>
                    <span className='text-[11px] text-muted-foreground'>{bio.length}/160</span>
                  </div>
                  <Textarea
                    value={bio}
                    onChange={(e) => {
                      if (e.target.value.length <= 160) {
                        setBio(e.target.value);
                      }
                    }}
                    placeholder='Mô tả ngắn gọn về bạn hoặc cửa hàng của bạn...'
                    rows={3}
                    className='text-xs rounded-lg resize-none leading-relaxed'
                  />
                </div>
              </CardContent>
            </Card>

            {/* 3. Mạng xã hội */}
            <Card className='rounded-xl border shadow-xs'>
              <CardHeader className='pb-3'>
                <CardTitle className='text-sm font-semibold'>
                  3. Mạng xã hội & Kênh liên hệ
                </CardTitle>
                <CardDescription className='text-xs'>
                  Thêm các kênh mạng xã hội mà bạn muốn hiển thị trên trang Bio.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4 pt-1'>
                {activeSocialKeys.length === 0 ? (
                  <div className='p-6 rounded-lg border border-dashed border-border text-center text-xs text-muted-foreground bg-muted/20'>
                    Chưa có mạng xã hội nào. Chọn các kênh bên dưới để thêm vào trang Bio của bạn.
                  </div>
                ) : (
                  <div className='space-y-2.5'>
                    {activeSocialKeys.map((key) => {
                      const socialItem = AVAILABLE_SOCIALS.find((s) => s.key === key);
                      if (!socialItem) return null;

                      return (
                        <div
                          key={key}
                          className='flex items-center gap-2.5 p-2 rounded-lg border bg-card hover:border-border transition-colors'
                        >
                          <div className='shrink-0'>
                            <SocialIconBadge platform={key} size='sm' />
                          </div>

                          <span className='text-xs font-semibold w-20 shrink-0 text-foreground'>
                            {socialItem.label}
                          </span>

                          <div className='relative flex-1'>
                            <Input
                              value={socialsState[key] || ''}
                              onChange={(e) =>
                                setSocialsState((prev) => ({ ...prev, [key]: e.target.value }))
                              }
                              placeholder={socialItem.placeholder}
                              className='h-8 text-xs rounded-lg'
                            />
                          </div>

                          <Button
                            type='button'
                            variant='ghost'
                            size='sm'
                            onClick={() => handleRemoveSocial(key)}
                            className='h-8 w-8 p-0 text-muted-foreground hover:text-destructive rounded-lg'
                            title='Gỡ bỏ'
                          >
                            <Icons.close className='h-3.5 w-3.5' />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Danh sách nút thêm mạng xã hội */}
                {unaddedSocials.length > 0 && (
                  <div className='pt-2 border-t border-border/60'>
                    <label className='font-medium text-xs text-muted-foreground block mb-2'>
                      + Thêm mạng xã hội khác:
                    </label>
                    <div className='flex flex-wrap items-center gap-2'>
                      {unaddedSocials.map((social) => {
                        return (
                          <Button
                            key={social.key}
                            type='button'
                            variant='outline'
                            size='sm'
                            onClick={() => handleAddSocial(social.key)}
                            className='h-8 px-2.5 text-xs rounded-lg gap-2 cursor-pointer hover:bg-muted'
                          >
                            <SocialIconBadge platform={social.key} size='sm' />
                            <span>+ {social.label}</span>
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bottom Actions: Dính đáy (Sticky Action Bar) */}
            <div className='sticky bottom-20 md:bottom-4 z-20 bg-white/95 dark:bg-card/95 backdrop-blur-md p-3 sm:p-3.5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-md flex items-center justify-end gap-2.5 mt-4'>
              <Link href='/dashboard/products'>
                <Button variant='outline' size='sm' className='h-9 text-xs rounded-xl'>
                  Hủy bỏ
                </Button>
              </Link>
              <Button
                type='submit'
                disabled={saving}
                size='sm'
                className='h-9 px-5 text-xs font-bold rounded-xl shadow-xs'
              >
                {saving ? (
                  <>
                    <Icons.spinner className='h-3.5 w-3.5 animate-spin mr-1.5' />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Icons.check className='h-3.5 w-3.5 mr-1.5 stroke-[2.5]' />
                    Lưu thay đổi
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Khung xem trước thời gian thực (Chỉ hiển thị trên Desktop >= md) */}
        <div className='hidden md:block lg:col-span-5 sticky top-6 space-y-3'>
          <div className='rounded-xl border bg-card p-3 shadow-xs flex items-center justify-between text-xs'>
            <div className='flex items-center gap-2'>
              <span className='relative flex h-2 w-2'>
                <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75'></span>
                <span className='relative inline-flex rounded-full h-2 w-2 bg-emerald-500'></span>
              </span>
              <span className='font-medium text-foreground'>Xem trước thời gian thực</span>
            </div>
            <a
              href={`/@${username}`}
              target='_blank'
              rel='noreferrer'
              className='text-primary hover:underline font-medium inline-flex items-center gap-1 text-[11px]'
            >
              Mở link Bio
              <Icons.externalLink className='h-3 w-3' />
            </a>
          </div>

          <PhoneMockup
            profile={livePreviewProfile}
            products={products}
            paymentConfig={paymentConfig}
            className='scale-[0.92] sm:scale-100 origin-top'
          />
        </div>
      </div>

      {/* Popup Cắt & Căn chỉnh Avatar */}
      <ImageCropModal
        open={cropModalOpen}
        onOpenChange={setCropModalOpen}
        imageUrl={cropImageUrl}
        onConfirmCrop={handleConfirmCrop}
      />
    </div>
  );
}
