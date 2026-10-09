import React, { useState, useEffect, useRef } from 'react';
import {
  StorySlide,
  PresetType,
  BackgroundConfig,
  TypographyConfig,
  BrandingConfig,
  QrCodeConfig,
  SlideContent,
  ActiveTab,
} from '../types/story';
import {
  PRESET_DEFINITIONS,
  BUSINESS_STOCK_IMAGES,
  BUSINESS_GRADIENTS,
  FONT_OPTIONS,
  DEFAULT_TEAM_AVATARS,
} from '../constants/presets';
import {
  LayoutTemplate,
  Type,
  Image as ImageIcon,
  QrCode,
  Upload,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Plus,
  Trash2,
  X,
} from 'lucide-react';

interface InspectorPanelProps {
  slide: StorySlide;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onChangePreset: (preset: PresetType, useExample?: boolean) => void;
  onUpdateDestination: (destination: StorySlide['destination']) => void;
  onUpdateContent: (patch: Partial<SlideContent>) => void;
  onUpdateBackground: (patch: Partial<BackgroundConfig>) => void;
  onUpdateTypography: (patch: Partial<TypographyConfig>) => void;
  onUpdateBranding: (patch: Partial<BrandingConfig>) => void;
  onUpdateQrCode: (patch: Partial<QrCodeConfig>) => void;
  onShowToast: (message: string, isSuccess?: boolean) => void;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  slide,
  isOpenMobile,
  onCloseMobile,
  onChangePreset,
  onUpdateDestination,
  onUpdateContent,
  onUpdateBackground,
  onUpdateTypography,
  onUpdateBranding,
  onUpdateQrCode,
  onShowToast,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isOpenMobile) return;
    const previous = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseMobile();
      if (event.key === 'Tab') {
        const controls = dialogRef.current?.querySelectorAll<HTMLElement>('button, input:not([type="file"]), textarea, select, [tabindex="0"]');
        if (!controls?.length) return;
        const first = controls[0], last = controls[controls.length - 1];
        if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => { window.removeEventListener('keydown', handleKey); previous?.focus(); };
  }, [isOpenMobile, onCloseMobile]);
  const [presetMode, setPresetMode] = useState<'keep' | 'example'>('keep');
  const [activeTab, setActiveTab] = useState<ActiveTab>('content');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onShowToast('Пожалуйста, выберите файл изображения', false);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        onUpdateBackground({
          type: 'image',
          value: dataUrl,
          panX: 0,
          panY: 0,
          zoom: 1,
        });
        onShowToast('Изображение успешно загружено', true);
      }
    };
    reader.readAsDataURL(file);
  };

  const panelContent = (
    <div className="flex h-full flex-col text-xs text-zinc-300">
      {/* Mobile Handle & Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 p-3 lg:hidden">
        <span className="font-semibold text-zinc-100">Настройки слайда</span>
        <button
          onClick={onCloseMobile}
          aria-label="Закрыть панель"
          className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-zinc-800 bg-zinc-950/80 p-1">
        <button
          onClick={() => setActiveTab('content')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 font-medium transition ${
            activeTab === 'content'
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <LayoutTemplate className="h-3.5 w-3.5" />
          <span className="text-[11px]">Контент</span>
        </button>
        <button
          onClick={() => setActiveTab('typography')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 font-medium transition ${
            activeTab === 'typography'
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Type className="h-3.5 w-3.5" />
          <span className="text-[11px]">Шрифт</span>
        </button>
        <button
          onClick={() => setActiveTab('background')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 font-medium transition ${
            activeTab === 'background'
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <ImageIcon className="h-3.5 w-3.5" />
          <span className="text-[11px]">Фон</span>
        </button>
        <button
          onClick={() => setActiveTab('modules')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 font-medium transition ${
            activeTab === 'modules'
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <QrCode className="h-3.5 w-3.5" />
          <span className="text-[11px]">Модули</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* TAB 1: CONTENT & PRESETS */}
        {activeTab === 'content' && (
          <div className="space-y-4">
            <div>
              <label htmlFor="destination" className="mb-1 block text-zinc-400">Назначение кадра</label>
              <select id="destination" value={slide.destination} onChange={(e) => onUpdateDestination(e.target.value as StorySlide['destination'])} className="w-full rounded-lg border border-zinc-700 bg-zinc-900 p-2 text-sm">
                <option value="stories">Stories · запас сверху и снизу</option>
                <option value="shorts">Shorts / Reels · запас справа и снизу</option>
                <option value="free">Свободный макет</option>
              </select>
              <p className="mt-2 text-zinc-400">Маски — ориентиры компоновки, интерфейс платформ может отличаться. Экспорт: изображение 1080×1920.</p>
            </div>
            <div>
              <label className="mb-1.5 block font-semibold text-zinc-400">Бизнес-шаблон</label>
              <select aria-label="Бизнес-шаблон" value={slide.preset} onChange={(e) => onChangePreset(e.target.value as PresetType, presetMode === 'example')} className="w-full rounded-lg border border-zinc-700 bg-zinc-900 p-2 text-sm">
                {(Object.keys(PRESET_DEFINITIONS) as PresetType[]).map((key) => <option key={key} value={key}>{PRESET_DEFINITIONS[key].title}</option>)}
              </select>
              <div className="mt-2 flex gap-2">
                <button aria-pressed={presetMode === 'keep'} className={`rounded border p-2 ${presetMode === 'keep' ? 'border-emerald-500' : 'border-zinc-700'}`} onClick={() => setPresetMode('keep')}>Сохранить текст</button>
                <button aria-pressed={presetMode === 'example'} className={`rounded border p-2 ${presetMode === 'example' ? 'border-emerald-500' : 'border-zinc-700'}`} onClick={() => setPresetMode('example')}>Использовать пример</button>
              </div>
              <p className="mt-2 text-xs text-zinc-400">{PRESET_DEFINITIONS[slide.preset].description}</p>
            </div>

            {/* Tag / Category */}
            {slide.preset !== 'team_management' && slide.preset !== 'team_legal' && <div>
              <label className="mb-1 block font-medium text-zinc-400">Тег / Рубрика</label>
              <input
                type="text"
                value={slide.content.tag}
                onChange={(e) => onUpdateContent({ tag: e.target.value })}
                placeholder="Например: СТРАТЕГИЯ И РОСТ"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-200 placeholder-zinc-600 focus:border-emerald-500/60 focus:outline-none"
              />
            </div>}

            {/* Title */}
            <div>
              <label className="mb-1 block font-medium text-zinc-400">Главный заголовок</label>
              <textarea
                rows={3}
                value={slide.content.title}
                onChange={(e) => onUpdateContent({ title: e.target.value })}
                placeholder="Введите текст заголовка..."
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-200 placeholder-zinc-600 focus:border-emerald-500/60 focus:outline-none"
              />
            </div>

            {/* Subtitle / Details */}
            {slide.preset !== 'quote' &&
              slide.preset !== 'team_management' &&
              slide.preset !== 'team_legal' && (
                <div>
                  <label className="mb-1 block font-medium text-zinc-400">
                    Поясняющий текст / Описание
                  </label>
                  <textarea
                    rows={2}
                    value={slide.content.subtitle}
                    onChange={(e) => onUpdateContent({ subtitle: e.target.value })}
                    placeholder="Дополнительный контекст..."
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-200 placeholder-zinc-600 focus:border-emerald-500/60 focus:outline-none"
                  />
                </div>
              )}

            {/* Quote Preset: Author Name */}
            {slide.preset === 'quote' && (
              <div>
                <label className="mb-1 block font-medium text-zinc-400">Автор цитаты</label>
                <input
                  type="text"
                  value={slide.content.authorName || ''}
                  onChange={(e) => onUpdateContent({ authorName: e.target.value })}
                  placeholder="Имя Фамилия • Должность"
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-200 placeholder-zinc-600 focus:border-emerald-500/60 focus:outline-none"
                />
              </div>
            )}

            {/* Metric Preset: Metric Value */}
            {slide.preset === 'metric' && (
              <div>
                <label className="mb-1 block font-medium text-zinc-400">Цифра / Показатель</label>
                <input
                  type="text"
                  value={slide.content.metricValue || ''}
                  onChange={(e) => onUpdateContent({ metricValue: e.target.value })}
                  placeholder="Например: +142% или 4.8x"
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-200 placeholder-zinc-600 focus:border-emerald-500/60 focus:outline-none"
                />
              </div>
            )}

            {/* Product Preset: Price */}
            {slide.preset === 'product' && (
              <div>
                <label className="mb-1 block font-medium text-zinc-400">Цена / Тариф</label>
                <input
                  type="text"
                  value={slide.content.price || ''}
                  onChange={(e) => onUpdateContent({ price: e.target.value })}
                  placeholder="Например: от 45 000 ₽"
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-200 placeholder-zinc-600 focus:border-emerald-500/60 focus:outline-none"
                />
              </div>
            )}

            {/* Checklist Preset: Items list */}
            {slide.preset === 'checklist' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-medium text-zinc-400">Пункты чек-листа</label>
                  <button
                    onClick={() => {
                      const current = slide.content.checklistItems || [];
                      onUpdateContent({
                        checklistItems: [...current, `Пункт ${current.length + 1}`],
                      });
                    }}
                    className="flex items-center gap-1 rounded bg-zinc-900 border border-zinc-800 px-2 py-0.5 text-[10px] text-zinc-300 hover:bg-zinc-800"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Добавить</span>
                  </button>
                </div>
                {(slide.content.checklistItems || []).map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => {
                        const next = [...(slide.content.checklistItems || [])];
                        next[idx] = e.target.value;
                        onUpdateContent({ checklistItems: next });
                      }}
                      className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-zinc-200 focus:border-emerald-500/60 focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        const next = (slide.content.checklistItems || []).filter((_, i) => i !== idx);
                        onUpdateContent({ checklistItems: next });
                      }}
                      title="Удалить пункт"
                      className="p-1.5 text-zinc-500 hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Team Presets: 2 Members Editor */}
            {(slide.preset === 'team_management' || slide.preset === 'team_legal') && (
              <div className="space-y-4 pt-1">
                <div className="flex items-center justify-between border-t border-zinc-800/80 pt-3">
                  <span className="font-semibold text-zinc-200">Сотрудники · 2 карточки</span>
                  <span className="text-[10px] text-zinc-500 font-mono">9:16 стек</span>
                </div>

                {(() => {
                  const defaults = PRESET_DEFINITIONS[slide.preset].defaultContent.teamMembers || [];
                  const members = [0, 1].map((index) => slide.content.teamMembers?.[index] || (index === 1 ? defaults.find((member) => member.name !== slide.content.teamMembers?.[0]?.name) : defaults[index])).filter((member) => member !== undefined);

                  return members.map((_, mIdx) => {
                    const member = members[mIdx] || {
                      name: mIdx === 0 ? 'Эксперт 1' : 'Эксперт 2',
                      role: 'Специализация эксперта',
                      experience: '10+ лет',
                      achievement: '100% аудит',
                      achievementIcon: 'shield' as const,
                      image: DEFAULT_TEAM_AVATARS[mIdx]?.url || './team/vladimir.webp',
                      verified: true,
                    };

                    const handleMemberChange = (patch: Partial<typeof member>) => {
                      const next = [...members];
                      next[mIdx] = { ...member, ...patch };
                      onUpdateContent({ teamMembers: next });
                    };

                    const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (!file.type.startsWith('image/')) {
                        onShowToast('Пожалуйста, выберите файл изображения', false);
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const dataUrl = event.target?.result as string;
                        if (dataUrl) {
                          handleMemberChange({ image: dataUrl });
                          onShowToast(`Фото для «${member.name}» загружено`, true);
                        }
                      };
                      reader.readAsDataURL(file);
                    };

                    return (
                      <div
                        key={mIdx}
                        className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-zinc-300 text-[11px]">
                            {mIdx === 0 ? 'Первый эксперт' : 'Второй эксперт'}
                          </span>

                        </div>

                        {/* Avatar & Quick Select */}
                        <div>
                          <label className="mb-1 block text-[10px] font-medium text-zinc-400">
                            Фотография
                          </label>
                          <div className="flex items-center gap-2">
                            <img
                              src={member.image}
                              alt={member.name}
                              className="h-9 w-9 rounded-lg object-cover border border-white/20 bg-black shrink-0"
                            />
                            <div className="flex flex-wrap gap-1 flex-1">
                              {DEFAULT_TEAM_AVATARS.map((av) => (
                                <button
                                  key={av.id}
                                  type="button"
                                  onClick={() => handleMemberChange({ image: av.url })}
                                  className={`px-1.5 py-0.5 rounded text-[10px] transition border ${
                                    member.image === av.url
                                      ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                                      : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                                  }`}
                                >
                                  {av.name}
                                </button>
                              ))}
                              <label className="cursor-pointer px-1.5 py-0.5 rounded text-[10px] border border-dashed border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-zinc-200 flex items-center gap-1">
                                <Upload className="h-2.5 w-2.5" />
                                <span>Своё фото</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleAvatarUpload}
                                  className="hidden"
                                />
                              </label>
                            </div>
                          </div>
                        </div>

                        {/* Name */}
                        <div>
                          <label className="mb-1 block text-[10px] font-medium text-zinc-400">Имя</label>
                          <input
                            type="text"
                            value={member.name}
                            onChange={(e) => handleMemberChange({ name: e.target.value })}
                            placeholder="Имя специалиста"
                            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-zinc-200 placeholder-zinc-600 focus:border-emerald-500/60 focus:outline-none"
                          />
                        </div>

                        {/* Role / Description */}
                        <div>
                          <label className="mb-1 block text-[10px] font-medium text-zinc-400">
                            Должность и специализация
                          </label>
                          <textarea
                            rows={2}
                            value={member.role}
                            onChange={(e) => handleMemberChange({ role: e.target.value })}
                            placeholder="Описание задач и практики..."
                            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-zinc-200 placeholder-zinc-600 focus:border-emerald-500/60 focus:outline-none"
                          />
                        </div>

                        {/* Metrics Row */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="mb-1 block text-[10px] font-medium text-zinc-400">
                              Опыт (стаж)
                            </label>
                            <input
                              type="text"
                              value={member.experience || ''}
                              onChange={(e) => handleMemberChange({ experience: e.target.value })}
                              placeholder="15+ лет"
                              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-zinc-200 placeholder-zinc-600 focus:border-emerald-500/60 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-[10px] font-medium text-zinc-400">
                              Метрика / Результат
                            </label>
                            <input
                              type="text"
                              value={member.achievement || ''}
                              onChange={(e) => handleMemberChange({ achievement: e.target.value })}
                              placeholder="16 млрд ₽"
                              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-zinc-200 placeholder-zinc-600 focus:border-emerald-500/60 focus:outline-none"
                            />
                          </div>
                        </div>

                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: TYPOGRAPHY */}
        {activeTab === 'typography' && (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block font-semibold text-zinc-400">Семейство шрифтов</label>
              <div className="space-y-1">
                {FONT_OPTIONS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => onUpdateTypography({ fontFamily: f.family })}
                    className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition ${
                      slide.typography.fontFamily === f.family
                        ? 'border-emerald-500/60 bg-emerald-500/10 text-white'
                        : 'border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:bg-zinc-900'
                    }`}
                  >
                    <span style={{ fontFamily: f.family }} className="text-xs font-medium">
                      {f.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Font Scale Slider */}
            <div>
              <div className="flex justify-between font-medium text-zinc-400 mb-1">
                <span>Масштаб текста:</span>
                <span className="font-mono text-zinc-200">
                  {Math.round(slide.typography.fontSizeScale * 100)}%
                </span>
              </div>
              <input
                id="font-scale-slider"
                name="fontScale"
                aria-label="Масштаб текста"
                type="range"
                min="0.75"
                max="1.45"
                step="0.05"
                value={slide.typography.fontSizeScale}
                onChange={(e) =>
                  onUpdateTypography({ fontSizeScale: parseFloat(e.target.value) })
                }
                className="w-full accent-emerald-500"
              />
            </div>

            {/* Text Alignment */}
            <div>
              <label className="mb-1.5 block font-semibold text-zinc-400">Выравнивание</label>
              <div className="flex rounded-lg border border-zinc-800 bg-zinc-900 p-0.5">
                <button
                  onClick={() => onUpdateTypography({ align: 'left' })}
                  aria-label="Выравнивание по левому краю"
                  className={`flex flex-1 items-center justify-center rounded py-1.5 ${
                    slide.typography.align === 'left'
                      ? 'bg-zinc-800 text-white'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <AlignLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onUpdateTypography({ align: 'center' })}
                  aria-label="Выравнивание по центру"
                  className={`flex flex-1 items-center justify-center rounded py-1.5 ${
                    slide.typography.align === 'center'
                      ? 'bg-zinc-800 text-white'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <AlignCenter className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onUpdateTypography({ align: 'right' })}
                  aria-label="Выравнивание по правому краю"
                  className={`flex flex-1 items-center justify-center rounded py-1.5 ${
                    slide.typography.align === 'right'
                      ? 'bg-zinc-800 text-white'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <AlignRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Color Pickers */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="text-color-picker" className="mb-1 block font-medium text-zinc-400">Цвет текста</label>
                <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 p-1.5">
                  <input
                    id="text-color-picker"
                    name="textColor"
                    aria-label="Цвет текста"
                    type="color"
                    value={slide.typography.textColor}
                    onChange={(e) => onUpdateTypography({ textColor: e.target.value })}
                    className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent"
                  />
                  <span className="font-mono text-[11px] text-zinc-300">
                    {slide.typography.textColor}
                  </span>
                </div>
              </div>

              <div>
                <label htmlFor="tag-color-picker" className="mb-1 block font-medium text-zinc-400">Цвет акцента</label>
                <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 p-1.5">
                  <input
                    id="tag-color-picker"
                    name="tagColor"
                    aria-label="Цвет акцента"
                    type="color"
                    value={slide.typography.tagColor}
                    onChange={(e) => onUpdateTypography({ tagColor: e.target.value })}
                    className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent"
                  />
                  <span className="font-mono text-[11px] text-zinc-300">
                    {slide.typography.tagColor}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: BACKGROUND */}
        {activeTab === 'background' && (
          <div className="space-y-4">
            {/* Custom Photo Upload */}
            <div>
              <label className="mb-1.5 block font-semibold text-zinc-400">Собственное фото</label>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-700 bg-zinc-900/50 p-3 text-center transition hover:border-emerald-500 hover:bg-zinc-900">
                <Upload className="h-4 w-4 text-emerald-400" />
                <span className="font-medium text-zinc-200">Загрузить файл</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Dimming Slider */}
            <div>
              <div className="flex justify-between font-medium text-zinc-400 mb-1">
                <label htmlFor="dim-slider">Затемнение подложки:</label>
                <span className="font-mono text-zinc-200">{slide.background.dim}%</span>
              </div>
              <input
                id="dim-slider"
                name="dim"
                aria-label="Затемнение подложки"
                type="range"
                min="0"
                max="95"
                value={slide.background.dim}
                onChange={(e) => onUpdateBackground({ dim: parseInt(e.target.value, 10) })}
                className="w-full accent-emerald-500"
              />
            </div>

            {/* Pan & Zoom Controls */}
            {slide.background.type === 'image' && (
              <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
                <span className="font-semibold text-zinc-300 block">Кадрирование фото</span>

                <div>
                  <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
                    <label htmlFor="zoom-slider">Масштаб (Zoom):</label>
                    <span className="font-mono">{slide.background.zoom.toFixed(1)}x</span>
                  </div>
                  <input
                    id="zoom-slider"
                    name="zoom"
                    aria-label="Масштаб фото"
                    type="range"
                    min="1.0"
                    max="2.2"
                    step="0.05"
                    value={slide.background.zoom}
                    onChange={(e) =>
                      onUpdateBackground({ zoom: parseFloat(e.target.value) })
                    }
                    className="w-full accent-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="pan-x-slider" className="block text-[11px] text-zinc-400 mb-1">Смещение X:</label>
                    <input
                      id="pan-x-slider"
                      name="panX"
                      aria-label="Смещение X фото"
                      type="range"
                      min="-40"
                      max="40"
                      value={slide.background.panX}
                      onChange={(e) =>
                        onUpdateBackground({ panX: parseInt(e.target.value, 10) })
                      }
                      className="w-full accent-emerald-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="pan-y-slider" className="block text-[11px] text-zinc-400 mb-1">Смещение Y:</label>
                    <input
                      id="pan-y-slider"
                      name="panY"
                      aria-label="Смещение Y фото"
                      type="range"
                      min="-40"
                      max="40"
                      value={slide.background.panY}
                      onChange={(e) =>
                        onUpdateBackground({ panY: parseInt(e.target.value, 10) })
                      }
                      className="w-full accent-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
                    <label htmlFor="blur-slider">Размытие (Blur):</label>
                    <span className="font-mono">{slide.background.blur}px</span>
                  </div>
                  <input
                    id="blur-slider"
                    name="blur"
                    aria-label="Размытие фото"
                    type="range"
                    min="0"
                    max="16"
                    value={slide.background.blur}
                    onChange={(e) =>
                      onUpdateBackground({ blur: parseInt(e.target.value, 10) })
                    }
                    className="w-full accent-emerald-500"
                  />
                </div>
              </div>
            )}

            {/* Business Stock Images Gallery */}
            <div>
              <label className="mb-1.5 block font-semibold text-zinc-400">
                Галерея бизнес-фото
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {BUSINESS_STOCK_IMAGES.map((imgUrl, i) => (
                  <button
                    key={i}
                    onClick={() =>
                      onUpdateBackground({
                        type: 'image',
                        value: imgUrl,
                        panX: 0,
                        panY: 0,
                        zoom: 1,
                      })
                    }
                    className="relative aspect-video overflow-hidden rounded-lg border border-zinc-800 hover:border-emerald-500"
                  >
                    <img
                      src={imgUrl}
                      alt="Превью фона"
                      className="h-full w-full object-cover"
                      crossOrigin="anonymous"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Business Gradients */}
            <div>
              <label className="mb-1.5 block font-semibold text-zinc-400">
                Деловые градиенты
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {BUSINESS_GRADIENTS.map((grad, i) => (
                  <button
                    key={i}
                    onClick={() =>
                      onUpdateBackground({
                        type: 'gradient',
                        value: grad,
                      })
                    }
                    style={{ background: grad }}
                    className="h-8 rounded-lg border border-zinc-800 hover:border-emerald-500"
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: BRANDING & QR CODE */}
        {activeTab === 'modules' && (
          <div className="space-y-4">
            {/* Branding Badge */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <label htmlFor="branding-toggle" className="font-semibold text-zinc-200 cursor-pointer">Бейдж бренда</label>
                <input
                  id="branding-toggle"
                  name="brandingVisible"
                  aria-label="Включить бейдж бренда"
                  type="checkbox"
                  checked={slide.branding.visible}
                  onChange={(e) => onUpdateBranding({ visible: e.target.checked })}
                  className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-emerald-500 accent-emerald-500"
                />
              </div>

              {slide.branding.visible && (
                <>
                  <div>
                    <label htmlFor="branding-text-input" className="mb-1 block font-medium text-zinc-400">Текст бренда</label>
                    <input
                      id="branding-text-input"
                      name="brandingText"
                      aria-label="Текст бренда"
                      type="text"
                      value={slide.branding.text}
                      onChange={(e) => onUpdateBranding({ text: e.target.value })}
                      placeholder="Например: biznesbox.ru или @telegram"
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-zinc-200 focus:border-emerald-500/60 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label htmlFor="branding-dot-toggle" className="text-zinc-400 cursor-pointer">Индикатор активности</label>
                    <input
                      id="branding-dot-toggle"
                      name="brandingDot"
                      aria-label="Индикатор активности"
                      type="checkbox"
                      checked={slide.branding.statusDot}
                      onChange={(e) => onUpdateBranding({ statusDot: e.target.checked })}
                      className="h-3.5 w-3.5 accent-emerald-500"
                    />
                  </div>
                </>
              )}
            </div>

            {/* QR Code Module */}
            {slide.preset !== 'team_management' && slide.preset !== 'team_legal' && <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <label htmlFor="qr-toggle" className="font-semibold text-zinc-200 cursor-pointer">Генератор QR-кода</label>
                <input
                  id="qr-toggle"
                  name="qrVisible"
                  aria-label="Включить генератор QR-кода"
                  type="checkbox"
                  checked={slide.qrcode.visible}
                  onChange={(e) => onUpdateQrCode({ visible: e.target.checked })}
                  className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-emerald-500 accent-emerald-500"
                />
              </div>

              {slide.qrcode.visible && (
                <>
                  <div>
                    <label htmlFor="qr-url-input" className="mb-1 block font-medium text-zinc-400">Целевая ссылка (URL)</label>
                    <input
                      id="qr-url-input"
                      name="qrUrl"
                      aria-label="Целевая ссылка QR-кода"
                      type="text"
                      value={slide.qrcode.url}
                      onChange={(e) => onUpdateQrCode({ url: e.target.value })}
                      placeholder="https://example.com"
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-zinc-200 focus:border-emerald-500/60 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="qr-label-input" className="mb-1 block font-medium text-zinc-400">Подпись под QR</label>
                    <input
                      id="qr-label-input"
                      name="qrLabel"
                      aria-label="Подпись под QR-кодом"
                      type="text"
                      value={slide.qrcode.label}
                      onChange={(e) => onUpdateQrCode({ label: e.target.value })}
                      placeholder="Например: Сканируйте для входа"
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-zinc-200 focus:border-emerald-500/60 focus:outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-zinc-400 mb-1">
                      <label htmlFor="qr-size-slider">Размер QR:</label>
                      <span className="font-mono">{slide.qrcode.size}px</span>
                    </div>
                    <input
                      id="qr-size-slider"
                      name="qrSize"
                      aria-label="Размер QR-кода"
                      type="range"
                      min="48"
                      max="120"
                      value={slide.qrcode.size}
                      onChange={(e) => onUpdateQrCode({ size: parseInt(e.target.value, 10) })}
                      className="w-full accent-emerald-500"
                    />
                  </div>
                </>
              )}
            </div>}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex w-80 flex-shrink-0 flex-col border-l border-zinc-800/80 bg-zinc-950/70">
        {panelContent}
      </aside>

      {/* Mobile Drawer / Bottom Sheet */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden">
          <div
            className="fixed inset-0 bg-black/20"
            onClick={onCloseMobile}
          />
          <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Настройки слайда" tabIndex={-1} className="relative z-10 max-h-[85dvh] h-[55dvh] w-full rounded-t-3xl border-t border-zinc-800 bg-zinc-950 shadow-2xl safe-bottom">
            {panelContent}
          </div>
        </div>
      )}
    </>
  );
};
