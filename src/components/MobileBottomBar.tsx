import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Plus,
  Copy,
  Trash2,
} from 'lucide-react';

interface MobileBottomBarProps {
  currentIndex: number;
  totalSlides: number;
  canDelete: boolean;
  onPrevSlide: () => void;
  onNextSlide: () => void;
  onAddSlide: () => void;
  onDuplicateSlide: () => void;
  onDeleteSlide: () => void;
  onOpenInspector: () => void;
}

export const MobileBottomBar: React.FC<MobileBottomBarProps> = ({
  currentIndex,
  totalSlides,
  canDelete,
  onPrevSlide,
  onNextSlide,
  onAddSlide,
  onDuplicateSlide,
  onDeleteSlide,
  onOpenInspector,
}) => {
  return (
    <div className="sticky bottom-0 z-30 flex w-full flex-col border-t border-zinc-800/80 bg-zinc-950/95 backdrop-blur-md safe-bottom lg:hidden">
      <div className="flex items-center justify-between px-3 py-2">
        {/* Slide pagination controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={onPrevSlide}
            disabled={currentIndex === 0}
            aria-label="Предыдущий слайд"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 disabled:opacity-30 disabled:pointer-events-none active:scale-95"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <span className="min-w-[48px] text-center font-mono text-xs font-bold text-zinc-300">
            {currentIndex + 1} / {totalSlides}
          </span>

          <button
            onClick={onNextSlide}
            disabled={currentIndex === totalSlides - 1}
            aria-label="Следующий слайд"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 disabled:opacity-30 disabled:pointer-events-none active:scale-95"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Slide quick actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onDuplicateSlide}
            title="Дублировать"
            aria-label="Дублировать слайд"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white active:scale-95"
          >
            <Copy className="h-4 w-4" />
          </button>

          <button
            onClick={onDeleteSlide}
            disabled={!canDelete}
            title="Удалить"
            aria-label="Удалить слайд"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-red-400 disabled:opacity-30 disabled:pointer-events-none active:scale-95"
          >
            <Trash2 className="h-4 w-4" />
          </button>

          <button
            onClick={onAddSlide}
            title="Добавить слайд"
            aria-label="Добавить новый слайд"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-emerald-400 active:scale-95"
          >
            <Plus className="h-4 w-4" />
          </button>

          {/* Inspector trigger button */}
          <button
            onClick={onOpenInspector}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm active:scale-95"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Настроить</span>
          </button>
        </div>
      </div>
    </div>
  );
};
