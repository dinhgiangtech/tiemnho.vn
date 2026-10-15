'use client';

import * as React from 'react';
import { CreatorProfile, Product, PaymentConfig } from '@/constants/mock-tiemnho';
import { getProfile, updateProfile, getProducts, getPaymentConfig } from '../../api/service';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PhoneMockup } from '../mobile-preview/phone-mockup';
import { Icons } from '@/components/icons';
import { toast } from 'sonner';

export function StorefrontSettingsView() {
  const [profile, setProfile] = React.useState<CreatorProfile | null>(null);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [paymentConfig, setPaymentConfig] = React.useState<PaymentConfig | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  // Form states
  const [displayName, setDisplayName] = React.useState('');
  const [username, setUsername] = React.useState('');
  const [bio, setBio] = React.useState('');
  const [avatarUrl, setAvatarUrl] = React.useState('');
  const [tiktok, setTiktok] = React.useState('');
  const [instagram, setInstagram] = React.useState('');
  const [youtube, setYoutube] = React.useState('');
  const [facebook, setFacebook] = React.useState('');

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
      setTiktok(prof.socials.tiktok || '');
      setInstagram(prof.socials.instagram || '');
      setYoutube(prof.socials.youtube || '');
      setFacebook(prof.socials.facebook || '');
    } catch {
      toast.error('Lỗi khi tải thông tin hồ sơ');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

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
        avatarUrl: avatarUrl.trim() || profile?.avatarUrl,
        socials: {
          tiktok: tiktok.trim() || undefined,
          instagram: instagram.trim() || undefined,
          youtube: youtube.trim() || undefined,
          facebook: facebook.trim() || undefined
        }
      });
      setProfile(updated);
      toast.success('Đã lưu thông tin hồ sơ Storefront thành công!');
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
      avatarUrl:
        avatarUrl ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&h=400&q=80',
      verified: true,
      theme: profile?.theme || 'obsidian',
      socials: {
        tiktok: tiktok || undefined,
        instagram: instagram || undefined,
        youtube: youtube || undefined,
        facebook: facebook || undefined
      }
    };
  }, [profile, displayName, username, bio, avatarUrl, tiktok, instagram, youtube, facebook]);

  if (loading || !profile || !paymentConfig) {
    return (
      <div className='p-8 text-center text-xs text-muted-foreground'>
        Đang tải giao diện Storefront...
      </div>
    );
  }

  return (
    <div className='grid grid-cols-1 lg:grid-cols-12 gap-6 items-start'>
      {/* Cột trái: Form chỉnh sửa */}
      <div className='lg:col-span-7 space-y-6'>
        <form onSubmit={handleSave} className='space-y-6'>
          <Card className='border border-border shadow-xs'>
            <CardHeader>
              <CardTitle className='text-base font-bold'>Thông tin định danh Creator</CardTitle>
              <CardDescription className='text-xs'>
                Hiển thị trên phần đầu trang Bio Storefront của bạn.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4 text-xs'>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <div className='space-y-1.5'>
                  <label className='font-semibold text-foreground text-xs'>
                    Tên hiển thị <span className='text-primary font-bold'>*</span>
                  </label>
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder='VD: Giang Định'
                    className='h-10 text-sm rounded-xl'
                    required
                  />
                </div>

                <div className='space-y-1.5'>
                  <label className='font-semibold text-foreground text-xs'>
                    Username / Đường dẫn Bio <span className='text-primary font-bold'>*</span>
                  </label>
                  <div className='relative'>
                    <span className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono'>
                      @
                    </span>
                    <Input
                      value={username}
                      onChange={(e) =>
                        setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))
                      }
                      placeholder='giangdinh'
                      className='pl-8 h-10 text-sm font-mono rounded-xl'
                      required
                    />
                  </div>
                  <p className='text-[10px] text-muted-foreground'>
                    Đường dẫn bio của bạn:{' '}
                    <strong className='text-primary'>tiemnho.vn/@{username}</strong>
                  </p>
                </div>
              </div>

              <div className='space-y-1.5'>
                <label className='font-semibold text-foreground text-xs'>Tiểu sử ngắn (Bio)</label>
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder='Giới thiệu ngắn gọn bạn là ai và bạn chia sẻ điều gì...'
                  className='min-h-[80px] text-sm rounded-xl resize-none'
                />
              </div>

              <div className='space-y-1.5'>
                <label className='font-semibold text-foreground text-xs'>
                  URL Ảnh đại diện (Avatar)
                </label>
                <Input
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder='https://images.unsplash.com/...'
                  className='h-10 text-xs rounded-xl'
                />
              </div>
            </CardContent>
          </Card>

          <Card className='border border-border shadow-xs'>
            <CardHeader>
              <CardTitle className='text-base font-bold'>Liên kết Mạng xã hội</CardTitle>
              <CardDescription className='text-xs'>
                Các icon mạng xã hội hiển thị ngay dưới bio để người theo dõi bấm vào.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-3.5 text-xs'>
              <div className='space-y-1.5'>
                <label className='font-semibold text-foreground text-xs flex items-center gap-1.5'>
                  <Icons.tiktok className='h-4 w-4' />
                  TikTok URL
                </label>
                <Input
                  value={tiktok}
                  onChange={(e) => setTiktok(e.target.value)}
                  placeholder='https://tiktok.com/@giangdinh'
                  className='h-9 text-xs rounded-xl'
                />
              </div>

              <div className='space-y-1.5'>
                <label className='font-semibold text-foreground text-xs flex items-center gap-1.5'>
                  <Icons.instagram className='h-4 w-4' />
                  Instagram URL
                </label>
                <Input
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder='https://instagram.com/giangdinh'
                  className='h-9 text-xs rounded-xl'
                />
              </div>

              <div className='space-y-1.5'>
                <label className='font-semibold text-foreground text-xs flex items-center gap-1.5'>
                  <Icons.youtube className='h-4 w-4' />
                  YouTube URL
                </label>
                <Input
                  value={youtube}
                  onChange={(e) => setYoutube(e.target.value)}
                  placeholder='https://youtube.com/@giangdinh'
                  className='h-9 text-xs rounded-xl'
                />
              </div>

              <div className='space-y-1.5'>
                <label className='font-semibold text-foreground text-xs flex items-center gap-1.5'>
                  <Icons.facebook className='h-4 w-4' />
                  Facebook URL
                </label>
                <Input
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                  placeholder='https://facebook.com/giangdinh'
                  className='h-9 text-xs rounded-xl'
                />
              </div>
            </CardContent>
            <CardFooter className='border-t border-border pt-4 flex justify-end'>
              <Button
                type='submit'
                disabled={saving}
                className='h-10 text-xs font-semibold rounded-xl px-6 shadow-xs'
              >
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>

      {/* Cột phải: Live Mobile Phone Preview (chuẩn Stan Store / Linktree) */}
      <div className='lg:col-span-5 sticky top-20 flex flex-col items-center'>
        <div className='flex items-center gap-2 mb-3 text-xs text-muted-foreground'>
          <Icons.deviceMobile className='h-4 w-4 text-primary' />
          <span className='font-semibold text-foreground'>Live Mobile Preview</span>
          <span>(Cập nhật thời gian thực)</span>
        </div>

        <PhoneMockup
          profile={livePreviewProfile}
          products={products}
          paymentConfig={paymentConfig}
          className='scale-[0.88] sm:scale-100 origin-top'
        />
      </div>
    </div>
  );
}
