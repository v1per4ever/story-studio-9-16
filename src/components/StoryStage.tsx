import React, { useState, useEffect, useRef } from 'react';
import { StorySlide } from '../types/story';
import { PRESET_DEFINITIONS } from '../constants/presets';
import { generateQrDataUrl } from '../utils/qrcode';
import { fitStoryContent } from '../utils/layout';
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
  thumbnailWidth?: number;
  slide: StorySlide;
  slideIndex: number;
  totalSlides: number;
  onUpdateContent: (patch: Partial<StorySlide['content']>) => void;
  onUpdateBrandingText: (text: string) => void;
  onShowToast: (message: string, isSuccess?: boolean) => void;
}

export const StoryStage: React.FC<StoryStageProps> = ({
  slide,
  thumbnailWidth,
  slideIndex,
  totalSlides,
  onUpdateContent,
  onUpdateBrandingText,
  onShowToast,
}) => {
  const availableRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(1);
  useEffect(() => {
    const container = availableRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => {
      setFitScale(Math.max(0.1, Math.min(container.clientWidth / 360, container.clientHeight / 640, 1)));
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const [qrResult, setQrResult] = useState({ source: '', data: '', failed: false });
  const qrDataUrl = qrResult.source === slide.qrcode.url ? qrResult.data : '';
  const stageRef = useRef<HTMLDivElement>(null);
  const [contentFit, setContentFit] = useState(1);
  const [overflowing, setOverflowing] = useState(false);
  useEffect(() => {
    const content = stageRef.current?.querySelector<HTMLElement>('[data-story-content]');
    const body = content?.querySelector<HTMLElement>('[data-content-body]');
    if (!content || !body) return;
    const check = () => {
      const result = fitStoryContent(content, body);
      setContentFit(result.fit);
      setOverflowing(result.overflow);
    };
    const observer = new ResizeObserver(check);
    observer.observe(content);
    const frame = requestAnimationFrame(check);
    document.fonts.ready.then(check);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, [slide, fitScale, qrDataUrl]);
  const [showSafeZones, setShowSafeZones] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const [stageScale, setStageScale] = useState<'fit' | '100%'>('fit');

  const isTeam = slide.preset === 'team_management' || slide.preset === 'team_legal';

  // Generate QR code only for templates that render it
  useEffect(() => {
    let isCancelled = false;
    if (!isTeam && slide.qrcode.visible && slide.qrcode.url) {
      generateQrDataUrl(slide.qrcode.url).then((url) => {
        if (!isCancelled) {
          setQrResult({ source: slide.qrcode.url, data: url, failed: !url });
        }
      });
    } else {
      setQrResult({ source: '', data: '', failed: false });
    }
    return () => {
      isCancelled = true;
    };
  }, [isTeam, slide.qrcode.visible, slide.qrcode.url]);

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
      onShowToast(err instanceof Error ? err.message : 'Не удалось экспортировать изображение', false);
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
      onShowToast(err instanceof Error ? err.message : 'Ошибка при попытке поделиться', false);
    } finally {
      setIsSharing(false);
    }
  };

  // Design margins, shared by the layout and its guide (canonical 360×640 canvas).
  const margins = slide.destination === 'shorts'
    ? { top: 64, bottom: 160, left: 20, right: 60 }
    : slide.destination === 'free'
    ? { top: 24, bottom: 24, left: 24, right: 24 }
    : { top: 90, bottom: 128, left: 24, right: 24 };
  const canvas = (
        <div style={{ width: 360 * (thumbnailWidth ? thumbnailWidth / 360 : stageScale === 'fit' ? fitScale : 1), height: 640 * (thumbnailWidth ? thumbnailWidth / 360 : stageScale === 'fit' ? fitScale : 1), flexShrink: 0 }}>
        <div
          ref={stageRef}
          id={`${thumbnailWidth ? "thumbnail" : "viewport"}-${slide.id}`}
          data-qr-pending={!isTeam && slide.qrcode.visible && slide.qrcode.url.trim() && !qrDataUrl ? true : undefined}
          data-qr-error={qrResult.source === slide.qrcode.url && qrResult.failed ? true : undefined}
          data-layout-overflow={overflowing ? true : undefined}
          data-dense={slide.destination === 'shorts' ? true : undefined}
          className="story-canvas relative overflow-hidden bg-black shadow-2xl"
          style={{ width: 360, height: 640, transform: `scale(${thumbnailWidth ? thumbnailWidth / 360 : stageScale === 'fit' ? fitScale : 1})`, transformOrigin: 'top left', fontFamily: slide.typography.fontFamily, color: slide.typography.textColor, '--story-text': slide.typography.textColor, '--story-accent': slide.typography.tagColor, '--story-font-scale': slide.typography.fontSizeScale, '--story-align': slide.typography.align } as React.CSSProperties}
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

          <div data-story-layout className="absolute z-20 grid gap-3" style={{ top: margins.top, bottom: margins.bottom, left: margins.left, right: margins.right, gridTemplateRows: `${isTeam ? '0px' : 'auto'} minmax(0, 1fr) auto` }}>
          <header data-story-header className={isTeam ? "hidden" : "flex items-center gap-2 min-h-6"}>
          {/* Layer 4: Top Slide Counter */}
          {!isTeam && slide.showCounter && (
            <div className="flex items-center text-xs">
              <span className="glass-panel rounded-full px-2.5 py-1 text-[10px] font-bold tracking-widest uppercase text-white/90 border border-white/10">
                {slideNumber} / ИСТОРИЯ
              </span>
            </div>
          )}

          {/* Layer 5: Top Branding Position (optional) */}
          {!isTeam && slide.branding.visible && slide.branding.position === 'top' && (
            <div className="ml-auto min-w-0">
              <div className="glass-badge rounded-full px-3.5 py-1 flex items-center gap-1.5 shadow-lg">
                {slide.branding.statusDot && (
                  <span data-activity-indicator aria-label="Индикатор активности" className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" />
                )}
                <span
                  contentEditable
                  suppressContentEditableWarning
                  onInput={(e) => onUpdateBrandingText(e.currentTarget.textContent || '')}
                  className="font-bold tracking-wider text-[11px] text-white uppercase outline-none"
                >
                  {slide.branding.text}
                </span>
              </div>
            </div>
          )}

          </header>
          {/* Layer 6: Content Center Container */}
          <div data-story-content
            className={`relative min-h-0 overflow-hidden flex flex-col justify-center py-1 pointer-events-auto ${
              slide.typography.align === 'left'
                ? 'items-start text-left'
                : slide.typography.align === 'right'
                ? 'items-end text-right'
                : 'items-center text-center'
            }`}
            style={{
              gridRow: 2,
              fontFamily: slide.typography.fontFamily,
              color: slide.typography.textColor,
            }}
          >
            <div data-content-body className="w-full shrink-0" style={{zoom: contentFit}}>
            {/* 1. EDITORIAL PRESET */}
            {slide.preset === 'editorial' && (
              <div className="flex flex-col gap-2.5 w-full">
                {slide.content.tag && (
                  <div>
                    <span
                      contentEditable
                      suppressContentEditableWarning
                      onInput={(e) => onUpdateContent({ tag: e.currentTarget.textContent || '' })}
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
                  onInput={(e) => onUpdateContent({ title: e.currentTarget.textContent || '' })}
                  className="font-extrabold leading-tight tracking-tight outline-none drop-shadow-md text-2xl"
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
                    onInput={(e) => onUpdateContent({ subtitle: e.currentTarget.textContent || '' })}
                    className="text-sm font-normal text-zinc-300 leading-relaxed outline-none drop-shadow"
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
                  onInput={(e) => onUpdateContent({ title: e.currentTarget.textContent || '' })}
                  className="text-lg font-bold italic leading-snug drop-shadow-md outline-none -mt-2"
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
                    onInput={(e) => onUpdateContent({ authorName: e.currentTarget.textContent || '' })}
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
                    onInput={(e) => onUpdateContent({ tag: e.currentTarget.textContent || '' })}
                    className="mb-2 text-[10px] font-bold tracking-widest uppercase outline-none text-zinc-400"
                  >
                    {slide.content.tag}
                  </span>
                )}
                <div
                  contentEditable
                  suppressContentEditableWarning
                  onInput={(e) => onUpdateContent({ metricValue: e.currentTarget.textContent || '' })}
                  className="font-black tracking-tight leading-none text-5xl text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 drop-shadow-lg outline-none"
                >
                  {slide.content.metricValue || '+100%'}
                </div>
                <h3
                  contentEditable
                  suppressContentEditableWarning
                  onInput={(e) => onUpdateContent({ title: e.currentTarget.textContent || '' })}
                  className="mt-3 text-base font-bold leading-tight drop-shadow outline-none"
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
                    onInput={(e) => onUpdateContent({ subtitle: e.currentTarget.textContent || '' })}
                    className="mt-2 text-sm text-zinc-300 leading-relaxed outline-none drop-shadow max-w-[90%]"
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
                      onInput={(e) => onUpdateContent({ tag: e.currentTarget.textContent || '' })}
                      className="outline-none"
                    >
                      {slide.content.tag}
                    </span>
                  </div>
                )}
                <h2
                  contentEditable
                  suppressContentEditableWarning
                  onInput={(e) => onUpdateContent({ title: e.currentTarget.textContent || '' })}
                  className="text-2xl font-extrabold leading-tight tracking-tight drop-shadow-md outline-none"
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
                    onInput={(e) => onUpdateContent({ subtitle: e.currentTarget.textContent || '' })}
                    className="mt-3 text-sm text-zinc-300 leading-relaxed drop-shadow outline-none"
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
                    onInput={(e) => onUpdateContent({ tag: e.currentTarget.textContent || '' })}
                    className="mb-1 block text-[10px] font-bold tracking-wider uppercase text-cyan-300 outline-none"
                  >
                    {slide.content.tag}
                  </span>
                )}
                <h2
                  contentEditable
                  suppressContentEditableWarning
                  onInput={(e) => onUpdateContent({ title: e.currentTarget.textContent || '' })}
                  className="text-lg font-bold leading-tight text-white outline-none"
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
                    onInput={(e) => onUpdateContent({ subtitle: e.currentTarget.textContent || '' })}
                    className="mt-2 text-sm text-zinc-300 leading-relaxed outline-none"
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
                      onInput={(e) => onUpdateContent({ tag: e.currentTarget.textContent || '' })}
                      className="outline-none"
                    >
                      {slide.content.tag}
                    </span>
                  </div>
                )}
                <h2
                  contentEditable
                  suppressContentEditableWarning
                  onInput={(e) => onUpdateContent({ title: e.currentTarget.textContent || '' })}
                  className="text-2xl font-extrabold leading-tight tracking-tight drop-shadow-md outline-none"
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
                    onInput={(e) => onUpdateContent({ subtitle: e.currentTarget.textContent || '' })}
                    className="mt-3 text-sm text-zinc-300 leading-relaxed drop-shadow outline-none"
                  >
                    {slide.content.subtitle}
                  </p>
                )}
              </div>
            )}

            {/* 7. CHECKLIST PRESET */}
            {slide.preset === 'checklist' && (
              <div className="checklist-layout flex flex-col w-full text-left">
                {slide.content.tag && (
                  <span
                    contentEditable
                    suppressContentEditableWarning
                    onInput={(e) => onUpdateContent({ tag: e.currentTarget.textContent || '' })}
                    className="mb-2 text-[10px] font-bold tracking-widest uppercase text-emerald-400 outline-none"
                  >
                    {slide.content.tag}
                  </span>
                )}
                <h2
                  contentEditable
                  suppressContentEditableWarning
                  onInput={(e) => onUpdateContent({ title: e.currentTarget.textContent || '' })}
                  className="text-xl font-extrabold leading-tight text-white mb-4 outline-none"
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
                        onInput={(e) => {
                          const currentItems = [...(slide.content.checklistItems || [])];
                          currentItems[itemIdx] = e.currentTarget.textContent || '';
                          onUpdateContent({ checklistItems: currentItems });
                        }}
                        className="text-sm font-medium text-zinc-200 leading-tight outline-none"
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
                    onInput={(e) => onUpdateContent({ tag: e.currentTarget.textContent || '' })}
                    className="mb-2 text-[10px] font-bold tracking-widest uppercase text-zinc-400 outline-none"
                  >
                    {slide.content.tag}
                  </span>
                )}
                <h2
                  contentEditable
                  suppressContentEditableWarning
                  onInput={(e) => onUpdateContent({ title: e.currentTarget.textContent || '' })}
                  className="text-xl font-extrabold leading-tight text-white outline-none"
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
                      onInput={(e) => onUpdateContent({ price: e.currentTarget.textContent || '' })}
                      className="text-lg font-black text-emerald-400 tracking-tight outline-none"
                    >
                      {slide.content.price}
                    </span>
                  </div>
                )}

                {slide.content.subtitle && (
                  <p
                    contentEditable
                    suppressContentEditableWarning
                    onInput={(e) => onUpdateContent({ subtitle: e.currentTarget.textContent || '' })}
                    className="text-sm text-zinc-300 leading-relaxed outline-none drop-shadow"
                  >
                    {slide.content.subtitle}
                  </p>
                )}
              </div>
            )}

            {/* Two equal employee cards with one shared heading. */}
            {isTeam && (() => {
              const defaults = PRESET_DEFINITIONS[slide.preset].defaultContent.teamMembers || [];
              const members = [0, 1].map((index) => slide.content.teamMembers?.[index] || (index === 1 ? defaults.find((member) => member.name !== slide.content.teamMembers?.[0]?.name) : defaults[index])).filter((member) => member !== undefined);
              return <div className="team-layout flex w-full flex-col gap-3 text-left">
                <h2 contentEditable suppressContentEditableWarning onInput={(e) => onUpdateContent({title: e.currentTarget.textContent || ''})}
                  className="font-bold leading-tight tracking-tight outline-none" style={{fontSize: 22 * slide.typography.fontSizeScale}}>{slide.content.title}</h2>
                <div className="flex flex-col gap-3">
                  {members.slice(0, 2).map((member, index) => {
                    const updateMember = (patch: Partial<typeof member>) => {
                      const next = [...members]; next[index] = {...member, ...patch}; onUpdateContent({teamMembers: next});
                    };
                    return <article key={index} className="grid grid-cols-[88px_minmax(0,1fr)] overflow-hidden rounded-xl border border-white/10 bg-zinc-950/90 text-left">
                      <img src={member.image} alt={member.name} crossOrigin="anonymous" className="h-[142px] w-[88px] object-cover object-top" />
                      <div className="flex min-w-0 flex-col gap-2 p-3">
                        <h3 contentEditable suppressContentEditableWarning onInput={(e) => updateMember({name:e.currentTarget.textContent || ''})} style={{fontSize: 18 * slide.typography.fontSizeScale}} className="font-semibold leading-tight outline-none">{member.name}</h3>
                        <p contentEditable suppressContentEditableWarning onInput={(e) => updateMember({role:e.currentTarget.textContent || ''})} style={{fontSize: 13 * slide.typography.fontSizeScale}} className="leading-[1.4] text-zinc-200 outline-none">{member.role}</p>
                        {(member.experience || member.achievement) && <div style={{fontSize: 12 * slide.typography.fontSizeScale}} className="mt-auto flex flex-wrap gap-x-3 gap-y-1 border-t border-white/10 pt-2 leading-snug text-zinc-300">
                          {member.experience && <span contentEditable suppressContentEditableWarning onInput={(e) => updateMember({experience:e.currentTarget.textContent || ''})} className="outline-none">{member.experience}</span>}
                          {member.achievement && <span contentEditable suppressContentEditableWarning onInput={(e) => updateMember({achievement:e.currentTarget.textContent || ''})} className="outline-none">{member.achievement}</span>}
                        </div>}
                      </div>
                    </article>;
                  })}
                </div>
              </div>;
            })()}

            {/* QR Code Module */}
            {!isTeam && slide.qrcode.visible && qrDataUrl && (
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
          </div>

          <footer data-story-footer style={{gridRow: 3}} className="flex justify-center min-h-6">
          {/* Layer 7: Bottom Branding Position */}
          {slide.branding.visible && (isTeam || slide.branding.position === 'bottom') && (
            <div className="max-w-full">
              <div className={isTeam ? "flex items-center gap-2 text-zinc-400" : "glass-badge rounded-full px-4 py-1.5 flex items-center gap-2 shadow-xl border border-white/20"}>
                {slide.branding.statusDot && (
                  <span data-activity-indicator aria-label="Индикатор активности" className="h-2 w-2 shrink-0 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" />
                )}
                <span
                  contentEditable
                  suppressContentEditableWarning
                  onInput={(e) => onUpdateBrandingText(e.currentTarget.textContent || '')}
                  className="font-bold tracking-wider text-xs text-white uppercase outline-none"
                >
                  {slide.branding.text}
                </span>
              </div>
            </div>
          )}

          </footer>
          </div>
          {/* Layer 8: Safe Zones Guide Overlay */}
          {showSafeZones && (
            <div data-editor-only className="absolute inset-0 z-30 pointer-events-none">
              <div className="absolute inset-x-0 top-0 bg-emerald-500/15 border-b border-dashed border-emerald-400/70" style={{ height: margins.top }} />
              <div className="absolute inset-x-0 bottom-0 bg-emerald-500/15 border-t border-dashed border-emerald-400/70" style={{ height: margins.bottom }} />
              <div className="absolute left-0 bg-emerald-500/15" style={{ top: margins.top, bottom: margins.bottom, width: margins.left }} />
              <div className="absolute right-0 bg-emerald-500/15" style={{ top: margins.top, bottom: margins.bottom, width: margins.right }} />
              <div className="absolute border border-dashed border-emerald-400/70" style={{ top: margins.top, bottom: margins.bottom, left: margins.left, right: margins.right }} />
              <span className="absolute top-5 inset-x-0 text-center text-[12px] font-semibold text-emerald-300">{slide.destination === 'shorts' ? 'Shorts / Reels' : slide.destination === 'free' ? 'Свободный макет' : 'Stories'} · ориентир безопасной области</span>
            </div>
          )}
        </div>
        </div>
  );
  if (thumbnailWidth) return <div inert className="pointer-events-none">{canvas}</div>;

  return (
    <div className="relative flex flex-1 flex-col items-center justify-between p-3 sm:p-6 min-w-0 min-h-0 overflow-auto">
      <p className="mb-2 text-xs text-zinc-400">Нажмите на текст для редактирования</p>
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
            title="Показать ориентир безопасной области для выбранного назначения"
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
      <div ref={availableRef} className="relative flex w-full flex-1 min-h-0 items-center justify-center py-1">
        {canvas}
      </div>

      {overflowing && <p role="status" className="mt-2 text-sm text-amber-400">Контент не помещается. Сократите заголовок или пункты: уменьшение ограничено, чтобы сохранить читаемость.</p>}
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
