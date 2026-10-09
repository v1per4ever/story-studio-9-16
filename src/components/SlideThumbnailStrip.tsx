import React from 'react';
import { StoryStage } from './StoryStage';
import { StorySlide } from '../types/story';
import { Plus, Copy, Trash2, ArrowUp, ArrowDown } from 'lucide-react';

interface SlideThumbnailStripProps {
  slides: StorySlide[];
  selectedSlideId: string;
  onSelectSlide: (id: string) => void;
  onDuplicateSlide: (id: string) => void;
  onDeleteSlide: (id: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onAddSlide: () => void;
}

export const SlideThumbnailStrip: React.FC<SlideThumbnailStripProps> = ({
  slides,
  selectedSlideId,
  onSelectSlide,
  onDuplicateSlide,
  onDeleteSlide,
  onMoveUp,
  onMoveDown,
  onAddSlide,
}) => {
  return (
    <aside className="hidden lg:flex w-44 flex-shrink-0 flex-col border-r border-zinc-800/80 bg-zinc-950/60 p-4 overflow-y-auto">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold tracking-wider uppercase text-zinc-400">
          Слайды ({slides.length})
        </span>
        <button
          onClick={onAddSlide}
          title="Добавить новый слайд"
          className="flex items-center gap-1 rounded bg-zinc-900 border border-zinc-800 px-2 py-1 text-[11px] font-medium text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
        >
          <Plus className="h-3 w-3 text-emerald-400" />
          <span>Новый</span>
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {slides.map((slide, index) => {
          const isSelected = slide.id === selectedSlideId;
          const slideNumber = String(index + 1).padStart(2, '0');

          return (
            <div
              key={slide.id}
              role="button" tabIndex={0} aria-label={`Выбрать слайд ${index + 1}`} aria-pressed={isSelected}
              onKeyDown={(e) => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onSelectSlide(slide.id); } }}
              onClick={() => onSelectSlide(slide.id)}
              className={`group relative flex cursor-pointer flex-col gap-2 rounded-xl border p-2.5 transition-all ${
                isSelected
                  ? 'border-emerald-500/60 bg-zinc-900 shadow-md shadow-emerald-500/5'
                  : 'border-zinc-800/80 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/70'
              }`}
            >
              {/* Header row with index and actions */}
              <div className="flex items-center justify-between text-xs">
                <span
                  className={`font-mono text-[11px] font-bold ${
                    isSelected ? 'text-emerald-400' : 'text-zinc-500'
                  }`}
                >
                  #{slideNumber}
                </span>

                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                  {/* Move Up */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveUp(index);
                    }}
                    disabled={index === 0}
                    title="Переместить вверх"
                    className="p-1 rounded text-zinc-400 hover:bg-zinc-800 hover:text-white disabled:pointer-events-none disabled:opacity-20"
                  >
                    <ArrowUp className="h-3 w-3" />
                  </button>

                  {/* Move Down */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveDown(index);
                    }}
                    disabled={index === slides.length - 1}
                    title="Переместить вниз"
                    className="p-1 rounded text-zinc-400 hover:bg-zinc-800 hover:text-white disabled:pointer-events-none disabled:opacity-20"
                  >
                    <ArrowDown className="h-3 w-3" />
                  </button>

                  {/* Duplicate */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicateSlide(slide.id);
                    }}
                    title="Дублировать слайд"
                    className="p-1 rounded text-zinc-400 hover:bg-zinc-800 hover:text-white"
                  >
                    <Copy className="h-3 w-3" />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSlide(slide.id);
                    }}
                    disabled={slides.length <= 1}
                    title="Удалить слайд"
                    className="p-1 rounded text-zinc-400 hover:bg-red-500/20 hover:text-red-400 disabled:pointer-events-none disabled:opacity-20"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Mini preview thumbnail */}
              <div className="overflow-hidden rounded-lg">
                <StoryStage thumbnailWidth={120} slide={slide} slideIndex={index} totalSlides={slides.length} onUpdateContent={() => {}} onUpdateBrandingText={() => {}} onShowToast={() => {}} />
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={onAddSlide}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-800 py-3 text-xs font-medium text-zinc-400 transition hover:border-zinc-700 hover:bg-zinc-900/50 hover:text-zinc-200"
      >
        <Plus className="h-3.5 w-3.5 text-emerald-400" />
        <span>Добавить слайд</span>
      </button>
    </aside>
  );
};
