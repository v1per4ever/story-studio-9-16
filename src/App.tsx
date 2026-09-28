import { useState, useEffect, useCallback } from 'react';
import { useStoryStore } from './hooks/useStoryStore';
import { Header } from './components/Header';
import { SlideThumbnailStrip } from './components/SlideThumbnailStrip';
import { StoryStage } from './components/StoryStage';
import { InspectorPanel } from './components/InspectorPanel';
import { MobileBottomBar } from './components/MobileBottomBar';
import { Toast } from './components/Toast';
import { exportAllSlidesToZip } from './utils/export';

export function App() {
  const {
    slides,
    selectedSlideId,
    selectedSlide,
    selectedIndex,
    setSelectedSlideId,
    updateContent,
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
      const elementsToExport: { id: string; element: HTMLElement; index: number }[] = [];

      for (let i = 0; i < slides.length; i++) {
        const slideItem = slides[i];
        if (!slideItem) continue;
        setSelectedSlideId(slideItem.id);
        setExportProgress({ current: i + 1, total: slides.length });

        // Wait for React to render stage with current slide
        await new Promise((res) => setTimeout(res, 350));

        const stageEl = document.getElementById(`viewport-${slideItem.id}`);
        if (stageEl) {
          elementsToExport.push({
            id: slideItem.id,
            element: stageEl,
            index: i,
          });
        }
      }

      await exportAllSlidesToZip(elementsToExport, (current, total) => {
        setExportProgress({ current, total });
      });

      showToast(`Все ${slides.length} историй успешно сохранены в ZIP!`, true);
    } catch (err) {
      console.error('ZIP export error:', err);
      showToast('Ошибка при пакетном экспорте архива', false);
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
          onChangePreset={(preset) => {
            changePreset(selectedSlide.id, preset);
            showToast('Шаблон изменен');
          }}
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
