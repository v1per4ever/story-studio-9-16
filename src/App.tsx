import { useState, useEffect, useCallback } from 'react';
import { useStoryStore } from './hooks/useStoryStore';
import { Header } from './components/Header';
import { SlideThumbnailStrip } from './components/SlideThumbnailStrip';
import { StoryStage } from './components/StoryStage';
import { InspectorPanel } from './components/InspectorPanel';
import { MobileBottomBar } from './components/MobileBottomBar';
import { Toast } from './components/Toast';
import { z } from 'zod';
import { StorySlideSchema } from './types/story';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { exportAllSlidesToZip } from './utils/export';

export function App() {
  const {
    slides,
    storageReady,
    saveStatus,
    selectedSlideId,
    selectedSlide,
    selectedIndex,
    setSelectedSlideId,
    updateContent,
    updateSlide,
    updateBackground,
    updateTypography,
    updateBranding,
    updateQrCode,
    changePreset,
    addSlide,
    duplicateSlide,
    deleteSlide,
    reorderSlides,
    resetToDefault,
    importProject,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useStoryStore();

  const [isMobileInspectorOpen, setIsMobileInspectorOpen] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; isSuccess: boolean } | null>(null);
  const [isExportingZip, setIsExportingZip] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<{ current: number; total: number } | null>(null);

  const showToast = useCallback((message: string, isSuccess: boolean = true) => {
    setToast({ message, isSuccess });
  }, []);

  useEffect(() => {
    const onError = () => showToast('Не удалось сохранить проект. Сохраните копию проекта в файл.', false);
    window.addEventListener('story-storage-error', onError);
    return () => window.removeEventListener('story-storage-error', onError);
  }, [showToast]);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  // Global Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when user is typing in form inputs or contenteditable elements
      const activeEl = document.activeElement;
      const isInput =
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.getAttribute('contenteditable') === 'true');

      if (isInput) return;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          redo();
          showToast('Действие повторено');
        } else {
          e.preventDefault();
          undo();
          showToast('Действие отменено');
        }
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        duplicateSlide(selectedSlide.id);
        showToast('Слайд продублирован');
        return;
      }

      if (!isInput) {
        if (e.key === 'ArrowLeft' && selectedIndex > 0) {
          e.preventDefault();
          const prev = slides[selectedIndex - 1];
          if (prev) setSelectedSlideId(prev.id);
        } else if (e.key === 'ArrowRight' && selectedIndex < slides.length - 1) {
          e.preventDefault();
          const next = slides[selectedIndex + 1];
          if (next) setSelectedSlideId(next.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, duplicateSlide, selectedSlide.id, selectedIndex, slides, setSelectedSlideId, showToast]);

  // Handle Export All Slides to ZIP
  const handleExportAllZip = async () => {
    if (isExportingZip) return;
    setIsExportingZip(true);
    showToast(`Подготовка к экспорту ${slides.length} историй...`);

    try {
      // Temporarily cycle through all slides to capture their DOM elements,
      // or export the current stage sequentially by selecting them
      const container = document.createElement('div');
      container.style.cssText = 'position:fixed;left:-10000px;top:0;width:600px;height:900px;';
      document.body.appendChild(container);
      const root = createRoot(container);
      try {
        const elementsToExport: { id: string; element: HTMLElement; index: number }[] = [];
        // Keep every canvas mounted until the archive is complete.
        flushSync(() => root.render(<>{slides.map((slide, index) => (
          <StoryStage key={slide.id} slide={slide} slideIndex={index} totalSlides={slides.length}
            onUpdateContent={() => {}} onUpdateBrandingText={() => {}} onShowToast={() => {}} />
        ))}</>));
        for (let index = 0; index < slides.length; index++) {
          const element = container.querySelector<HTMLElement>(`[id="viewport-${slides[index].id}"]`);
          if (!element) throw new Error('Не найден холст слайда');
          elementsToExport.push({ id: slides[index].id, element, index });
        }
        await exportAllSlidesToZip(elementsToExport, (current, total) => setExportProgress({ current, total }));
      } finally {
        root.unmount();
        container.remove();
      }

      showToast(`Все ${slides.length} историй успешно сохранены в ZIP!`, true);
    } catch (err) {
      console.error('ZIP export error:', err);
      showToast(err instanceof Error ? err.message : 'Ошибка при пакетном экспорте архива', false);
    } finally {
      setIsExportingZip(false);
      setExportProgress(null);
    }
  };

  const handlePrevSlide = () => {
    if (selectedIndex > 0) {
      const prev = slides[selectedIndex - 1];
      if (prev) setSelectedSlideId(prev.id);
    }
  };

  const handleNextSlide = () => {
    if (selectedIndex < slides.length - 1) {
      const next = slides[selectedIndex + 1];
      if (next) setSelectedSlideId(next.id);
    }
  };

  if (!storageReady) return <div className="flex h-[100dvh] items-center justify-center bg-zinc-950 text-zinc-200" role="status">Загрузка проекта…</div>;

  return (
    <div className="flex h-[100dvh] w-full flex-col bg-zinc-950 text-zinc-100 overflow-hidden select-none">
      {/* App Header */}
      <Header
        slideCount={slides.length}
        canUndo={canUndo}
        canRedo={canRedo}
        isExportingZip={isExportingZip}
        exportProgress={exportProgress}
        onUndo={undo}
        onRedo={redo}
        onReset={() => {
          if (window.confirm('Сбросить все слайды к базовым шаблонам?')) {
            resetToDefault();
            showToast('Слайды сброшены');
          }
        }}
        onAddSlide={() => {
          addSlide();
          showToast(`Слайд #${slides.length + 1} добавлен`);
        }}
        onExportAllZip={handleExportAllZip}
        onToggleMobileInspector={() => setIsMobileInspectorOpen(!isMobileInspectorOpen)}
        isMobileInspectorOpen={isMobileInspectorOpen}
      />

      <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 sm:gap-3 px-4 py-1 text-xs text-zinc-400 bg-zinc-950/80 border-b border-zinc-900/60">
        <span role="status">{saveStatus === 'saved' ? 'Сохранено на устройстве' : saveStatus === 'error' ? 'Ошибка сохранения' : 'Сохранение…'}</span>
        <label className="cursor-pointer underline underline-offset-2">Открыть проект
          <input type="file" accept=".json,application/json" className="sr-only" aria-label="Открыть проект" onChange={async (event) => {
            const file = event.target.files?.[0]; if (!file) return;
            try {
              const parsed = z.array(StorySlideSchema).min(1).parse(JSON.parse(await file.text()));
              if (new Set(parsed.map((slide) => slide.id)).size !== parsed.length) throw new Error('Повторяющиеся ID');
              importProject(parsed); showToast('Проект открыт. Предыдущий проект можно вернуть кнопкой отмены.');
            } catch { showToast('Не удалось открыть файл проекта', false); }
            event.target.value = '';
          }} />
        </label>
        <button className="underline underline-offset-2" onClick={() => {
          const url = URL.createObjectURL(new Blob([JSON.stringify(slides, null, 2)], {type: 'application/json'}));
          const link = document.createElement('a'); link.href = url; link.download = 'story-project.json'; link.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        }}>Сохранить проект</button>
      </div>
      {/* Main Studio Workspace */}
      <main className="flex flex-1 overflow-hidden relative">
        {/* Left Side: Thumbnail Strip (Desktop) */}
        <SlideThumbnailStrip
          slides={slides}
          selectedSlideId={selectedSlideId}
          onSelectSlide={setSelectedSlideId}
          onDuplicateSlide={(id) => {
            duplicateSlide(id);
            showToast('Слайд продублирован');
          }}
          onDeleteSlide={(id) => {
            deleteSlide(id);
            showToast('Слайд удален');
          }}
          onMoveUp={(index) => reorderSlides(index, index - 1)}
          onMoveDown={(index) => reorderSlides(index, index + 1)}
          onAddSlide={() => {
            addSlide();
            showToast(`Слайд #${slides.length + 1} добавлен`);
          }}
        />

        {/* Center: Stage Canvas Preview */}
        <StoryStage
          key={selectedSlide.id}
          slide={selectedSlide}
          slideIndex={selectedIndex}
          totalSlides={slides.length}
          onUpdateContent={(patch) => updateContent(selectedSlide.id, patch)}
          onUpdateBrandingText={(text) => updateBranding(selectedSlide.id, { text })}
          onShowToast={showToast}
        />

        {/* Right Side: Inspector Panel (Desktop & Mobile) */}
        <InspectorPanel
          slide={selectedSlide}
          isOpenMobile={isMobileInspectorOpen}
          onCloseMobile={() => setIsMobileInspectorOpen(false)}
          onChangePreset={(preset, useExample) => {
            changePreset(selectedSlide.id, preset, useExample);
            showToast('Шаблон изменен');
          }}
          onUpdateDestination={(destination) => updateSlide(selectedSlide.id, (previous) => ({ ...previous, destination }))}
          onUpdateContent={(patch) => updateContent(selectedSlide.id, patch)}
          onUpdateBackground={(patch) => updateBackground(selectedSlide.id, patch)}
          onUpdateTypography={(patch) => updateTypography(selectedSlide.id, patch)}
          onUpdateBranding={(patch) => updateBranding(selectedSlide.id, patch)}
          onUpdateQrCode={(patch) => updateQrCode(selectedSlide.id, patch)}
          onShowToast={showToast}
        />
      </main>

      {/* Mobile Bottom Dock */}
      <MobileBottomBar
        currentIndex={selectedIndex}
        totalSlides={slides.length}
        canDelete={slides.length > 1}
        onPrevSlide={handlePrevSlide}
        onNextSlide={handleNextSlide}
        onAddSlide={() => {
          addSlide();
          showToast(`Слайд #${slides.length + 1} добавлен`);
        }}
        onDuplicateSlide={() => {
          duplicateSlide(selectedSlide.id);
          showToast('Слайд продублирован');
        }}
        onDeleteSlide={() => {
          deleteSlide(selectedSlide.id);
          showToast('Слайд удален');
        }}
        onOpenInspector={() => setIsMobileInspectorOpen(true)}
      />

      {/* Toast Notification */}
      <Toast message={toast?.message || null} isSuccess={toast?.isSuccess} />
    </div>
  );
}
export default App;
