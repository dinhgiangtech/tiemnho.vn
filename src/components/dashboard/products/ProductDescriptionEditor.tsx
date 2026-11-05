'use client';

import * as React from 'react';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bold,
  Italic,
  Strikethrough,
  Heading2,
  List,
  CheckSquare,
  Link2,
  Minus,
  Sparkles,
  Eye,
  Edit3,
  ExternalLink
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface ProductDescriptionEditorProps {
  value: string;
  onChange: (value: string) => void;
  productTitle?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  label?: string;
  minRows?: number;
}

export function ProductDescriptionEditor({
  value,
  onChange,
  productTitle = 'Sản phẩm mới',
  placeholder = 'Mô tả chi tiết giá trị, checklist nội dung khách sẽ nhận được (hỗ trợ gạch đầu dòng, dấu tick ✅, in đậm, chèn link...). Hỗ trợ xuống dòng tự nhiên.',
  error,
  required = true,
  label = 'Mô tả chi tiết sản phẩm (Description)',
  minRows = 8
}: ProductDescriptionEditorProps) {
  const [activeTab, setActiveTab] = React.useState<'write' | 'preview'>('write');
  const [isAiModalOpen, setIsAiModalOpen] = React.useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = React.useState(false);
  const [linkText, setLinkText] = React.useState('');
  const [linkUrl, setLinkUrl] = React.useState('');
  const [selectedAiTemplate, setSelectedAiTemplate] = React.useState<number>(0);

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Thống kê ký tự và từ
  const wordCount = React.useMemo(() => {
    const text = (value || '').trim();
    return text ? text.split(/\s+/).length : 0;
  }, [value]);

  const charCount = (value || '').length;

  // Helper áp dụng định dạng bọc quanh đoạn chọn (Selection Wrap)
  const applyFormatting = React.useCallback(
    (prefix: string, suffix: string, defaultPlaceholder = '') => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentVal = value || '';
      const selected = currentVal.substring(start, end);

      const insertion = selected || defaultPlaceholder;
      const newVal =
        currentVal.substring(0, start) + prefix + insertion + suffix + currentVal.substring(end);

      onChange(newVal);

      // Cập nhật vị trí con trỏ sau khi render
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          if (selected) {
            textareaRef.current.setSelectionRange(start + prefix.length, end + prefix.length);
          } else {
            textareaRef.current.setSelectionRange(
              start + prefix.length,
              start + prefix.length + insertion.length
            );
          }
        }
      });
    },
    [value, onChange]
  );

  // Helper chèn tiền tố vào dòng hiện tại (Heading, List, Quote)
  const toggleLinePrefix = React.useCallback(
    (prefix: string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentVal = value || '';

      // Tìm vị trí bắt đầu của dòng
      const lineStart = currentVal.lastIndexOf('\n', start - 1) + 1;
      const lineEnd = currentVal.indexOf('\n', end);
      const actualLineEnd = lineEnd === -1 ? currentVal.length : lineEnd;

      const lineContent = currentVal.substring(lineStart, actualLineEnd);

      let newLineContent: string;
      if (lineContent.startsWith(prefix)) {
        // Gỡ bỏ prefix nếu đã có
        newLineContent = lineContent.substring(prefix.length);
      } else {
        newLineContent = prefix + lineContent;
      }

      const newVal =
        currentVal.substring(0, lineStart) + newLineContent + currentVal.substring(actualLineEnd);

      onChange(newVal);

      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          const offset = newLineContent.length - lineContent.length;
          textareaRef.current.setSelectionRange(start + offset, end + offset);
        }
      });
    },
    [value, onChange]
  );

  // Helper chèn chuỗi ký tự / snippet tại vị trí con trỏ
  const insertAtCursor = React.useCallback(
    (textToInsert: string) => {
      const textarea = textareaRef.current;
      if (!textarea) {
        onChange((value || '') + textToInsert);
        return;
      }

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentVal = value || '';

      const newVal = currentVal.substring(0, start) + textToInsert + currentVal.substring(end);
      onChange(newVal);

      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          const newPos = start + textToInsert.length;
          textareaRef.current.setSelectionRange(newPos, newPos);
        }
      });
    },
    [value, onChange]
  );

  // Xử lý mở dialog chèn link
  const handleOpenLinkDialog = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      const selected = (value || '').substring(textarea.selectionStart, textarea.selectionEnd);
      setLinkText(selected);
      setLinkUrl('');
    }
    setIsLinkModalOpen(true);
  };

  const handleConfirmLink = () => {
    if (!linkUrl.trim()) {
      toast.error('Vui lòng nhập đường dẫn URL');
      return;
    }
    const label = linkText.trim() || 'Xem liên kết';
    const formattedLink = `[${label}](${linkUrl.trim()})`;
    insertAtCursor(formattedLink);
    setIsLinkModalOpen(false);
    toast.success('Đã chèn liên kết');
  };

  // Danh sách mẫu mô tả AI
  const AI_TEMPLATES = [
    {
      id: 'aida',
      title: '🎯 Công thức AIDA chuẩn chuyển đổi cao',
      desc: 'Gây chú ý, khơi gợi nhu cầu, liệt kê 5 quyền lợi cốt lõi và kêu gọi thanh toán tức thì.',
      generate: (title: string) =>
        `🚀 Bạn đang tìm kiếm giải pháp tối ưu cho: **${title}**?\n\n` +
        `Đây là bộ giải pháp được thiết kế tinh gọn, giúp bạn tiết kiệm hàng chục giờ mày mò và áp dụng được ngay lập tức.\n\n` +
        `### 💎 Quyền lợi vượt trội khi sở hữu:\n` +
        `✅ Truy cập toàn bộ file gốc và tài liệu hướng dẫn chi tiết từng bước.\n` +
        `✅ Thiết kế chuẩn hóa, sẵn sàng tùy biến và sử dụng ngay không cần kỹ năng phức tạp.\n` +
        `✅ Cập nhật trọn đời hoàn toàn miễn phí khi có phiên bản mới.\n` +
        `✅ Nhận quyền tham gia nhóm trao đổi độc quyền cùng tác giả.\n` +
        `✅ Tiết kiệm tối đa thời gian & công sức thử sai.\n\n` +
        `> 💡 **Cam kết chất lượng:** Hàng được gửi tự động qua email & link tải tức thì ngay sau khi bạn quét mã VietQR thành công 24/7.\n\n` +
        `⚡ Đừng bỏ lỡ cơ hội nâng cấp kỹ năng ngay hôm nay!`
    },
    {
      id: 'checklist',
      title: '✅ Dàn ý Checklist Quyền lợi chi tiết',
      desc: 'Tập trung làm nổi bật những gì khách hàng sẽ nhận được sau khi thanh toán thành công.',
      generate: (title: string) =>
        `### 📦 Nội dung trọn bộ ${title} bao gồm:\n\n` +
        `✅ 01 File tài liệu / Template chính thức (Bản quyền trọn đời).\n` +
        `✅ Video / Tài liệu hướng dẫn sử dụng nhanh trong 10 phút.\n` +
        `✅ Bộ checklist các bước thực hành & áp dụng thực tế.\n` +
        `✅ File bài tập / Ví dụ mẫu trực quan dễ hiểu.\n` +
        `✅ Hỗ trợ giải đáp thắc mắc 1:1 qua Zalo khi cần trợ giúp.\n\n` +
        `> ⚡ **Nhận file siêu tốc:** Hệ thống tự động gửi link Google Drive tốc độ cao chỉ sau 3 giây thanh toán.`
    },
    {
      id: 'bonus',
      title: '🎁 Combo Quà tặng 0đ & Bảo đảm',
      desc: 'Tăng giá trị cảm nhận với các gói quà tặng bổ sung đi kèm sản phẩm.',
      generate: (title: string) =>
        `### ✨ Đặc quyền quà tặng kèm (Trị giá 500.000đ - Tặng 0đ hôm nay):\n\n` +
        `🎁 **Bonus #1:** Ebook cẩm nang kinh nghiệm & mẹo áp dụng nhanh.\n` +
        `🎁 **Bonus #2:** Bộ công cụ bổ trợ nâng cao hiệu suất làm việc x2.\n` +
        `🎁 **Bonus #3:** Lời mời tham gia cộng đồng kín thảo luận & chia sẻ kinh nghiệm.\n\n` +
        `### 🛡️ Chính sách hỗ trợ & Cam kết:\n` +
        `• Hỗ trợ kích hoạt và tải tài nguyên vĩnh viễn.\n` +
        `• Sẵn sàng đồng hành và giải đáp thắc mắc nếu gặp khó khăn trong quá trình sử dụng.`
    },
    {
      id: 'instructions',
      title: '⚡ Hướng dẫn thanh toán & Nhận hàng tự động',
      desc: 'Giải thích rõ ràng quy trình nhận hàng tự động qua VietQR 24/7.',
      generate: (title: string) =>
        `### 🚀 3 Bước đơn giản để nhận ${title}:\n\n` +
        `1. Nhấn nút **MUA NGAY** bên dưới để mở mã thanh toán VietQR.\n` +
        `2. Dùng App ngân hàng bất kỳ quét mã QR (Hệ thống tự điền số tiền và nội dung chuyển khoản).\n` +
        `3. Giao dịch thành công, màn hình sẽ hiển thị link tải trực tiếp và gửi email sao lưu đến bạn ngay lập tức!\n\n` +
        `> 💡 **Lưu ý:** Vui lòng giữ nguyên nội dung chuyển khoản để hệ thống kích hoạt tự động 24/7 trong 3 giây.`
    }
  ];

  const handleApplyAiTemplate = (mode: 'replace' | 'append') => {
    const template = AI_TEMPLATES[selectedAiTemplate];
    const generated = template.generate(productTitle || 'Sản phẩm số');

    if (mode === 'replace') {
      onChange(generated);
      toast.success('Đã thay thế toàn bộ mô tả bằng nội dung AI!');
    } else {
      const current = value || '';
      onChange(current + (current ? '\n\n' : '') + generated);
      toast.success('Đã thêm nội dung AI vào mô tả!');
    }

    setIsAiModalOpen(false);
  };

  // Parser hiển thị mô tả định dạng (Markdown / Checklist / Bullet / Callout / Headings)
  const renderFormattedPreview = (text?: string) => {
    if (!text || !text.trim()) {
      return (
        <div className='flex flex-col items-center justify-center py-12 px-4 text-center text-muted-foreground'>
          <div className='w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center mb-3 text-muted-foreground/60'>
            <Icons.edit className='w-6 h-6' />
          </div>
          <p className='text-sm font-semibold text-foreground'>Chưa có nội dung mô tả</p>
          <p className='text-xs text-muted-foreground max-w-sm mt-1 leading-relaxed'>
            Hãy soạn thảo ở tab <strong>&ldquo;Soạn thảo&rdquo;</strong> hoặc dùng{' '}
            <strong>&ldquo;Trợ lý AI&rdquo;</strong> để xem trước cách khách hàng nhìn thấy sản phẩm
            trên gian hàng của bạn.
          </p>
        </div>
      );
    }

    const lines = text.split('\n');

    return (
      <div className='space-y-2 text-sm text-foreground/90 leading-relaxed font-sans'>
        {lines.map((rawLine, idx) => {
          const trimmed = rawLine.trim();

          // Dòng trống
          if (!trimmed) {
            return <div key={idx} className='h-2' />;
          }

          // Phân cách ngang ---
          if (trimmed === '---' || trimmed === '***') {
            return <hr key={idx} className='my-3 border-border/60' />;
          }

          // Tiêu đề H1 / H2 / H3
          if (trimmed.startsWith('### ')) {
            return (
              <h3
                key={idx}
                className='text-base font-bold text-foreground tracking-tight pt-2 pb-1 border-b border-border/40'
              >
                {formatInline(trimmed.substring(4))}
              </h3>
            );
          }
          if (trimmed.startsWith('## ')) {
            return (
              <h2
                key={idx}
                className='text-lg font-bold text-foreground tracking-tight pt-2.5 pb-1 border-b border-border/40'
              >
                {formatInline(trimmed.substring(3))}
              </h2>
            );
          }
          if (trimmed.startsWith('# ')) {
            return (
              <h1
                key={idx}
                className='text-xl font-extrabold text-foreground tracking-tight pt-3 pb-1 border-b border-border/40'
              >
                {formatInline(trimmed.substring(2))}
              </h1>
            );
          }

          // Callout blockquote > 💡
          if (trimmed.startsWith('>')) {
            const quoteContent = trimmed.replace(/^>\s*/, '');
            return (
              <div
                key={idx}
                className='my-2 p-3.5 rounded-xl border border-primary/20 bg-primary/5 text-foreground/90 text-xs sm:text-sm font-medium leading-relaxed'
              >
                {formatInline(quoteContent)}
              </div>
            );
          }

          // Checklist tick xanh ✅ hoặc [x]
          if (trimmed.startsWith('✅') || trimmed.startsWith('[x]')) {
            const content = trimmed.replace(/^✅\s*|^\[x\]\s*/, '');
            return (
              <div key={idx} className='flex items-start gap-2.5 text-foreground py-0.5'>
                <span className='text-emerald-500 shrink-0 text-base leading-none mt-0.5'>✅</span>
                <span className='font-medium'>{formatInline(content)}</span>
              </div>
            );
          }

          // Bullet points • hoặc - hoặc *
          if (trimmed.startsWith('•') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            const content = trimmed.replace(/^[•\-\*]\s*/, '');
            return (
              <div key={idx} className='flex items-start gap-2.5 text-foreground/90 py-0.5'>
                <span className='text-primary font-bold text-base shrink-0 leading-none mt-0.5'>
                  •
                </span>
                <span>{formatInline(content)}</span>
              </div>
            );
          }

          // Numbered list 1. 2.
          const numberMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
          if (numberMatch) {
            return (
              <div key={idx} className='flex items-start gap-2 text-foreground/90 py-0.5'>
                <span className='font-bold text-primary text-xs shrink-0 mt-0.5'>
                  {numberMatch[1]}.
                </span>
                <span>{formatInline(numberMatch[2])}</span>
              </div>
            );
          }

          // Dòng văn bản bình thường
          return (
            <p key={idx} className='leading-relaxed text-foreground/85'>
              {formatInline(rawLine)}
            </p>
          );
        })}
      </div>
    );
  };

  // Helper định dạng inline: **in đậm**, *in nghiêng*, [link](url), <u>gạch chân</u>
  const formatInline = (text: string) => {
    // Tách các token cơ bản
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let keyIdx = 0;

    // Pattern đơn giản cho **bold**, *italic*, [link](url), <u>underline</u>
    const inlineRegex =
      /(\*\*([^*]+)\*\*|\*([^*]+)\*|\[([^\]]+)\]\(([^)]+)\)|<u>(.*?)<\/u>|==(.*?)==)/g;

    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = inlineRegex.exec(text)) !== null) {
      // Đẩy text trước match
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      const [full, , bold, italic, linkLabel, linkHref, underline, highlight] = match;

      if (bold) {
        parts.push(
          <strong key={keyIdx++} className='font-bold text-foreground'>
            {bold}
          </strong>
        );
      } else if (italic) {
        parts.push(
          <em key={keyIdx++} className='italic'>
            {italic}
          </em>
        );
      } else if (linkLabel && linkHref) {
        parts.push(
          <a
            key={keyIdx++}
            href={linkHref}
            target='_blank'
            rel='noopener noreferrer'
            className='text-primary underline underline-offset-2 hover:opacity-80 inline-flex items-center gap-0.5 font-medium'
          >
            <span>{linkLabel}</span>
            <Icons.externalLink className='w-3 h-3 inline' />
          </a>
        );
      } else if (underline) {
        parts.push(
          <span key={keyIdx++} className='underline underline-offset-2'>
            {underline}
          </span>
        );
      } else if (highlight) {
        parts.push(
          <span
            key={keyIdx++}
            className='bg-amber-500/20 text-amber-900 dark:text-amber-200 px-1 py-0.5 rounded-sm font-semibold'
          >
            {highlight}
          </span>
        );
      } else {
        parts.push(full);
      }

      lastIndex = inlineRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  return (
    <div className='space-y-2'>
      {/* 1. Header: Nhãn & Nút chuyển đổi chế độ xem */}
      <div className='flex flex-wrap items-center justify-between gap-2 mb-2'>
        <label className='text-sm font-bold text-neutral-900 dark:text-white'>
          {label} {required && <span className='text-[#FE2C55]'>*</span>}
        </label>

        {/* Tab Switcher: Soạn thảo / Xem trước */}
        <div className='flex items-center p-0.5 rounded-lg bg-muted border border-border/60 text-xs'>
          <button
            type='button'
            onClick={() => setActiveTab('write')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'write'
                ? 'bg-background text-foreground shadow-2xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Edit3 className='w-3.5 h-3.5' />
            <span>Soạn thảo</span>
          </button>
          <button
            type='button'
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'preview'
                ? 'bg-background text-foreground shadow-2xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Eye className='w-3.5 h-3.5' />
            <span>Xem trước</span>
          </button>
        </div>
      </div>

      {/* 2. Khung soạn thảo / Xem trước */}
      <div className='rounded-2xl border border-border bg-card shadow-xs overflow-hidden focus-within:ring-2 focus-within:ring-primary/25 focus-within:border-primary transition-all'>
        {/* THANH CÔNG CỤ SOẠN THẢO (Chỉ hiện khi ở tab write) */}
        {activeTab === 'write' && (
          <div className='flex flex-wrap items-center justify-between gap-1.5 p-2 bg-muted/40 border-b border-border/60 text-muted-foreground'>
            {/* Nhóm công cụ định dạng chuẩn Lucide */}
            <div className='flex flex-wrap items-center gap-0.5'>
              <button
                type='button'
                onClick={() => applyFormatting('**', '**', 'Nội dung in đậm')}
                className='p-1.5 rounded-lg hover:bg-muted hover:text-foreground cursor-pointer transition-colors'
                title='In đậm (**văn bản**)'
              >
                <Bold className='w-3.5 h-3.5' />
              </button>
              <button
                type='button'
                onClick={() => applyFormatting('*', '*', 'Nội dung in nghiêng')}
                className='p-1.5 rounded-lg hover:bg-muted hover:text-foreground cursor-pointer transition-colors'
                title='In nghiêng (*văn bản*)'
              >
                <Italic className='w-3.5 h-3.5' />
              </button>
              <button
                type='button'
                onClick={() => applyFormatting('~~', '~~', 'Gạch ngang')}
                className='p-1.5 rounded-lg hover:bg-muted hover:text-foreground cursor-pointer transition-colors'
                title='Gạch ngang (~~văn bản~~)'
              >
                <Strikethrough className='w-3.5 h-3.5' />
              </button>
              <button
                type='button'
                onClick={() => toggleLinePrefix('### ')}
                className='p-1.5 rounded-lg hover:bg-muted hover:text-foreground cursor-pointer transition-colors'
                title='Tiêu đề mục (### Tiêu đề)'
              >
                <Heading2 className='w-3.5 h-3.5' />
              </button>

              <div className='h-4 w-px bg-border mx-1' />

              <button
                type='button'
                onClick={() => toggleLinePrefix('• ')}
                className='p-1.5 rounded-lg hover:bg-muted hover:text-foreground cursor-pointer transition-colors'
                title='Danh sách gạch đầu dòng (• Mục)'
              >
                <List className='w-3.5 h-3.5' />
              </button>
              <button
                type='button'
                onClick={() => insertAtCursor('\n✅ ')}
                className='p-1.5 rounded-lg hover:bg-muted hover:text-foreground cursor-pointer transition-colors'
                title='Danh sách checklist (✅ Mục)'
              >
                <CheckSquare className='w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400' />
              </button>

              <div className='h-4 w-px bg-border mx-1' />

              <button
                type='button'
                onClick={handleOpenLinkDialog}
                className='p-1.5 rounded-lg hover:bg-muted hover:text-foreground cursor-pointer transition-colors'
                title='Chèn liên kết web ([Tiêu đề](https://...))'
              >
                <Link2 className='w-3.5 h-3.5' />
              </button>
              <button
                type='button'
                onClick={() => insertAtCursor('\n\n---\n\n')}
                className='p-1.5 rounded-lg hover:bg-muted hover:text-foreground cursor-pointer transition-colors'
                title='Chèn đường phân cách ngang'
              >
                <Minus className='w-3.5 h-3.5' />
              </button>
            </div>

            {/* Nút Trợ lý AI ở góc trên bên phải toolbar */}
            <button
              type='button'
              onClick={() => setIsAiModalOpen(true)}
              className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-linear-to-r from-primary/10 via-rose-500/10 to-amber-500/10 border border-primary/25 text-primary text-xs font-bold hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-2xs ml-auto'
              title='Tạo dàn ý mô tả tự động bằng AI'
            >
              <Sparkles className='w-3.5 h-3.5 text-primary animate-pulse' />
              <span>Trợ lý AI</span>
            </button>
          </div>
        )}

        {/* NỘI DUNG: SOẠN THẢO HOẶC XEM TRƯỚC */}
        {activeTab === 'write' ? (
          <div>
            <textarea
              ref={textareaRef}
              rows={minRows}
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className='w-full p-4 bg-background text-foreground text-xs sm:text-sm font-sans leading-relaxed border-0 outline-none resize-y min-h-[160px] focus:ring-0 focus:outline-none placeholder:text-muted-foreground/60'
            />

            {/* Thanh snippet chèn nhanh dưới chân textarea */}
            <div className='flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 bg-muted/20 border-t border-border/50 text-[11px] text-muted-foreground'>
              <div className='flex flex-wrap items-center gap-1.5'>
                <span className='font-medium text-foreground/70 shrink-0'>Chèn mẫu nhanh:</span>
                <button
                  type='button'
                  onClick={() => insertAtCursor('\n### 💎 Quyền lợi vượt trội:\n✅ ')}
                  className='px-2.5 py-0.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground cursor-pointer transition-colors border border-border/60 text-xs font-medium'
                >
                  + Quyền lợi
                </button>
                <button
                  type='button'
                  onClick={() => insertAtCursor('\n### 📦 Nội dung bao gồm:\n✅ ')}
                  className='px-2.5 py-0.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground cursor-pointer transition-colors border border-border/60 text-xs font-medium'
                >
                  + Nội dung bao gồm
                </button>
                <button
                  type='button'
                  onClick={() => insertAtCursor('\n> 💡 **Lưu ý quan trọng:** ')}
                  className='px-2.5 py-0.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground cursor-pointer transition-colors border border-border/60 text-xs font-medium'
                >
                  + Lưu ý
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className='p-5 min-h-[220px] bg-background max-h-[460px] overflow-y-auto overscroll-contain'>
            <div className='mb-3 flex items-center justify-between pb-2 border-b border-border/60 text-xs text-muted-foreground'>
              <span className='font-medium'>Xem trước giao diện bài viết chi tiết:</span>
            </div>
            {renderFormattedPreview(value)}
          </div>
        )}
      </div>

      {/* Thông báo lỗi validation */}
      {error && <p className='text-xs text-destructive font-medium'>{error}</p>}

      {/* 3. DIALOG: Trợ lý AI viết mô tả */}
      <Dialog open={isAiModalOpen} onOpenChange={setIsAiModalOpen}>
        <DialogContent className='max-w-xl p-6 rounded-2xl'>
          <DialogHeader className='space-y-1 text-left'>
            <div className='flex items-center gap-2'>
              <div className='h-8 w-8 rounded-xl bg-linear-to-tr from-primary to-rose-500 text-white flex items-center justify-center shrink-0 shadow-xs'>
                <Icons.sparkles className='h-4 w-4' />
              </div>
              <div>
                <DialogTitle className='text-base font-bold text-foreground'>
                  Trợ lý AI gợi ý bản thảo mô tả
                </DialogTitle>
                <DialogDescription className='text-xs text-muted-foreground'>
                  Chọn mẫu kịch bản bán hàng phù hợp cho:{' '}
                  <strong>&ldquo;{productTitle}&rdquo;</strong>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className='space-y-3 py-2'>
            <div className='grid grid-cols-1 gap-2.5 max-h-[320px] overflow-y-auto pr-1'>
              {AI_TEMPLATES.map((tmpl, idx) => (
                <div
                  key={tmpl.id}
                  onClick={() => setSelectedAiTemplate(idx)}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                    selectedAiTemplate === idx
                      ? 'border-primary bg-primary/5 shadow-xs ring-1 ring-primary/30'
                      : 'border-border/70 hover:border-border hover:bg-muted/40'
                  }`}
                >
                  <div className='flex items-center justify-between'>
                    <h4 className='text-xs font-bold text-foreground'>{tmpl.title}</h4>
                    {selectedAiTemplate === idx && (
                      <span className='h-2 w-2 rounded-full bg-primary' />
                    )}
                  </div>
                  <p className='text-[11px] text-muted-foreground mt-1 leading-relaxed'>
                    {tmpl.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* Xem trước mẫu đang chọn */}
            <div className='p-3 rounded-xl border border-border/60 bg-muted/30 text-xs font-mono max-h-[140px] overflow-y-auto text-muted-foreground whitespace-pre-line'>
              {AI_TEMPLATES[selectedAiTemplate].generate(productTitle || 'Sản phẩm mới')}
            </div>
          </div>

          <DialogFooter className='flex-col sm:flex-row items-center justify-between gap-2 border-t border-border/60 pt-4'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={() => setIsAiModalOpen(false)}
              className='w-full sm:w-auto h-9 text-xs rounded-xl cursor-pointer'
            >
              Đóng
            </Button>
            <div className='flex items-center gap-2 w-full sm:w-auto'>
              <Button
                type='button'
                variant='secondary'
                size='sm'
                onClick={() => handleApplyAiTemplate('append')}
                className='flex-1 sm:flex-initial h-9 text-xs rounded-xl cursor-pointer font-semibold'
              >
                + Chèn thêm vào cuối
              </Button>
              <Button
                type='button'
                size='sm'
                onClick={() => handleApplyAiTemplate('replace')}
                className='flex-1 sm:flex-initial h-9 text-xs rounded-xl cursor-pointer font-bold bg-primary text-primary-foreground hover:bg-primary/90'
              >
                Thay thế toàn bộ
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 4. DIALOG: Chèn liên kết web */}
      <Dialog open={isLinkModalOpen} onOpenChange={setIsLinkModalOpen}>
        <DialogContent className='max-w-md p-5 rounded-2xl'>
          <DialogHeader className='space-y-1 text-left'>
            <DialogTitle className='text-base font-bold text-foreground flex items-center gap-2'>
              <Icons.link className='w-4 h-4 text-primary' />
              <span>Chèn liên kết web</span>
            </DialogTitle>
            <DialogDescription className='text-xs text-muted-foreground'>
              Nhập đường dẫn trang web và văn bản hiển thị cho khách hàng bấm vào.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-3 py-2'>
            <div className='space-y-1'>
              <label className='text-xs font-semibold text-foreground'>Văn bản hiển thị</label>
              <input
                type='text'
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder='VD: Tải bản dùng thử miễn phí'
                className='w-full h-9 px-3 rounded-xl border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none'
              />
            </div>
            <div className='space-y-1'>
              <label className='text-xs font-semibold text-foreground'>
                Đường dẫn URL <span className='text-destructive'>*</span>
              </label>
              <input
                type='url'
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder='https://...'
                className='w-full h-9 px-3 rounded-xl border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none'
              />
            </div>
          </div>

          <DialogFooter className='flex items-center justify-end gap-2 pt-3 border-t border-border/60'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={() => setIsLinkModalOpen(false)}
              className='h-8 text-xs rounded-xl cursor-pointer'
            >
              Hủy
            </Button>
            <Button
              type='button'
              size='sm'
              onClick={handleConfirmLink}
              className='h-8 text-xs rounded-xl cursor-pointer font-semibold bg-primary text-primary-foreground'
            >
              Xác nhận chèn
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
