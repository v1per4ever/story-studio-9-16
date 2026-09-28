import React from 'react';
import {
  Undo2,
  Redo2,
  Plus,
  Download,
  RotateCcw,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react';

interface HeaderProps {
  slideCount: number;
  canUndo: boolean;
  canRedo: boolean;
  isExportingZip: boolean;
  exportProgress: { current: number; total: number } | null;
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
  onAddSlide: () => void;
  onExportAllZip: () => void;
  onToggleMobileInspector: () => void;
  isMobileInspectorOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  slideCount,
  canUndo,
  canRedo,
  isExportingZip,
  exportProgress,
  onUndo,
  onRedo,
  onReset,
  onAddSlide,
  onExportAllZip,
  onToggleMobileInspector,
  isMobileInspectorOpen,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md px-3 py-2.5 sm:px-6">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 shadow-sm">
            <Sparkles className="h-4 w-4 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight text-white">Story Studio</span>
              <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                9:16 HD
              </span>
            </div>
            <p className="hidden text-[11px] text-zinc-400 sm:block">
              Генератор историй и креативов • 1080×1920 px
            </p>
          </div>
        </div>

        {/* Action Center */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* History Controls */}
          <div className="flex items-center rounded-lg bg-zinc-900 border border-zinc-800 p-0.5">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              title="Отменить действие (Ctrl+Z)"
              aria-label="Отменить действие"
              className="flex h-8 w-8 items-center justify-center rounded text-zinc-400 transition hover:bg-zinc-800 hover:text-white disabled:pointer-events-none disabled:opacity-30"
            >
              <Undo2 className="h-4 w-4" />
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              title="Повторить действие (Ctrl+Shift+Z)"
              aria-label="Повторить действие"
              className="flex h-8 w-8 items-center justify-center rounded text-zinc-400 transition hover:bg-zinc-800 hover:text-white disabled:pointer-events-none disabled:opacity-30"
            >
              <Redo2 className="h-4 w-4" />
            </button>
            <button
              onClick={onReset}
              title="Сбросить к исходным слайдам"
              aria-label="Сбросить к исходным слайдам"
              className="hidden sm:flex h-8 w-8 items-center justify-center rounded text-zinc-400 transition hover:bg-zinc-800 hover:text-amber-400"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Add Slide */}
          <button
            onClick={onAddSlide}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/90 px-2.5 py-1.5 text-xs font-medium text-zinc-200 transition hover:bg-zinc-700 hover:text-white active:scale-95 sm:px-3 sm:text-xs"
          >
            <Plus className="h-3.5 w-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Слайд</span>
            <span className="sm:hidden">+Слайд</span>
          </button>

          {/* Export All as ZIP */}
          <button
            onClick={onExportAllZip}
            disabled={isExportingZip}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-500 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            <span>
              {isExportingZip && exportProgress
                ? `${exportProgress.current}/${exportProgress.total}`
                : `ZIP (${slideCount})`}
            </span>
          </button>

          {/* Mobile Inspector Toggle */}
          <button
            onClick={onToggleMobileInspector}
            aria-label="Панель настроек"
            className={`flex h-8 w-8 items-center justify-center rounded-lg border lg:hidden transition ${
              isMobileInspectorOpen
                ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
