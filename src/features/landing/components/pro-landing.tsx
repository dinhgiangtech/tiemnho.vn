'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/common/logo';
import type { CreatorProfile, Product, PaymentConfig } from '@/constants/mock-tiemnho';
import { ScrollCraft } from '../lib/scrollcraft';
import '../styles/pro-landing.css';

interface ProLandingProps {
  userId?: string | null;
  storeHandle?: string;
}

export function ProLanding({ userId, storeHandle = 'annhien' }: ProLandingProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [showcaseTab, setShowcaseTab] = useState<'desktop' | 'mobile' | 'checkout' | 'detail'>(
    'desktop'
  );

  // Dữ liệu mẫu Internet Creator độc lập (Không dùng dữ liệu cá nhân của người dùng)
  const creatorName = 'An Nhiên';
  const handle = 'annhien';
  const creatorBio =
    'Chia sẻ Template Notion, Ebooks & hệ thống tổ chức cuộc sống và tài chính cá nhân.';
  const avatarUrl = '/landing/storefront/demo-avatar.jpg';
  const bankName = 'MB Bank';
  const bankAccountNumber = '999988886666';
  const bankAccountName = 'NGUYEN AN NHIEN';

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

      const idx = p < 0.22 ? 0 : p < 0.44 ? 1 : p < 0.65 ? 2 : p < 0.82 ? 3 : 4;
      steps.forEach((li, i) => {
        li.classList.toggle('is-on', i === idx);
        li.classList.toggle('is-done', i < idx);
      });
      if (stepsBox) {
        stepsBox.style.setProperty('--fill', String(clamp(p / 0.92)));
      }

      show(p < 0.22 ? 'shop' : p < 0.44 ? 'detail' : 'pay');

      // Hand tap choreography across screens
      if (!reduce && hand && ring) {
        if (p < 0.22) {
          const m = ease(clamp((p - 0.03) / 0.09));
          const tap = clamp((p - 0.12) / 0.06);
          hand.style.opacity = m > 0.01 ? '1' : '0';
          hand.style.transform = `translate(${(1 - m) * 60 + 50}px, ${(1 - m) * 80 + 72}px) rotate(${(1 - m) * 14}deg) scale(${tap > 0 && tap < 0.7 ? 0.85 : 1})`;
          ring.style.setProperty('--ro', String(tap > 0 && tap < 1 ? 1 - tap : 0));
          ring.style.setProperty('--rs', String(0.5 + tap * 1.1));
        } else if (p >= 0.22 && p < 0.44) {
          const m = ease(clamp((p - 0.24) / 0.09));
          const tap = clamp((p - 0.33) / 0.06);
          hand.style.opacity = m > 0.01 ? '1' : '0';
          hand.style.transform = `translate(${(1 - m) * 40}px, ${(1 - m) * 60 + 265}px) rotate(${(1 - m) * 10}deg) scale(${tap > 0 && tap < 0.7 ? 0.85 : 1})`;
          ring.style.setProperty('--ro', String(tap > 0 && tap < 1 ? 1 - tap : 0));
          ring.style.setProperty('--rs', String(0.5 + tap * 1.1));
        } else {
          hand.style.opacity = '0';
        }
      }
      if (pick) {
        pick.classList.toggle('is-picked', p > 0.13);
      }

      // QR scan laser
      if (qr) {
        const scVal = clamp((p - 0.45) / 0.14);
        qr.style.setProperty('--scan', String(scVal));
        qr.style.setProperty('--scano', String(scVal > 0 && scVal < 1 ? 1 : 0));
      }

      // The signature move: Money travels from QR to bank card, bypassing the middleman
      const k = ease(clamp((p - 0.62) / 0.18));
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
        ghost.style.opacity = String(clamp((p - 0.58) / 0.05));
        mid.style.left = `${mx}px`;
        mid.style.top = `${my}px`;
        mid.style.opacity = String(clamp((p - 0.58) / 0.05));
        mid.style.setProperty('--strike', String(ease(clamp((p - 0.64) / 0.06))));

        const pt = line.getPointAtLength(len * k);
        money.style.opacity = k > 0.02 && k < 0.98 ? '1' : '0';
        money.style.transform = `translate(${pt.x - 46}px, ${pt.y - 16}px)`;
      }

      // Landing: bank balance ticks up, file reaches buyer
      const land = clamp((p - 0.76) / 0.06);
      if (bankAmt) bankAmt.textContent = `+${vnd(149000 * ease(land))}đ`;
      if (bankWhen) bankWhen.textContent = land > 0 ? 'vừa xong' : 'Chờ thanh toán';
      if (bank) bank.classList.toggle('is-hit', land >= 1);
      if (scr.pay) scr.pay.classList.toggle('is-paid', land >= 1);
      if (mail) mail.classList.toggle('is-on', p > 0.82);
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
                      <img src='/landing/storefront/demo-avatar.jpg' alt={creatorName} />
                    </div>
                    <div>
                      <div className='hero__phone-name'>
                        {creatorName}
                        <span className='hero__phone-badge' title='Đã xác minh'>
                          ✓
                        </span>
                      </div>
                      <div className='hero__phone-handle'>@{handle} · Tiệm Nhỏ Store</div>
                    </div>
                  </div>

                  <p className='hero__phone-bio'>{creatorBio}</p>

                  {/* Danh sách sản phẩm thực tế */}
                  <div className='hero__phone-products'>
                    <div className='hero__phone-item is-featured'>
                      <div className='hero__phone-thumb'>
                        <img
                          src='/landing/storefront/demo-notion.jpg'
                          alt='PARA Life OS'
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            borderRadius: '6px'
                          }}
                        />
                      </div>
                      <div className='hero__phone-meta'>
                        <div className='hero__phone-title'>PARA Life OS · Notion</div>
                        <div className='hero__phone-price'>
                          149.000đ{' '}
                          <small
                            style={{
                              textDecoration: 'line-through',
                              opacity: 0.6,
                              fontSize: '10px'
                            }}
                          >
                            299.000đ
                          </small>
                        </div>
                      </div>
                      <span className='hero__phone-buy'>Mua ngay</span>
                    </div>

                    <div className='hero__phone-item'>
                      <div className='hero__phone-thumb'>
                        <img
                          src='/landing/storefront/demo-ebook.jpg'
                          alt='Ebook 7 bước đóng gói'
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            borderRadius: '6px'
                          }}
                        />
                      </div>
                      <div className='hero__phone-meta'>
                        <div className='hero__phone-title'>Ebook: 7 Bước Đóng Gói</div>
                        <div className='hero__phone-price' style={{ color: '#0E7A4A' }}>
                          Miễn phí (0đ)
                        </div>
                      </div>
                      <span className='hero__phone-buy' style={{ background: '#18181B' }}>
                        Tải ngay
                      </span>
                    </div>

                    <div className='hero__phone-item'>
                      <div className='hero__phone-thumb'>
                        <img
                          src='/landing/storefront/demo-preset.jpg'
                          alt='Preset Film 2026'
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            borderRadius: '6px'
                          }}
                        />
                      </div>
                      <div className='hero__phone-meta'>
                        <div className='hero__phone-title'>Bộ Preset Film 2026</div>
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
                    <div className='hero__chip-sub'>MB Bank · NGUYEN AN NHIEN</div>
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
          data-sc-span='1.4'
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

        {/* 4 · Thán phục: The Peak (One Order End-to-End Smartphone Mockup) */}
        <section
          className='order'
          id='order'
          data-sc-act='pin'
          data-sc-span='2.2'
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
                  Xem danh sách sản phẩm
                  <small>Người mua truy cập bio link tiemnho.shop/@{handle}</small>
                </li>
                <li>
                  Chọn sản phẩm & điền email
                  <small>Xem chi tiết, điền email nhận file tự động</small>
                </li>
                <li>
                  Quét VietQR tự động
                  <small>Đúng số tiền 149.000đ, đúng mã nội dung</small>
                </li>
                <li>
                  Tiền về tài khoản bạn
                  <small>Thẳng tới MB Bank trong 3s, 0% hoa hồng</small>
                </li>
                <li>
                  File tự tới email khách
                  <small>Hệ thống tự động bàn giao tức thì 24/7</small>
                </li>
              </ol>

              <div
                className='phone'
                id='phone'
                role='img'
                aria-label='Minh hoạ: danh sách sản phẩm, chọn sản phẩm, quét VietQR, nhận tiền và gửi file tự động.'
              >
                <div className='phone__screen' aria-hidden='true'>
                  <span className='notch' />

                  {/* MÀN 1: MÀN DANH SÁCH SẢN PHẨM (Bio Link Storefront) */}
                  <div className='scr is-on' data-scr='shop'>
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
                        <b>
                          {creatorName}{' '}
                          <span style={{ color: '#0D5CB6', fontSize: '11px' }}>✓</span>
                        </b>
                        <span>tiemnho.shop/@{handle}</span>
                      </div>
                    </div>

                    <div className='sp' id='pick'>
                      <div
                        className='th'
                        style={{
                          background: '#F1F5F9',
                          overflow: 'hidden',
                          padding: 0
                        }}
                      >
                        <img
                          src='/landing/storefront/demo-notion.jpg'
                          alt=''
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                      <div>
                        <div className='nm'>Kho Template Notion PARA Life OS</div>
                        <div className='row'>
                          <span className='pr'>149.000đ</span>
                          <span className='bt'>Mua ngay</span>
                        </div>
                      </div>
                    </div>

                    <div className='sp'>
                      <div
                        className='th'
                        style={{
                          background: '#F1F5F9',
                          overflow: 'hidden',
                          padding: 0
                        }}
                      >
                        <img
                          src='/landing/storefront/demo-ebook.jpg'
                          alt=''
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                      <div>
                        <div className='nm'>Ebook: 7 Bước Đóng Gói Sản Phẩm Số</div>
                        <div className='row'>
                          <span className='pr' style={{ color: '#0E7A4A' }}>
                            Miễn phí
                          </span>
                          <span className='bt' style={{ background: '#18181B' }}>
                            Nhận 0đ
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className='sp'>
                      <div
                        className='th'
                        style={{
                          background: '#F1F5F9',
                          overflow: 'hidden',
                          padding: 0
                        }}
                      >
                        <img
                          src='/landing/storefront/demo-preset.jpg'
                          alt=''
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                      <div>
                        <div className='nm'>Bộ Preset Lightroom Film 2026</div>
                        <div className='row'>
                          <span className='pr'>99.000đ</span>
                          <span className='bt'>Mua ngay</span>
                        </div>
                      </div>
                    </div>

                    <div className='hand' style={{ top: '158px', left: '200px' }}>
                      <svg viewBox='0 0 24 24'>
                        <path
                          d='M9 11V4.5a1.5 1.5 0 0 1 3 0V10h.5V8.5a1.5 1.5 0 0 1 3 0V10h.5V9.5a1.5 1.5 0 0 1 3 0V15c0 3.3-2.7 6-6 6h-1.2c-1.9 0-3.6-.9-4.7-2.4L3.6 14.3a1.5 1.5 0 0 1 2.3-1.9L9 15V11z'
                          fill='#fff'
                          stroke='#16171A'
                          strokeWidth='1.4'
                          strokeLinejoin='round'
                        />
                      </svg>
                    </div>
                    <div className='ring' style={{ top: '162px', left: '215px' }} />
                  </div>

                  {/* MÀN 2: CHỌN SẢN PHẨM & ĐIỀN THÔNG TIN (Product Detail & Order Form) */}
                  <div className='scr detail' data-scr='detail'>
                    <div className='scr-detail__nav'>
                      <span className='scr-detail__back'>‹ Quay lại tiệm</span>
                      <svg
                        viewBox='0 0 24 24'
                        width='13'
                        height='13'
                        fill='none'
                        stroke='#64748b'
                        strokeWidth='2'
                      >
                        <circle cx='18' cy='5' r='3' />
                        <circle cx='6' cy='12' r='3' />
                        <circle cx='18' cy='19' r='3' />
                        <line x1='8.59' y1='13.51' x2='15.42' y2='17.49' />
                        <line x1='15.41' y1='6.51' x2='8.59' y2='10.49' />
                      </svg>
                    </div>

                    <div className='scr-detail__hero'>
                      <span className='scr-detail__badge'>NỔI BẬT</span>
                      <img src='/landing/storefront/demo-notion.jpg' alt='' />
                    </div>

                    <div className='scr-detail__title'>Kho Template Notion PARA Life OS</div>
                    <div className='scr-detail__price-row'>
                      <span className='scr-detail__price'>149.000 đ</span>
                      <span className='scr-detail__price-old'>299.000 đ</span>
                    </div>

                    <div className='scr-detail__form'>
                      <div className='scr-detail__field'>
                        <span className='scr-detail__label'>Email nhận tài liệu *</span>
                        <input
                          type='text'
                          readOnly
                          defaultValue='khachhang@gmail.com'
                          className='scr-detail__input'
                        />
                      </div>
                      <div className='scr-detail__field'>
                        <span className='scr-detail__label'>Họ và tên *</span>
                        <input
                          type='text'
                          readOnly
                          defaultValue='Trần Văn An'
                          className='scr-detail__input'
                        />
                      </div>
                      <div className='scr-detail__btn' id='btnPay'>
                        Tiếp tục thanh toán 149.000đ →
                      </div>
                    </div>
                  </div>

                  {/* MÀN 3: QUÉT VIETQR (VietQR Checkout Modal) */}
                  <div className='scr pay' data-scr='pay'>
                    <div className='scr-pay__head'>
                      <span className='scr-pay__title'>Thanh toán VietQR</span>
                      <span className='scr-pay__timer'>⏱ 14:57</span>
                    </div>

                    <div className='scr-pay__qr' id='qr'>
                      <img src='/landing/qr-mau.svg' alt='' />
                    </div>

                    <div
                      className='amt'
                      style={{ fontSize: '18px', margin: '2px 0', fontWeight: 800 }}
                    >
                      149.000đ
                    </div>

                    <div className='scr-pay__bank-card'>
                      <div className='scr-pay__row'>
                        <span className='scr-pay__label'>Ngân hàng:</span>
                        <span className='scr-pay__val'>
                          {bankName} • {bankAccountName}
                        </span>
                      </div>
                      <div className='scr-pay__row'>
                        <span className='scr-pay__label'>STK:</span>
                        <span className='scr-pay__val' style={{ fontFamily: 'monospace' }}>
                          {bankAccountNumber}
                        </span>
                      </div>
                      <div className='scr-pay__memo-box'>
                        <div className='scr-pay__row'>
                          <span className='scr-pay__label' style={{ color: '#b45309' }}>
                            Nội dung CK:
                          </span>
                          <span className='scr-pay__memo-code'>TN10826</span>
                        </div>
                      </div>
                    </div>

                    <div className='ok'>✓ Đã nhận thanh toán thành công</div>
                  </div>

                  <span className='demo'>Dữ liệu mô phỏng thanh toán thật</span>
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
                      <span style={{ fontWeight: 600, color: '#F2F0EC' }}>MB Bank</span>
                    </div>
                    <span id='bankWhen'>Chờ thanh toán</span>
                  </div>
                  <div className='bal'>
                    <span className='plus' id='bankAmt'>
                      +0đ
                    </span>
                  </div>
                  <div className='sub' style={{ fontSize: '12px', marginTop: '6px' }}>
                    Tài khoản: ****6666 (NGUYEN AN NHIEN)
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
                    [Tiệm Nhỏ] Đơn hàng #TN10826 của bạn đã sẵn sàng
                  </div>
                  <span className='file'>↓ Tải file · Notion-PARA-Life-OS.zip (18.4 MB)</span>
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
                +149.000đ
              </div>
              <p className='order__note'>
                Dòng tiền đi thẳng từ VietQR vào tài khoản ngân hàng của Creator.
              </p>
            </div>
          </div>
        </section>

        {/* 5 · Mở rộng: 7 Danh mục sản phẩm Tiệm Nhỏ */}
        <section className='range' data-sc-act='pan' data-sc-span='1.8' data-sc-drift='#F8FAFC'>
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
                  <div className='art'>
                    <img src='/landing/products/notion.jpg' alt='Template Notion' />
                    <div className='art-overlay' />
                  </div>
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
                  <div className='art'>
                    <img src='/landing/products/ebook.jpg' alt='Ebook & Cẩm nang' />
                    <div className='art-overlay' />
                  </div>
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
                  <div className='art'>
                    <img src='/landing/products/preset.jpg' alt='Preset & LUTs Video' />
                    <div className='art-overlay' />
                  </div>
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
                  <div className='art'>
                    <img src='/landing/products/sheets.jpg' alt='Bảng tính Excel & Sheets' />
                    <div className='art-overlay' />
                  </div>
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
                  <div className='art'>
                    <img src='/landing/products/course.jpg' alt='Khoá học mini & Video' />
                    <div className='art-overlay' />
                  </div>
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
                  <div className='art'>
                    <img src='/landing/products/physical.jpg' alt='Sách in & Đồ handmade' />
                    <div className='art-overlay' />
                  </div>
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
                  <div className='art'>
                    <img src='/landing/products/affiliate.jpg' alt='Kênh ngoài & Affiliate' />
                    <div className='art-overlay' />
                  </div>
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

        {/* Footer */}
        <footer className='landing-footer'>
          <div className='landing-footer__wrap'>
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
          </div>
        </footer>
      </main>
    </div>
  );
}
