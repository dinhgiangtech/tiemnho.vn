'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/common/logo';
import type { CreatorProfile, Product, PaymentConfig } from '@/constants/mock-tiemnho';
import { ScrollCraft } from '../lib/scrollcraft';
import '../styles/pro-landing.css';

interface ProLandingProps {
  userId?: string | null;
  storeHandle?: string;
  profile?: CreatorProfile | null;
  products?: Product[];
  paymentConfig?: PaymentConfig | null;
}

export function ProLanding({
  userId,
  storeHandle = 'dinhgiang',
  profile,
  products = [],
  paymentConfig
}: ProLandingProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  const creatorName = profile?.displayName || 'Đinh Trường Giang';
  const handle = profile?.username || storeHandle || 'dinhgiang';
  const creatorBio =
    profile?.bio || 'Đóng gói kiến thức & tài nguyên số thành cỗ máy nhận tiền tự động 24/7.';
  const avatarUrl = profile?.avatarUrl || '/default-avatar.svg';
  const bankName = paymentConfig?.bankName || 'Ngân hàng Quân Đội (MB Bank)';
  const bankAccountNumber = paymentConfig?.accountNumber || '0988667788';
  const bankAccountName = paymentConfig?.accountName || 'DINH TRUONG GIANG';

  useEffect(() => {
    if (!rootRef.current || typeof window === 'undefined') return;

    // 1. Mount ScrollCraft interaction engine
    const sc = ScrollCraft.mount(rootRef.current);

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const narrow = window.matchMedia('(max-width: 900px)');

    function clamp(v: number) {
      return v < 0 ? 0 : v > 1 ? 1 : v;
    }
    function ease(t: number) {
      return 1 - Math.pow(1 - t, 3);
    }
    function vnd(n: number) {
      return Math.round(n)
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }

    // 2. Headings rise word by word
    function splitWords(el: Element) {
      let i = 0;
      Array.prototype.slice.call(el.childNodes).forEach(function walk(n: Node) {
        if (n.nodeType === 1) {
          Array.prototype.slice.call(n.childNodes).forEach(walk);
          return;
        }
        if (n.nodeType !== 3 || !n.textContent) return;
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) {
            frag.appendChild(document.createTextNode(' '));
            return;
          }
          const w = document.createElement('span');
          w.className = 'w';
          const s = document.createElement('span');
          s.textContent = part;
          s.style.setProperty('--i', String(i++));
          w.appendChild(s);
          frag.appendChild(w);
        });
        n.parentNode?.replaceChild(frag, n);
      });
    }

    const heads = rootRef.current.querySelectorAll<HTMLElement>(
      '.hero h1, .turn h2, .order__head h2, .rail__lead h2, .sheet h2'
    );
    heads.forEach(splitWords);

    // Number ticker
    function countUp(el: HTMLElement) {
      const to = Number(el.getAttribute('data-vnd')) || 0;
      if (reduce) {
        el.textContent = vnd(to);
        return;
      }
      const t0 = performance.now();
      const dur = 1500;
      function step(now: number) {
        const k = clamp((now - t0) / dur);
        el.textContent = vnd(to * ease(k));
        if (k < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const t = e.target as HTMLElement;
          if (t.hasAttribute('data-vnd')) {
            countUp(t);
          } else {
            t.classList.add('is-words');
          }
          io.unobserve(t);
        });
      },
      { rootMargin: '0px 0px -12% 0px' }
    );

    heads.forEach((h) => io.observe(h));
    rootRef.current.querySelectorAll<HTMLElement>('[data-vnd]').forEach((el) => {
      el.textContent = '0';
      io.observe(el);
    });

    // 3. Peak order choreography
    const order = rootRef.current.querySelector<HTMLElement>('#order');
    const stage = rootRef.current.querySelector<HTMLElement>('#orderStage');
    const steps = rootRef.current.querySelectorAll<HTMLElement>('#steps li');
    const stepsBox = rootRef.current.querySelector<HTMLElement>('#steps');
    const scr: Record<string, HTMLElement> = {};
    rootRef.current.querySelectorAll<HTMLElement>('#phone [data-scr]').forEach((el) => {
      if (el.dataset.scr) scr[el.dataset.scr] = el;
    });

    const hand = rootRef.current.querySelector<HTMLElement>('#phone .hand');
    const ring = rootRef.current.querySelector<HTMLElement>('#phone .ring');
    const pick = rootRef.current.querySelector<HTMLElement>('#pick');
    const qr = rootRef.current.querySelector<HTMLElement>('#qr');
    const bank = rootRef.current.querySelector<HTMLElement>('#bank');
    const bankAmt = rootRef.current.querySelector<HTMLElement>('#bankAmt');
    const bankWhen = rootRef.current.querySelector<HTMLElement>('#bankWhen');
    const mail = rootRef.current.querySelector<HTMLElement>('#mail');
    const svg = rootRef.current.querySelector<SVGElement>('#flow');
    const line = rootRef.current.querySelector<SVGPathElement>('#linePath');
    const ghost = rootRef.current.querySelector<SVGPathElement>('#ghostPath');
    const mid = rootRef.current.querySelector<HTMLElement>('#mid');
    const money = rootRef.current.querySelector<HTMLElement>('#money');

    function show(name: string) {
      for (const k in scr) {
        scr[k]?.classList.toggle('is-on', k === name);
      }
    }

    let raf = 0;
    function frame() {
      raf = 0;
      if (!order) return;
      const r = order.getBoundingClientRect();
      const vh = window.innerHeight;
      if (r.bottom < -vh || r.top > vh * 2) return;
      const p = clamp(-r.top / Math.max(1, r.height - vh));

      const idx = p < 0.2 ? 0 : p < 0.4 ? 1 : p < 0.56 ? 2 : p < 0.8 ? 3 : 4;
      steps.forEach((li, i) => {
        li.classList.toggle('is-on', i === idx);
        li.classList.toggle('is-done', i < idx);
      });
      if (stepsBox) {
        stepsBox.style.setProperty('--fill', String(clamp(p / 0.92)));
      }

      show(p < 0.2 ? 'profile' : p < 0.4 ? 'shop' : 'pay');

      // Hand movement to bio link
      const m = ease(clamp((p - 0.02) / 0.11));
      const tap = clamp((p - 0.13) / 0.06);
      if (!reduce && hand && ring) {
        hand.style.opacity = m > 0.01 ? '1' : '0';
        hand.style.transform = `translate(${(1 - m) * 100}px, ${(1 - m) * 180}px) rotate(${(1 - m) * 16}deg) scale(${tap > 0 && tap < 0.7 ? 0.84 : 1})`;
        ring.style.setProperty('--ro', String(tap > 0 && tap < 1 ? 1 - tap : 0));
        ring.style.setProperty('--rs', String(0.5 + tap * 1.1));
      }
      if (pick) {
        pick.classList.toggle('is-picked', p > 0.3);
      }

      // QR scan laser
      if (qr) {
        const scVal = clamp((p - 0.44) / 0.1);
        qr.style.setProperty('--scan', String(scVal));
        qr.style.setProperty('--scano', String(scVal > 0 && scVal < 1 ? 1 : 0));
      }

      // The signature move: Money travels from QR to bank card, bypassing the middleman
      const k = ease(clamp((p - 0.56) / 0.2));
      const wide = !narrow.matches;
      if (wide && stage && qr && bank && svg && ghost && line && mid && money) {
        const s = stage.getBoundingClientRect();
        const q = qr.getBoundingClientRect();
        const b = bank.getBoundingClientRect();
        const x0 = q.right - s.left + 6;
        const y0 = q.top + q.height / 2 - s.top;
        const x1 = b.left - s.left - 6;
        const y1 = b.top + b.height / 2 - s.top;
        const mx = (x0 + x1) / 2;
        const my = (y0 + y1) / 2;

        svg.setAttribute('viewBox', `0 0 ${s.width} ${s.height}`);
        ghost.setAttribute('d', `M${x0} ${y0} L${x1} ${y1}`);
        const dip = Math.max(120, (x1 - x0) * 0.55);
        line.setAttribute(
          'd',
          `M${x0} ${y0} C${x0 + (x1 - x0) * 0.25} ${my + dip}, ${x0 + (x1 - x0) * 0.75} ${my + dip}, ${x1} ${y1}`
        );
        const len = line.getTotalLength();
        line.style.strokeDasharray = String(len);
        line.style.strokeDashoffset = String(len * (1 - k));
        ghost.style.opacity = String(clamp((p - 0.5) / 0.05));
        mid.style.left = `${mx}px`;
        mid.style.top = `${my}px`;
        mid.style.opacity = String(clamp((p - 0.5) / 0.05));
        mid.style.setProperty('--strike', String(ease(clamp((p - 0.6) / 0.06))));

        const pt = line.getPointAtLength(len * k);
        money.style.opacity = k > 0.02 && k < 0.98 ? '1' : '0';
        money.style.transform = `translate(${pt.x - 46}px, ${pt.y - 16}px)`;
      }

      // Landing: bank balance ticks up, file reaches buyer
      const land = clamp((p - 0.76) / 0.06);
      if (bankAmt) bankAmt.textContent = `+${vnd(49000 * ease(land))}đ`;
      if (bankWhen) bankWhen.textContent = land > 0 ? 'vừa xong' : 'Chờ thanh toán';
      if (bank) bank.classList.toggle('is-hit', land >= 1);
      if (scr.pay) scr.pay.classList.toggle('is-paid', land >= 1);
      if (mail) mail.classList.toggle('is-on', p > 0.84);
    }

    function req() {
      if (!raf) raf = requestAnimationFrame(frame);
    }

    window.addEventListener('scroll', req, { passive: true });
    window.addEventListener('resize', req);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(req);
    }
    req();

    return () => {
      window.removeEventListener('scroll', req);
      window.removeEventListener('resize', req);
      if (raf) cancelAnimationFrame(raf);
      io.disconnect();
      sc?.destroy?.();
    };
  }, []);

  return (
    <div ref={rootRef} className='tiemnho-pro'>
      <span data-sc-progress />

      {/* 0 · Top Bar with Official Logo */}
      <header className='bar'>
        <div className='flex items-center gap-3'>
          <Logo size='md' href='/' showIconBadge={true} />
          <span className='hidden sm:inline-flex text-[10px] uppercase font-bold text-primary border border-primary/20 px-2.5 py-0.5 rounded-full bg-primary/5'>
            Creator Storefront
          </span>
        </div>

        <nav className='hidden md:flex items-center gap-6 text-sm font-semibold text-neutral-600 ml-auto mr-4'>
          <a href='#order' className='hover:text-primary transition-colors'>
            Tính năng
          </a>
          <a href='#pricing' className='hover:text-primary transition-colors'>
            Bảng giá
          </a>
          <Link
            href={`/@${handle}`}
            target='_blank'
            className='hover:text-primary text-neutral-700 transition-colors flex items-center gap-1.5'
          >
            Store mẫu (@{handle})
            <svg
              width='12'
              height='12'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
            >
              <path d='M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6' />
              <polyline points='15 3 21 3 21 9' />
              <line x1='10' y1='14' x2='21' y2='3' />
            </svg>
          </Link>
        </nav>

        <div className='flex items-center gap-2.5'>
          {userId ? (
            <Link className='cta cta--sm' href='/dashboard/overview'>
              Vào Dashboard
            </Link>
          ) : (
            <>
              <Link className='bar__login' href='/auth/sign-in'>
                Đăng nhập
              </Link>
              <Link className='cta cta--sm' href='/auth/sign-up'>
                Mở tiệm miễn phí
              </Link>
            </>
          )}
        </div>
      </header>

      <main id='top'>
        {/* 1 · Tin tưởng: Hero Section (Modern SaaS Split-Screen) */}
        <section className='hero' data-sc-act='flow' data-sc-drift='#F8FAFC'>
          <div className='hero__glow' aria-hidden='true' />

          <div className='hero__container'>
            {/* Cột trái: Tiêu đề, Mô tả, CTA & Bảo chứng */}
            <div className='hero__copy'>
              <div className='hero__badge'>
                <span className='hero__badge-dot' />
                <span>Nền tảng bán sản phẩm số cho Creator Việt</span>
              </div>

              <h1 className='hero__title'>
                <span className='hero__title-line'>
                  <span className='hero__title-inner'>Bán sản phẩm số</span>
                </span>
                <span className='hero__title-line'>
                  <span className='hero__title-inner hero__title-accent'>ngay từ link bio.</span>
                </span>
              </h1>

              <p className='hero__lede'>
                Một cửa tiệm của riêng bạn. Khách quét VietQR, tiền về thẳng tài khoản ngân hàng,
                file tự gửi tới email 24/7.
              </p>

              <div className='hero__actions'>
                <Link
                  className='cta cta--xl'
                  href={userId ? '/dashboard/overview' : '/auth/sign-up'}
                >
                  {userId ? 'Vào Dashboard của bạn' : 'Mở tiệm miễn phí'}
                  <svg viewBox='0 0 16 16' aria-hidden='true'>
                    <path
                      d='M3 8h10M9 4l4 4-4 4'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='1.8'
                    />
                  </svg>
                </Link>
                <Link href={`/@${handle}`} target='_blank' className='hero__store-btn'>
                  Ghé tiệm mẫu @{handle}
                  <svg
                    viewBox='0 0 16 16'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='1.6'
                    className='w-4 h-4'
                  >
                    <path d='M6 3h7v7M13 3L3 13' />
                  </svg>
                </Link>
              </div>

              {/* Điểm bảo chứng uy tín */}
              <div className='hero__trust'>
                <div className='hero__trust-item'>
                  <span className='hero__trust-check'>✓</span>
                  <span>0% hoa hồng</span>
                </div>
                <div className='hero__trust-item'>
                  <span className='hero__trust-check'>✓</span>
                  <span>Tiền về tài khoản tức thì</span>
                </div>
                <div className='hero__trust-item'>
                  <span className='hero__trust-check'>✓</span>
                  <span>Tự động bảo mật file</span>
                </div>
              </div>
            </div>

            {/* Cột phải: Khung Storefront Mockup thực tế + Chips giao dịch nổi */}
            <div className='hero__visual'>
              <div className='hero__showcase'>
                <div className='hero__showcase-glow' aria-hidden='true' />

                {/* Thẻ cửa tiệm điện thoại */}
                <div className='hero__phone' data-sc-tilt='5'>
                  {/* Header Creator */}
                  <div className='hero__phone-head'>
                    <div className='hero__phone-avatar'>
                      <img src={profile?.avatarUrl || '/landing/hero.jpg'} alt={creatorName} />
                    </div>
                    <div>
                      <div className='hero__phone-name'>
                        {creatorName}
                        <span className='hero__phone-badge' title='Đã xác minh'>
                          ✓
                        </span>
                      </div>
                      <div className='hero__phone-handle'>@{handle} · Creator Store</div>
                    </div>
                  </div>

                  <p className='hero__phone-bio'>
                    Chia sẻ Template Notion, Ebooks & hệ thống tổ chức cuộc sống cá nhân.
                  </p>

                  {/* Danh sách sản phẩm thực tế */}
                  <div className='hero__phone-products'>
                    <div className='hero__phone-item is-featured'>
                      <div className='hero__phone-thumb'>
                        <span>N</span>
                      </div>
                      <div className='hero__phone-meta'>
                        <div className='hero__phone-title'>PARA Life OS · Notion</div>
                        <div className='hero__phone-price'>149.000đ</div>
                      </div>
                      <span className='hero__phone-buy'>Mua ngay</span>
                    </div>

                    <div className='hero__phone-item'>
                      <div
                        className='hero__phone-thumb'
                        style={{ background: '#FEF3C7', color: '#D97706' }}
                      >
                        <span>PDF</span>
                      </div>
                      <div className='hero__phone-meta'>
                        <div className='hero__phone-title'>Ebook 7 bước đóng gói</div>
                        <div className='hero__phone-price' style={{ color: '#0E7A4A' }}>
                          Miễn phí (0đ)
                        </div>
                      </div>
                      <span className='hero__phone-buy'>Tải ngay</span>
                    </div>

                    <div className='hero__phone-item'>
                      <div
                        className='hero__phone-thumb'
                        style={{ background: '#EFF6FF', color: '#2563EB' }}
                      >
                        <span>LUT</span>
                      </div>
                      <div className='hero__phone-meta'>
                        <div className='hero__phone-title'>Bộ Preset ảnh Film 2025</div>
                        <div className='hero__phone-price'>99.000đ</div>
                      </div>
                      <span className='hero__phone-buy'>Mua ngay</span>
                    </div>
                  </div>
                </div>

                {/* Thẻ Chip 1: Bắn tiền về tài khoản MB Bank */}
                <div className='hero__chip hero__chip--money' data-sc-tilt='8'>
                  <div className='hero__chip-ic hero__chip-ic--green'>₫</div>
                  <div>
                    <div className='hero__chip-bold'>
                      +149.000đ <small>vừa về</small>
                    </div>
                    <div className='hero__chip-sub'>MB Bank · {creatorName.toUpperCase()}</div>
                  </div>
                </div>

                {/* Thẻ Chip 2: File email tự động */}
                <div className='hero__chip hero__chip--email' data-sc-tilt='8'>
                  <div className='hero__chip-ic hero__chip-ic--blue'>✓</div>
                  <div>
                    <div className='hero__chip-bold'>File đã gửi tới email khách</div>
                    <div className='hero__chip-sub'>huyen***@gmail.com · 2s trước</div>
                  </div>
                </div>

                {/* Thẻ Chip 3: 0% hoa hồng */}
                <div className='hero__chip hero__chip--zero' data-sc-tilt='8'>
                  <span className='hero__chip-pill'>0% phí giao dịch</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2 · Nhận ra: The Held Frame (Tension) */}
        <section
          className='tension'
          id='store'
          data-sc-act='pin'
          data-sc-span='3'
          data-sc-drift='#F1F5F9'
        >
          <div data-sc-stage>
            <div className='stage-in'>
              <div className='tension__img' aria-hidden='true'>
                <img src='/landing/studio.jpg' alt='' />
              </div>
              <div className='lines'>
                <p className='d-lg' data-sc-cue='0 0.28 0'>
                  Người xem đã sẵn sàng mua.
                </p>
                <p className='d-lg' data-sc-cue='0.24 0.52'>
                  Nhưng mỗi đơn là một chuỗi việc tay: kiểm tra chuyển khoản, gửi file, trả lời tin
                  nhắn.
                </p>
                <p className='d-lg' data-sc-cue='0.48 0.76'>
                  Bán qua sàn thì mỗi đơn bị trừ phí, còn sản phẩm số thường không có chỗ đứng.
                </p>
                <p className='d-lg' data-sc-cue='0.72 1 0.1 0.04' data-sc-kinetic='lines'>
                  <em>Tiệm Nhỏ gom tất cả về một đường link.</em>
                </p>
              </div>
              <div className='meter' aria-hidden='true'>
                <i />
              </div>
            </div>
          </div>
        </section>

        {/* 3 · Bừng sáng: Real Tiệm Nhỏ Storefront in Browser Mockup (Turn) */}
        <section className='turn' data-sc-act='flow' data-sc-drift='#F8FAFC'>
          <div className='turn__grid'>
            <div className='sc-stack' data-sc-in data-sc-stagger='70'>
              <span className='tag'>Giao diện Storefront Tiệm Nhỏ</span>
              <h2 className='d-lg'>
                Một đường link. <em>Một cửa tiệm hoàn chỉnh.</em>
              </h2>
              <p className='lede'>
                Ảnh đại diện, tích xanh verified, lời chào, sản phẩm số, giá và thanh toán VietQR.
                Mở mượt mà trong trình duyệt TikTok, khách không cần cài app.
              </p>
            </div>
            <figure style={{ margin: 0 }} data-sc-reveal='iris' data-sc-reveal-at='0.08 0.46'>
              <div className='browser' role='img' aria-label={`Gian hàng mẫu của ${creatorName}`}>
                <div className='browser__bar' aria-hidden='true'>
                  <i />
                  <i />
                  <i />
                  <span className='browser__url'>tiemnho.shop/@{handle}</span>
                </div>
                <div className='browser__page' aria-hidden='true'>
                  <div className='shop-h'>
                    <div
                      className='av'
                      style={{
                        backgroundImage: `url(${avatarUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <b style={{ fontSize: '1.25rem' }}>{creatorName}</b>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            background: '#0E7A4A',
                            color: '#fff',
                            fontSize: '10px',
                            fontWeight: 'bold'
                          }}
                        >
                          ✓
                        </span>
                      </div>
                      <span style={{ fontSize: '0.85rem', color: '#6A6B70' }}>
                        @{handle} • Creator Tiệm Nhỏ
                      </span>
                    </div>
                  </div>
                  <p className='shop-hi'>{creatorBio}</p>

                  <div className='shop-grid'>
                    <div className='pcard'>
                      <div
                        className='th'
                        style={{
                          background: 'linear-gradient(135deg, #1C2321, #2A3632)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between'
                        }}
                      >
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            letterSpacing: '0.06em',
                            color: '#7BE3A8'
                          }}
                        >
                          SẢN PHẨM SỐ
                        </span>
                        <span>PARA System</span>
                      </div>
                      <div className='bd'>
                        <div className='nm'>Kho Template Notion Quản Lý Cuộc Sống</div>
                        <div className='row'>
                          <span className='pr'>49.000đ</span>
                          <span className='bt'>Mua ngay</span>
                        </div>
                      </div>
                    </div>

                    <div className='pcard'>
                      <div
                        className='th'
                        style={{
                          background: 'linear-gradient(135deg, #2D2319, #423224)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between'
                        }}
                      >
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            letterSpacing: '0.06em',
                            color: '#FFBD2E'
                          }}
                        >
                          QUÀ TẶNG 0Đ
                        </span>
                        <span>Ebook Tải Về</span>
                      </div>
                      <div className='bd'>
                        <div className='nm'>Ebook: 7 Bước Thu Nhập $1,000 Đầu Tiên</div>
                        <div className='row'>
                          <span className='pr'>0đ</span>
                          <span
                            className='bt'
                            style={{ background: 'var(--sc-accent)', color: '#fff' }}
                          >
                            Nhận ngay
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className='pcard'>
                      <div
                        className='th'
                        style={{
                          background: 'linear-gradient(135deg, #1B212D, #273042)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between'
                        }}
                      >
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            letterSpacing: '0.06em',
                            color: '#60A5FA'
                          }}
                        >
                          HÀNG VẬT LÝ
                        </span>
                        <span>Sổ Tay & Bút</span>
                      </div>
                      <div className='bd'>
                        <div className='nm'>Sổ Tay 90 Ngày & Bút Ký Kim Loại</div>
                        <div className='row'>
                          <span className='pr'>189.000đ</span>
                          <span className='bt'>Đặt trước</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className='browser__foot'>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Logo size='sm' href='#' showIconBadge={true} />
                      <span style={{ fontSize: '11px', color: '#6A6B70' }}>
                        • Thanh toán VietQR Napas247 • Tự động 100%
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', color: '#6A6B70' }}>Storefront mẫu</span>
                  </div>
                </div>
              </div>
            </figure>
          </div>
        </section>

        {/* 4 · Thán phục: The Peak (One Order End-to-End Smartphone Mockup) */}
        <section
          className='order'
          id='order'
          data-sc-act='pin'
          data-sc-span='4.6'
          data-sc-drift='#F1F5F9'
        >
          <div data-sc-stage>
            <div className='stage-in' id='orderStage'>
              <div className='order__head'>
                <h2 className='d-md'>
                  Một đơn hàng, <em>từ lúc bấm đến lúc tiền về.</em>
                </h2>
                <span className='tag'>Hệ thống tự động 24/7</span>
              </div>

              <ol className='steps' id='steps'>
                <li>
                  Bấm link trong bio
                  <small>Người xem chạm vào tiemnho.shop/@{handle}</small>
                </li>
                <li>
                  Chọn sản phẩm
                  <small>Gian hàng mở ngay lập tức, không cần cài app</small>
                </li>
                <li>
                  Quét VietQR
                  <small>Đúng số tiền, đúng mã đơn hàng tự động</small>
                </li>
                <li>
                  Tiền về tài khoản bạn
                  <small>Thẳng tới ngân hàng của bạn, không qua ví trung gian</small>
                </li>
                <li>
                  File tự tới email khách
                  <small>Hệ thống tự động bàn giao, không phải gửi tay</small>
                </li>
              </ol>

              <div
                className='phone'
                id='phone'
                role='img'
                aria-label='Minh hoạ: hồ sơ TikTok mẫu, gian hàng, mã VietQR và xác nhận đã thanh toán.'
              >
                <div className='phone__screen' aria-hidden='true'>
                  <span className='notch' />

                  {/* Screen 1: TikTok Profile Screen */}
                  <div className='scr tt is-on' data-scr='profile'>
                    <div
                      className='av'
                      style={{
                        backgroundImage: `url(${avatarUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    />
                    <div className='nm'>@{handle}.creator</div>
                    <p className='bio'>
                      Xây dựng nguồn thu nhập thụ động từ sản phẩm số 🚀
                      <br />
                      <span className='link'>
                        tiemnho.shop/@{handle}
                        <span className='ring' />
                        <span className='hand'>
                          <svg viewBox='0 0 24 24'>
                            <path
                              d='M9 11V4.5a1.5 1.5 0 0 1 3 0V10h.5V8.5a1.5 1.5 0 0 1 3 0V10h.5V9.5a1.5 1.5 0 0 1 3 0V15c0 3.3-2.7 6-6 6h-1.2c-1.9 0-3.6-.9-4.7-2.4L3.6 14.3a1.5 1.5 0 0 1 2.3-1.9L9 15V11z'
                              fill='#fff'
                              stroke='#16171A'
                              strokeWidth='1.4'
                              strokeLinejoin='round'
                            />
                          </svg>
                        </span>
                      </span>
                    </p>
                    <div className='grid'>
                      <i />
                      <i />
                      <i />
                      <i />
                      <i />
                      <i />
                      <i />
                      <i />
                      <i />
                    </div>
                  </div>

                  {/* Screen 2: Real Tiệm Nhỏ Mobile Storefront */}
                  <div className='scr' data-scr='shop'>
                    <div className='mini'>
                      <div
                        className='av'
                        style={{
                          backgroundImage: `url(${avatarUrl})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}
                      />
                      <div>
                        <b>{creatorName}</b>
                        <span>tiemnho.shop/@{handle}</span>
                      </div>
                    </div>
                    <div className='sp' id='pick'>
                      <div
                        className='th'
                        style={{
                          background: 'linear-gradient(135deg, #1C2321, #2A3632)',
                          display: 'grid',
                          placeItems: 'center',
                          color: '#7BE3A8',
                          fontWeight: 'bold',
                          fontSize: '11px'
                        }}
                      >
                        NOTION
                      </div>
                      <div>
                        <div className='nm'>Kho Template Notion Quản Lý Chi Tiêu</div>
                        <div className='row'>
                          <span className='pr'>49.000đ</span>
                          <span className='bt'>Mua ngay</span>
                        </div>
                      </div>
                    </div>
                    <div className='sp'>
                      <div
                        className='th'
                        style={{
                          background: 'linear-gradient(135deg, #2D2319, #423224)',
                          display: 'grid',
                          placeItems: 'center',
                          color: '#FFBD2E',
                          fontWeight: 'bold',
                          fontSize: '11px'
                        }}
                      >
                        EBOOK
                      </div>
                      <div>
                        <div className='nm'>Ebook 7 Bước Thu Nhập $1,000</div>
                        <div className='row'>
                          <span className='pr'>0đ</span>
                          <span className='bt'>Nhận 0đ</span>
                        </div>
                      </div>
                    </div>
                    <div className='sp'>
                      <div
                        className='th'
                        style={{
                          background: 'linear-gradient(135deg, #1B212D, #273042)',
                          display: 'grid',
                          placeItems: 'center',
                          color: '#60A5FA',
                          fontWeight: 'bold',
                          fontSize: '11px'
                        }}
                      >
                        SỔ TAY
                      </div>
                      <div>
                        <div className='nm'>Sổ Tay 90 Ngày & Bút Ký Chữ Ký</div>
                        <div className='row'>
                          <span className='pr'>189.000đ</span>
                          <span className='bt'>Đặt trước</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Screen 3: Real Tiệm Nhỏ VietQR Checkout Screen */}
                  <div className='scr pay' data-scr='pay'>
                    <div className='t'>Quét mã VietQR Napas247</div>
                    <div className='s'>Template Notion Quản Lý Chi Tiêu</div>
                    <div className='qr' id='qr'>
                      <img src='/landing/qr-mau.svg' alt='' />
                    </div>
                    <div className='amt'>49.000đ</div>
                    <div className='memo' style={{ fontWeight: 600, color: '#16171A' }}>
                      {bankName}
                    </div>
                    <div className='memo' style={{ fontSize: '10.5px' }}>
                      STK: {bankAccountNumber} ({bankAccountName})
                    </div>
                    <div className='ok'>✓ Đã nhận thanh toán thành công</div>
                  </div>

                  <span className='demo'>Dữ liệu mô phỏng theo STK thực</span>
                </div>
              </div>

              {/* Real Bank Account & Email Delivery Cards */}
              <div className='side'>
                <div className='card card--bank' id='bank'>
                  <div className='top'>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: '#7BE3A8'
                        }}
                      />
                      <span style={{ fontWeight: 600, color: '#F2F0EC' }}>{bankName}</span>
                    </div>
                    <span id='bankWhen'>Chờ thanh toán</span>
                  </div>
                  <div className='bal'>
                    <span className='plus' id='bankAmt'>
                      +0đ
                    </span>
                  </div>
                  <div className='sub' style={{ fontSize: '12px', marginTop: '6px' }}>
                    Tài khoản: ****{bankAccountNumber.slice(-4)} ({bankAccountName})
                  </div>
                  <div
                    className='sub'
                    style={{ fontSize: '11px', color: '#7BE3A8', marginTop: '2px' }}
                  >
                    ✓ Tiền về thẳng 100%, 0% hoa hồng, không giữ tiền
                  </div>
                </div>

                <div className='card card--mail' id='mail'>
                  <div className='top'>
                    <span>Hộp thư khách hàng</span>
                    <span>vừa xong</span>
                  </div>
                  <div className='ttl' style={{ fontSize: '13px', lineHeight: 1.4 }}>
                    [Tiệm Nhỏ] Đơn hàng #DH001 của bạn đã sẵn sàng
                  </div>
                  <span className='file'>↓ Tải file · Notion-PARA-Template.zip (18.4 MB)</span>
                </div>
              </div>

              <svg className='flow' id='flow' aria-hidden='true'>
                <path className='flow__ghost' id='ghostPath' />
                <path className='flow__line' id='linePath' />
              </svg>
              <div className='mid' id='mid' aria-hidden='true'>
                <b>Sàn trung gian</b>trừ 15–30% phí mỗi đơn
              </div>
              <div className='money' id='money' aria-hidden='true'>
                +49.000đ
              </div>
              <p className='order__note'>
                Dòng tiền đi thẳng từ VietQR vào tài khoản ngân hàng của Creator.
              </p>
            </div>
          </div>
        </section>

        {/* 5 · Mở rộng: 7 Danh mục sản phẩm Tiệm Nhỏ */}
        <section className='range' data-sc-act='pan' data-sc-span='3.4' data-sc-drift='#F8FAFC'>
          <div data-sc-stage>
            <div className='rail' data-sc-pan='0.04'>
              <div className='rail__lead'>
                <span className='tag'>Hệ sinh thái sản phẩm Tiệm Nhỏ</span>
                <h2 className='d-lg'>
                  Bạn biết gì, <em>bán cái đó.</em>
                </h2>
                <p className='lede'>
                  Mỗi tài nguyên một trang riêng, giá riêng, file riêng. Khách quét VietQR là tự
                  động nhận file tức thì 24/7.
                </p>
              </div>

              <article className='k' style={{ '--n': 1 } as React.CSSProperties}>
                <div data-sc-tilt='6'>
                  <div
                    className='art'
                    style={
                      {
                        '--a': 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)'
                      } as React.CSSProperties
                    }
                  />
                  <div>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#059669',
                        textTransform: 'uppercase'
                      }}
                    >
                      Tài nguyên số
                    </span>
                    <h3 style={{ marginTop: '4px' }}>Template Notion</h3>
                    <p>Quản lý chi tiêu, kế hoạch học tập, lịch đăng bài, hệ thống PARA.</p>
                  </div>
                  <span className='ex'>Tự động gửi link nhân bản ngay sau thanh toán</span>
                </div>
              </article>

              <article className='k' style={{ '--n': 2 } as React.CSSProperties}>
                <div data-sc-tilt='6'>
                  <div
                    className='art'
                    style={
                      {
                        '--a': 'linear-gradient(135deg, #FFFBEB 0%, #FDE68A 100%)'
                      } as React.CSSProperties
                    }
                  />
                  <div>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#D97706',
                        textTransform: 'uppercase'
                      }}
                    >
                      Quà tặng 0đ (Lead Magnet)
                    </span>
                    <h3 style={{ marginTop: '4px' }}>Ebook & Cẩm nang</h3>
                    <p>Đóng gói câu trả lời bạn hay tư vấn inbox thành cẩm nang hoàn chỉnh.</p>
                  </div>
                  <span className='ex'>Tải file tức thì, thu thập Email & SĐT khách hàng</span>
                </div>
              </article>

              <article className='k' style={{ '--n': 3 } as React.CSSProperties}>
                <div data-sc-tilt='6'>
                  <div
                    className='art'
                    style={
                      {
                        '--a': 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)'
                      } as React.CSSProperties
                    }
                  />
                  <div>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: 'var(--sc-accent)',
                        textTransform: 'uppercase'
                      }}
                    >
                      Media & Design
                    </span>
                    <h3 style={{ marginTop: '4px' }}>Preset & LUTs Video</h3>
                    <p>Tông màu ảnh Lightroom, video LUTs CapCut/Premiere thịnh hành.</p>
                  </div>
                  <span className='ex'>Tự động gửi link tải file zip dung lượng lớn</span>
                </div>
              </article>

              <article className='k' style={{ '--n': 4 } as React.CSSProperties}>
                <div data-sc-tilt='6'>
                  <div
                    className='art'
                    style={
                      {
                        '--a': 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)'
                      } as React.CSSProperties
                    }
                  />
                  <div>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#16A34A',
                        textTransform: 'uppercase'
                      }}
                    >
                      Bảng tính chuyên nghiệp
                    </span>
                    <h3 style={{ marginTop: '4px' }}>Bảng tính Excel & Sheets</h3>
                    <p>Công thức dòng tiền, báo giá dịch vụ tự động người khác sẵn sàng mua.</p>
                  </div>
                  <span className='ex'>Google Sheets copy link hoặc file Excel đính kèm</span>
                </div>
              </article>

              <article className='k' style={{ '--n': 5 } as React.CSSProperties}>
                <div data-sc-tilt='6'>
                  <div
                    className='art'
                    style={
                      {
                        '--a': 'linear-gradient(135deg, #FAF5FF 0%, #EDE9FE 100%)'
                      } as React.CSSProperties
                    }
                  />
                  <div>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#7C3AED',
                        textTransform: 'uppercase'
                      }}
                    >
                      Khóa học & Video
                    </span>
                    <h3 style={{ marginTop: '4px' }}>Khoá học mini & Video</h3>
                    <p>Video bài giảng ngắn, tài liệu thực hành hoặc link vào nhóm kín.</p>
                  </div>
                  <span className='ex'>Bàn giao link bảo mật kèm mật khẩu xem</span>
                </div>
              </article>

              <article className='k' style={{ '--n': 6 } as React.CSSProperties}>
                <div data-sc-tilt='6'>
                  <div
                    className='art'
                    style={
                      {
                        '--a': 'linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 100%)'
                      } as React.CSSProperties
                    }
                  />
                  <div>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#DB2777',
                        textTransform: 'uppercase'
                      }}
                    >
                      Hàng vật lý (Physical)
                    </span>
                    <h3 style={{ marginTop: '4px' }}>Sách in & Đồ handmade</h3>
                    <p>Sách ký tặng, áo merch thương hiệu, sản phẩm thủ công số lượng giới hạn.</p>
                  </div>
                  <span className='ex'>Form nhập địa chỉ nhận hàng, xuất CSV gửi bưu điện</span>
                </div>
              </article>

              <article className='k' style={{ '--n': 7 } as React.CSSProperties}>
                <div data-sc-tilt='6'>
                  <div
                    className='art'
                    style={
                      {
                        '--a': 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)'
                      } as React.CSSProperties
                    }
                  />
                  <div>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#0284C7',
                        textTransform: 'uppercase'
                      }}
                    >
                      Nút chuyển hướng
                    </span>
                    <h3 style={{ marginTop: '4px' }}>Kênh ngoài & Affiliate</h3>
                    <p>Trỏ thẳng sang Shopee, TikTok Shop, kênh YouTube hoặc nhóm Zalo kín.</p>
                  </div>
                  <span className='ex'>Mở tab mới trực tiếp, tối ưu giữ chân traffic</span>
                </div>
              </article>

              <div className='rail__end'>
                <p className='d-md'>
                  Chưa thấy loại của bạn? <em>Gắn nút dẫn sang Zalo, Shopee hoặc Telegram.</em>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 6 · Yên tâm: Pricing Sheet */}
        <section className='pricing' id='pricing' data-sc-act='flow' data-sc-drift='#F1F5F9'>
          <div className='sheet' data-sc-reveal='up' data-sc-reveal-at='0.04 0.34'>
            <h2 className='d-lg'>
              Giá rõ ràng. <em>Không thu phần trăm.</em>
            </h2>
            <div className='plans' data-sc-in data-sc-stagger='80'>
              <div className='plan'>
                <span className='name'>Dùng thử</span>
                <div className='price'>
                  0đ<small>trong 14 ngày</small>
                </div>
                <ul>
                  <li className='hi'>0% hoa hồng trên mỗi đơn</li>
                  <li>Tối đa 3 sản phẩm</li>
                  <li>VietQR về thẳng tài khoản</li>
                  <li>File tự gửi tới email khách</li>
                </ul>
                <div className='pt-2'>
                  <Link
                    href={userId ? '/dashboard/overview' : '/auth/sign-up'}
                    className='cta cta--sm'
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    Bắt đầu dùng thử miễn phí
                  </Link>
                </div>
              </div>
              <div className='plan plan--pro'>
                <span className='name'>Creator Pro</span>
                <div className='price'>
                  <span data-vnd='99000'>99.000</span>đ<small>/tháng</small>
                </div>
                <span className='alt'>
                  hoặc <span data-vnd='990000'>990.000</span>đ/năm
                </span>
                <ul>
                  <li className='hi'>0% hoa hồng, mãi mãi</li>
                  <li>Không giới hạn sản phẩm</li>
                  <li>Xuất danh sách khách (CSV)</li>
                  <li>Tắt huy hiệu &quot;Powered by Tiệm Nhỏ&quot;</li>
                </ul>
                <div className='pt-2'>
                  <Link
                    href={userId ? '/dashboard/billing' : '/auth/sign-up'}
                    className='cta cta--sm'
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    Nâng cấp Creator Pro
                  </Link>
                </div>
              </div>
            </div>
            <p className='sheet__foot' data-sc-in>
              Bán 2 template 49.000đ là đủ phí tháng.
            </p>
          </div>
        </section>

        {/* 7 · Quyết định: Close & Spotlight */}
        <section
          className='close'
          id='mo-tiem'
          data-sc-act='pin'
          data-sc-span='1.2'
          data-sc-drift='#F8FAFC'
        >
          <div data-sc-stage data-sc-spotlight>
            <div className='stage-in'>
              <div className='close__in'>
                <h2 className='d-xl' data-sc-cue='0 1 0 0' data-sc-kinetic='lines'>
                  Link bio của bạn sắp thành <em>một cửa tiệm.</em>
                </h2>
                <Link
                  className='cta cta--xl'
                  href={userId ? '/dashboard/overview' : '/auth/sign-up'}
                  data-sc-magnet='0.28'
                  data-sc-cue='0 1 0 0'
                  data-sc-rise='0'
                >
                  {userId ? 'Vào Dashboard của bạn' : 'Mở tiệm miễn phí'}
                  <svg viewBox='0 0 16 16' aria-hidden='true'>
                    <path
                      d='M3 8h10M9 4l4 4-4 4'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='1.8'
                    />
                  </svg>
                </Link>
                <p className='small' data-sc-cue='0 1 0 0'>
                  Tiền về thẳng tài khoản ngân hàng của bạn. Không thu phần trăm.
                </p>
              </div>

              <footer className='foot'>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Logo size='sm' href='/' showIconBadge={true} />
                  <span style={{ fontSize: '12px', opacity: 0.6 }}>
                    • Nền tảng Bán Hàng Cho Creator Việt Nam
                  </span>
                </div>
                <nav aria-label='Chân trang'>
                  <a href='#order'>Quy trình đơn hàng</a>
                  <a href='#pricing'>Bảng giá SaaS</a>
                  <Link href={`/@${handle}`} target='_blank'>
                    Tiệm @{handle}
                  </Link>
                  <Link href={userId ? '/dashboard/overview' : '/auth/sign-in'}>
                    {userId ? 'Dashboard' : 'Đăng nhập'}
                  </Link>
                  <a href='https://zalo.me' target='_blank' rel='noopener noreferrer'>
                    Hỗ trợ Zalo
                  </a>
                </nav>
              </footer>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
