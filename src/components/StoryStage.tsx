import React, { useState, useEffect, useRef } from 'react';
import { StorySlide } from '../types/story';
import { generateQrDataUrl } from '../utils/qrcode';
import { exportSlideToJpeg } from '../utils/export';
import { shareSlideNative } from '../utils/share';
import {
  Download,
  Share2,
  Check,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
} from 'lucide-react';

interface StoryStageProps {
  slide: StorySlide;
  slideIndex: number;
  totalSlides: number;
  onUpdateContent: (patch: Partial<StorySlide['content']>) => void;
  onUpdateBrandingText: (text: string) => void;
  onShowToast: (message: string, isSuccess?: boolean) => void;
}

export const StoryStage: React.FC<StoryStageProps> = ({
  slide,
  slideIndex,
  totalSlides,
  onUpdateContent,
  onUpdateBrandingText,
  onShowToast,
}) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [showSafeZones, setShowSafeZones] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const [stageScale, setStageScale] = useState<'fit' | '100%'>('fit');

  // Generate QR code if visible
  useEffect(() => {
    let isCancelled = false;
    if (slide.qrcode.visible && slide.qrcode.url) {
      generateQrDataUrl(slide.qrcode.url).then((url) => {
        if (!isCancelled) {
          setQrDataUrl(url);
        }
      });
    } else {
      setQrDataUrl('');
    }
    return () => {
      isCancelled = true;
    };
  }, [slide.qrcode.visible, slide.qrcode.url]);

  const slideNumber = String(slideIndex + 1).padStart(2, '0');

  const handleDownload = async () => {
    if (!stageRef.current || isExporting) return;
    setIsExporting(true);
    onShowToast(`Экспорт слайда #${slideIndex + 1} в 1080×1920 px...`);

    try {
      await exportSlideToJpeg(stageRef.current, `story-${slideNumber}`);
      onShowToast(`Слайд #${slideIndex + 1} успешно сохранен в JPG!`, true);
    } catch (err) {
      console.error('Download error:', err);
      onShowToast('Не удалось экспортировать изображение', false);
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = async () => {
    if (!stageRef.current || isSharing) return;
    setIsSharing(true);

    try {
      const result = await shareSlideNative(stageRef.current, `story-${slideNumber}`);
      onShowToast(result.message, result.success);
    } catch (err) {
      console.error('Share error:', err);
      onShowToast('Ошибка при попытке поделиться', false);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="relative flex flex-1 flex-col items-center justify-between p-3 sm:p-6 overflow-y-auto overflow-x-hidden">
      {/* Top stage toolbar */}
      <div className="mb-3 flex w-full max-w-[340px] sm:max-w-[380px] items-center justify-between text-xs text-zinc-400">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-zinc-200">
            Слайд {slideIndex + 1} из {totalSlides}
          </span>
          <span className="text-zinc-600">•</span>
          <span className="font-mono text-[11px] text-zinc-400">9:16</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Safe Zones Toggle */}
          <button
            onClick={() => setShowSafeZones(!showSafeZones)}
            title="Показать безопасные зоны для Instagram/Telegram Stories"
            className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-medium transition ${
              showSafeZones
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {showSafeZones ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
            <span className="hidden sm:inline">Безопасные зоны</span>
          </button>

          {/* Scale Toggle */}
          <button
            onClick={() => setStageScale(stageScale === 'fit' ? '100%' : 'fit')}
            title="Масштаб отображения"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200"
          >
            {stageScale === 'fit' ? (
              <Maximize2 className="h-3 w-3" />
            ) : (
              <Minimize2 className="h-3 w-3" />
            )}
          </button>
        </div>
      </div>

      {/* Main Canvas Viewport Container */}
      <div className="relative flex w-full flex-1 items-center justify-center py-1">
        <div
          ref={stageRef}
          id={`viewport-${slide.id}`}
          className={`relative aspect-story overflow-hidden rounded-[26px] bg-black select-none shadow-2xl transition-all duration-200 ${
            stageScale === 'fit'
              ? 'w-full max-w-[320px] sm:max-w-[360px] md:max-w-[380px]'
              : 'w-full max-w-[420px]'
          }`}
          style={{
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.08)',
          }}
        >
          {/* Layer 1: Background Element */}
          {slide.background.type === 'image' && (
            <img
              src={slide.background.value}
              alt="Фон слайда"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-150"
              style={{
                transform: `scale(${slide.background.zoom}) translate(${slide.background.panX}%, ${slide.background.panY}%)`,
                filter: slide.background.blur > 0 ? `blur(${slide.background.blur}px)` : 'none',
              }}
              crossOrigin="anonymous"
            />
          )}

          {slide.background.type === 'gradient' && (
            <div
              className="absolute inset-0 h-full w-full"
              style={{ background: slide.background.value }}
            />
          )}

          {slide.background.type === 'solid' && (
            <div
              className="absolute inset-0 h-full w-full"
              style={{ backgroundColor: slide.background.value }}
            />
          )}

          {/* Layer 2: Dimming Dark Overlay */}
          <div
            className="absolute inset-0 bg-black transition-opacity duration-150 pointer-events-none"
            style={{ opacity: slide.background.dim / 100 }}
          />

          {/* Layer 3: Atmospheric Vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/35 pointer-events-none" />

          {/* Layer 4: Top Slide Counter */}
          {slide.showCounter && (
            <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between text-xs pointer-events-none">
              <span className="glass-panel rounded-full px-2.5 py-1 text-[10px] font-bold tracking-widest uppercase text-white/90 border border-white/10">
                {slideNumber} / ИСТОРИЯ
              </span>
            </div>
          )}

          {/* Layer 5: Top Branding Position (optional) */}
          {slide.branding.visible && slide.branding.position === 'top' && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
              <div className="glass-badge rounded-full px-3.5 py-1 flex items-center gap-1.5 shadow-lg">
                {slide.branding.statusDot && (
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" />
                )}
                <span
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => onUpdateBrandingText(e.currentTarget.textContent || '')}
                  className="font-bold tracking-wider text-[11px] text-white uppercase outline-none"
                >
                  {slide.branding.text}
                </span>
              </div>
            </div>
          )}

          {/* Layer 6: Content Center Container */}
          <div
            className={`absolute inset-0 z-20 flex flex-col justify-center px-6 py-12 pointer-events-auto ${
              slide.typography.align === 'left'
                ? 'items-start text-left'
                : slide.typography.align === 'right'
                ? 'items-end text-right'
                : 'items-center text-center'
            }`}
            style={{
              fontFamily: slide.typography.fontFamily,
              color: slide.typography.textColor,
            }}
          >
            {/* 1. EDITORIAL PRESET */}
            {slide.preset === 'editorial' && (
              <div className="flex flex-col gap-2.5 w-full">
                {slide.content.tag && (
                  <div>
                    <span
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => onUpdateContent({ tag: e.currentTarget.textContent || '' })}
                      className="inline-block rounded-full px-3 py-1 text-[10px] font-bold tracking-widest uppercase outline-none"
                      style={{
                        backgroundColor: 'rgba(56, 189, 248, 0.15)',
                        borderColor: 'rgba(56, 189, 248, 0.3)',
                        borderWidth: 1,
                        color: slide.typography.tagColor,
                      }}
                    >
                      {slide.content.tag}
                    </span>
                  </div>
                )}
                <h2
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => onUpdateContent({ title: e.currentTarget.textContent || '' })}
                  className="font-extrabold leading-tight tracking-tight outline-none drop-shadow-md text-2xl sm:text-3xl"
                  style={{
                    fontSize: `calc(1.75rem * ${slide.typography.fontSizeScale})`,
                  }}
                >
                  {slide.content.title}
                </h2>
                {slide.content.subtitle && (
                  <p
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => onUpdateContent({ subtitle: e.currentTarget.textContent || '' })}
                    className="text-xs sm:text-sm font-normal text-zinc-300 leading-relaxed outline-none drop-shadow"
                  >
                    {slide.content.subtitle}
                  </p>
                )}
              </div>
            )}

            {/* 2. QUOTE PRESET */}
            {slide.preset === 'quote' && (
              <div className="flex flex-col items-center w-full">
                <span className="font-serif text-5xl leading-none text-white/30 select-none">
                  “
                </span>
                <p
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => onUpdateContent({ title: e.currentTarget.textContent || '' })}
                  className="text-lg sm:text-xl font-bold italic leading-snug drop-shadow-md outline-none -mt-2"
                  style={{
                    fontSize: `calc(1.25rem * ${slide.typography.fontSizeScale})`,
                  }}
                >
                  {slide.content.title}
                </p>
                <div className="my-3.5 h-0.5 w-10 bg-emerald-500 opacity-80" />
                {slide.content.authorName && (
                  <span
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => onUpdateContent({ authorName: e.currentTarget.textContent || '' })}
                    className="text-[11px] font-semibold uppercase tracking-widest text-emerald-400 outline-none"
                  >
                    {slide.content.authorName}
                  </span>
                )}
              </div>
            )}

            {/* 3. METRIC PRESET */}
            {slide.preset === 'metric' && (
              <div className="flex flex-col items-center w-full">
                {slide.content.tag && (
                  <span
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => onUpdateContent({ tag: e.currentTarget.textContent || '' })}
                    className="mb-2 text-[10px] font-bold tracking-widest uppercase outline-none text-zinc-400"
                  >
                    {slide.content.tag}
                  </span>
                )}
                <div
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => onUpdateContent({ metricValue: e.currentTarget.textContent || '' })}
                  className="font-black tracking-tight leading-none text-5xl sm:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 drop-shadow-lg outline-none"
                >
                  {slide.content.metricValue || '+100%'}
                </div>
                <h3
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => onUpdateContent({ title: e.currentTarget.textContent || '' })}
                  className="mt-3 text-base sm:text-lg font-bold leading-tight drop-shadow outline-none"
                  style={{
                    fontSize: `calc(1.125rem * ${slide.typography.fontSizeScale})`,
                  }}
                >
                  {slide.content.title}
                </h3>
                {slide.content.subtitle && (
                  <p
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => onUpdateContent({ subtitle: e.currentTarget.textContent || '' })}
                    className="mt-2 text-xs text-zinc-300 leading-relaxed outline-none drop-shadow max-w-[90%]"
                  >
                    {slide.content.subtitle}
                  </p>
                )}
              </div>
            )}

            {/* 4. HIGHLIGHT PRESET */}
            {slide.preset === 'highlight' && (
              <div className="flex flex-col items-center w-full">
                {slide.content.tag && (
                  <div className="mb-3 rounded-lg border border-amber-500/40 bg-amber-500/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                    <span
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => onUpdateContent({ tag: e.currentTarget.textContent || '' })}
                      className="outline-none"
                    >
                      {slide.content.tag}
                    </span>
                  </div>
                )}
                <h2
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => onUpdateContent({ title: e.currentTarget.textContent || '' })}
                  className="text-2xl sm:text-3xl font-extrabold leading-tight tracking-tight drop-shadow-md outline-none"
                  style={{
                    fontSize: `calc(1.6rem * ${slide.typography.fontSizeScale})`,
                  }}
                >
                  {slide.content.title}
                </h2>
                {slide.content.subtitle && (
                  <p
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => onUpdateContent({ subtitle: e.currentTarget.textContent || '' })}
                    className="mt-3 text-xs sm:text-sm text-zinc-300 leading-relaxed drop-shadow outline-none"
                  >
                    {slide.content.subtitle}
                  </p>
                )}
              </div>
            )}

            {/* 5. GLASS PRESET */}
            {slide.preset === 'glass' && (
              <div className="glass-panel w-full rounded-2xl p-5 shadow-2xl">
                {slide.content.tag && (
                  <span
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => onUpdateContent({ tag: e.currentTarget.textContent || '' })}
                    className="mb-1 block text-[10px] font-bold tracking-wider uppercase text-cyan-300 outline-none"
                  >
                    {slide.content.tag}
                  </span>
                )}
                <h2
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => onUpdateContent({ title: e.currentTarget.textContent || '' })}
                  className="text-lg sm:text-xl font-bold leading-tight text-white outline-none"
                  style={{
                    fontSize: `calc(1.2rem * ${slide.typography.fontSizeScale})`,
                  }}
                >
                  {slide.content.title}
                </h2>
                {slide.content.subtitle && (
                  <p
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => onUpdateContent({ subtitle: e.currentTarget.textContent || '' })}
                    className="mt-2 text-xs text-zinc-300 leading-relaxed outline-none"
                  >
                    {slide.content.subtitle}
                  </p>
                )}
              </div>
            )}

            {/* 6. ANNOUNCEMENT PRESET */}
            {slide.preset === 'announcement' && (
              <div className="flex flex-col items-center w-full">
                {slide.content.tag && (
                  <div className="mb-3 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                    <span
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => onUpdateContent({ tag: e.currentTarget.textContent || '' })}
                      className="outline-none"
                    >
                      {slide.content.tag}
                    </span>
                  </div>
                )}
                <h2
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => onUpdateContent({ title: e.currentTarget.textContent || '' })}
                  className="text-2xl sm:text-3xl font-extrabold leading-tight tracking-tight drop-shadow-md outline-none"
                  style={{
                    fontSize: `calc(1.6rem * ${slide.typography.fontSizeScale})`,
                  }}
                >
                  {slide.content.title}
                </h2>
                {slide.content.subtitle && (
                  <p
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => onUpdateContent({ subtitle: e.currentTarget.textContent || '' })}
                    className="mt-3 text-xs sm:text-sm text-zinc-300 leading-relaxed drop-shadow outline-none"
                  >
                    {slide.content.subtitle}
                  </p>
                )}
              </div>
            )}

            {/* 7. CHECKLIST PRESET */}
            {slide.preset === 'checklist' && (
              <div className="flex flex-col w-full text-left">
                {slide.content.tag && (
                  <span
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => onUpdateContent({ tag: e.currentTarget.textContent || '' })}
                    className="mb-2 text-[10px] font-bold tracking-widest uppercase text-emerald-400 outline-none"
                  >
                    {slide.content.tag}
                  </span>
                )}
                <h2
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => onUpdateContent({ title: e.currentTarget.textContent || '' })}
                  className="text-xl sm:text-2xl font-extrabold leading-tight text-white mb-4 outline-none"
                  style={{
                    fontSize: `calc(1.35rem * ${slide.typography.fontSizeScale})`,
                  }}
                >
                  {slide.content.title}
                </h2>
                <div className="flex flex-col gap-2.5">
                  {(slide.content.checklistItems || []).map((item, itemIdx) => (
                    <div
                      key={itemIdx}
                      className="flex items-center gap-2.5 rounded-xl bg-black/40 border border-white/10 p-2.5 backdrop-blur-sm"
                    >
                      <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                        <Check className="h-3 w-3 stroke-[2.5]" />
                      </div>
                      <span
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => {
                          const currentItems = [...(slide.content.checklistItems || [])];
                          currentItems[itemIdx] = e.currentTarget.textContent || '';
                          onUpdateContent({ checklistItems: currentItems });
                        }}
                        className="text-xs font-medium text-zinc-200 leading-tight outline-none"
                      >
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 8. PRODUCT / OFFER PRESET */}
            {slide.preset === 'product' && (
              <div className="flex flex-col items-center w-full">
                {slide.content.tag && (
                  <span
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => onUpdateContent({ tag: e.currentTarget.textContent || '' })}
                    className="mb-2 text-[10px] font-bold tracking-widest uppercase text-zinc-400 outline-none"
                  >
                    {slide.content.tag}
                  </span>
                )}
                <h2
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => onUpdateContent({ title: e.currentTarget.textContent || '' })}
                  className="text-xl sm:text-2xl font-extrabold leading-tight text-white outline-none"
                  style={{
                    fontSize: `calc(1.35rem * ${slide.typography.fontSizeScale})`,
                  }}
                >
                  {slide.content.title}
                </h2>

                {slide.content.price && (
                  <div className="my-3.5 rounded-2xl bg-zinc-900/90 border border-emerald-500/30 px-4 py-2 shadow-xl">
                    <span
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => onUpdateContent({ price: e.currentTarget.textContent || '' })}
                      className="text-lg sm:text-xl font-black text-emerald-400 tracking-tight outline-none"
                    >
                      {slide.content.price}
                    </span>
                  </div>
                )}

                {slide.content.subtitle && (
                  <p
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => onUpdateContent({ subtitle: e.currentTarget.textContent || '' })}
                    className="text-xs text-zinc-300 leading-relaxed outline-none drop-shadow"
                  >
                    {slide.content.subtitle}
                  </p>
                )}
              </div>
            )}

            {/* QR Code Module */}
            {slide.qrcode.visible && qrDataUrl && (
              <div className="mt-4 flex flex-col items-center">
                <div className="rounded-xl bg-white p-1.5 shadow-2xl">
                  <img
                    src={qrDataUrl}
                    alt="QR Код"
                    style={{ width: slide.qrcode.size, height: slide.qrcode.size }}
                    className="block"
                  />
                </div>
                {slide.qrcode.label && (
                  <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-300 drop-shadow">
                    {slide.qrcode.label}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Layer 7: Bottom Branding Position */}
          {slide.branding.visible && slide.branding.position === 'bottom' && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
              <div className="glass-badge rounded-full px-4 py-1.5 flex items-center gap-2 shadow-xl border border-white/20 transition-transform hover:scale-105">
                {slide.branding.statusDot && (
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" />
                )}
                <span
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => onUpdateBrandingText(e.currentTarget.textContent || '')}
                  className="font-bold tracking-wider text-xs text-white uppercase outline-none"
                >
                  {slide.branding.text}
                </span>
              </div>
            </div>
          )}

          {/* Layer 8: Safe Zones Guide Overlay */}
          {showSafeZones && (
            <div className="absolute inset-0 z-30 pointer-events-none flex flex-col justify-between p-3 border-2 border-dashed border-emerald-500/50">
              {/* Top safe zone limit */}
              <div className="h-[14%] w-full border-b border-dashed border-emerald-400/60 bg-emerald-500/10 flex items-center justify-center">
                <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-300">
                  Зона шапки Stories (Не размещать текст)
                </span>
              </div>

              {/* Center safe area */}
              <div className="flex-1 flex items-center justify-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400/40">
                  Безопасная область контента
                </span>
              </div>

              {/* Bottom safe zone limit */}
              <div className="h-[18%] w-full border-t border-dashed border-emerald-400/60 bg-emerald-500/10 flex items-center justify-center">
                <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-300">
                  Зона реакций и ответа (Не размещать текст)
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Stage Action Dock */}
      <div className="mt-3 flex w-full max-w-[340px] sm:max-w-[380px] items-center justify-center gap-2">
        <button
          onClick={handleDownload}
          disabled={isExporting}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-zinc-900 border border-zinc-700/80 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-zinc-800 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
        >
          <Download className="h-4 w-4 text-emerald-400" />
          <span>{isExporting ? 'Рендеринг...' : `Скачать JPG #${slideNumber}`}</span>
        </button>

        <button
          onClick={handleShare}
          disabled={isSharing}
          title="Поделиться в мессенджер или соцсети"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-700/80 text-zinc-300 transition hover:bg-zinc-800 hover:text-white active:scale-95 disabled:pointer-events-none disabled:opacity-50"
        >
          <Share2 className="h-4 w-4 text-cyan-400" />
        </button>
      </div>
    </div>
  );
};
