import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { readProject, saveProject } from '../utils/storage';
import { z } from 'zod';
import {
  StorySlide,
  StorySlideSchema,
  PresetType,
  BackgroundConfig,
  TypographyConfig,
  BrandingConfig,
  QrCodeConfig,
  SlideContent,
} from '../types/story';
import { INITIAL_SLIDES, PRESET_DEFINITIONS, BUSINESS_STOCK_IMAGES } from '../constants/presets';

const STORAGE_KEY = 'story_studio_project_v1';
const MAX_HISTORY = 30;

function loadStoredSlides(): StorySlide[] {
  if (typeof window === 'undefined') return INITIAL_SLIDES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_SLIDES;
    const parsed = JSON.parse(raw);
    const result = z.array(StorySlideSchema).safeParse(parsed);
    if (result.success && result.data.length > 0) {
      return result.data;
    }
  } catch {
    // If parsing fails, fall back to initial slides
  }
  return INITIAL_SLIDES;
}

export function useStoryStore() {
  const [slides, setSlides] = useState<StorySlide[]>(() => loadStoredSlides());
  const [selectedSlideId, setSelectedSlideId] = useState<string>(() => {
    const initial = loadStoredSlides();
    return initial[0]?.id || 'slide-1';
  });

  const [historyPast, setHistoryPast] = useState<StorySlide[][]>([]);
  const [historyFuture, setHistoryFuture] = useState<StorySlide[][]>([]);

  const [storageReady, setStorageReady] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'loading' | 'saving' | 'saved' | 'error'>('loading');
  useEffect(() => {
    let cancelled = false;
    readProject().then((stored) => {
      const parsed = z.array(StorySlideSchema).safeParse(stored);
      if (!cancelled && parsed.success && parsed.data.length) setSlides(parsed.data);
    }).catch(() => { if (!cancelled) setSaveStatus('error'); })
      .finally(() => { if (!cancelled) setStorageReady(true); });
    return () => { cancelled = true; };
  }, []);
  const saveQueue = useRef(Promise.resolve());
  useEffect(() => {
    if (!storageReady) return;
    setSaveStatus('saving');
    let cancelled = false;
    const timer = setTimeout(() => {
      saveQueue.current = saveQueue.current.catch(() => {}).then(() => saveProject(slides));
      saveQueue.current.then(() => {
        if (!cancelled) setSaveStatus('saved');
      }).catch(() => {
        if (!cancelled) { setSaveStatus('error'); window.dispatchEvent(new CustomEvent('story-storage-error')); }
      });
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [slides, storageReady]);

  // Ensure selected slide is valid
  useEffect(() => {
    if (!slides.some((s) => s.id === selectedSlideId) && slides.length > 0) {
      const first = slides[0];
      if (first) {
        setSelectedSlideId(first.id);
      }
    }
  }, [slides, selectedSlideId]);

  const lastEdit = useRef(0);
  const recordChange = useCallback((newSlides: StorySlide[]) => {
    const now = Date.now();
      const editing = document.activeElement?.matches('input, textarea, [contenteditable=true]');
      const grouped = editing && now - lastEdit.current < 800;
      lastEdit.current = editing ? now : 0;
    setHistoryPast((past) => {
      const nextPast = grouped ? past : [...past, slides];
      if (nextPast.length > MAX_HISTORY) {
        return nextPast.slice(nextPast.length - MAX_HISTORY);
      }
      return nextPast;
    });
    setHistoryFuture([]);
    setSlides(newSlides);
  }, [slides]);

  const selectedSlide = useMemo(() => {
    return slides.find((s) => s.id === selectedSlideId) || slides[0] || INITIAL_SLIDES[0];
  }, [slides, selectedSlideId]);

  const selectedIndex = useMemo(() => {
    return Math.max(0, slides.findIndex((s) => s.id === selectedSlideId));
  }, [slides, selectedSlideId]);

  const undo = useCallback(() => {
    if (historyPast.length === 0) return;
    const previous = historyPast[historyPast.length - 1];
    if (!previous) return;

    setHistoryPast((past) => past.slice(0, past.length - 1));
    setHistoryFuture((future) => [slides, ...future]);
    lastEdit.current = 0;
    setSlides(previous);
  }, [historyPast, slides]);

  const redo = useCallback(() => {
    if (historyFuture.length === 0) return;
    const next = historyFuture[0];
    if (!next) return;

    setHistoryFuture((future) => future.slice(1));
    setHistoryPast((past) => [...past, slides]);
    lastEdit.current = 0;
    setSlides(next);
  }, [historyFuture, slides]);

  const updateSlide = useCallback(
    (id: string, updater: (prev: StorySlide) => StorySlide) => {
      const nextSlides = slides.map((s) => (s.id === id ? updater(s) : s));
      recordChange(nextSlides);
    },
    [slides, recordChange]
  );

  const updateContent = useCallback(
    (id: string, patch: Partial<SlideContent>) => {
      updateSlide(id, (prev) => ({
        ...prev,
        content: { ...prev.content, ...patch },
      }));
    },
    [updateSlide]
  );

  const updateBackground = useCallback(
    (id: string, patch: Partial<BackgroundConfig>) => {
      updateSlide(id, (prev) => ({
        ...prev,
        background: { ...prev.background, ...patch },
      }));
    },
    [updateSlide]
  );

  const updateTypography = useCallback(
    (id: string, patch: Partial<TypographyConfig>) => {
      updateSlide(id, (prev) => ({
        ...prev,
        typography: { ...prev.typography, ...patch },
      }));
    },
    [updateSlide]
  );

  const updateBranding = useCallback(
    (id: string, patch: Partial<BrandingConfig>) => {
      updateSlide(id, (prev) => ({
        ...prev,
        branding: { ...prev.branding, ...patch },
      }));
    },
    [updateSlide]
  );

  const updateQrCode = useCallback(
    (id: string, patch: Partial<QrCodeConfig>) => {
      updateSlide(id, (prev) => ({
        ...prev,
        qrcode: { ...prev.qrcode, ...patch },
      }));
    },
    [updateSlide]
  );

  const changePreset = useCallback(
    (id: string, preset: PresetType, useExample = false) => {
      const def = PRESET_DEFINITIONS[preset];
      if (!def) return;
      if (slides.find((slide) => slide.id === id)?.preset === preset && !useExample) return;
      updateSlide(id, (prev) => ({
        ...prev,
        preset,
        content: {
          ...def.defaultContent,
          ...(useExample ? {} : prev.content),
        },
      }));
    },
    [updateSlide, slides]
  );

  const addSlide = useCallback(
    (preset: PresetType = 'editorial') => {
      const def = PRESET_DEFINITIONS[preset];
      const nextIndex = slides.length;
      const bgImage = BUSINESS_STOCK_IMAGES[nextIndex % BUSINESS_STOCK_IMAGES.length];
      const newId = crypto.randomUUID();

      const newSlide: StorySlide = {
        id: newId,
        preset,
        background: {
          type: 'image',
          value: bgImage || BUSINESS_STOCK_IMAGES[0] || '',
          dim: 52,
          zoom: 1,
          panX: 0,
          panY: 0,
          blur: 0,
        },
        typography: {
          fontFamily: "'Inter', sans-serif",
          textColor: '#ffffff',
          tagColor: '#38bdf8',
          align: 'center',
          fontSizeScale: 1.0,
          letterSpacing: 'normal',
          lineHeight: '1.25',
        },
        branding: {
          visible: true,
          text: 'biznesbox.ru',
          statusDot: true,
          position: 'bottom',
        },
        qrcode: {
          visible: false,
          url: 'https://biznesbox.ru',
          label: 'Перейти на сайт',
          size: 64,
        },
        content: {
          ...def.defaultContent,
        },
        showCounter: true,
        destination: 'stories',
      };

      recordChange([...slides, newSlide]);
      setSelectedSlideId(newId);
    },
    [slides, recordChange]
  );

  const duplicateSlide = useCallback(
    (id: string) => {
      const targetIndex = slides.findIndex((s) => s.id === id);
      if (targetIndex === -1) return;
      const target = slides[targetIndex];
      if (!target) return;

      const newId = crypto.randomUUID();
      const duplicated: StorySlide = {
        ...JSON.parse(JSON.stringify(target)),
        id: newId,
      };

      const nextSlides = [...slides];
      nextSlides.splice(targetIndex + 1, 0, duplicated);
      recordChange(nextSlides);
      setSelectedSlideId(newId);
    },
    [slides, recordChange]
  );

  const deleteSlide = useCallback(
    (id: string) => {
      if (slides.length <= 1) return;
      const targetIndex = slides.findIndex((s) => s.id === id);
      const nextSlides = slides.filter((s) => s.id !== id);
      recordChange(nextSlides);

      if (selectedSlideId === id) {
        const nextTarget = nextSlides[Math.min(targetIndex, nextSlides.length - 1)];
        if (nextTarget) {
          setSelectedSlideId(nextTarget.id);
        }
      }
    },
    [slides, selectedSlideId, recordChange]
  );

  const reorderSlides = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (fromIndex < 0 || fromIndex >= slides.length) return;
      if (toIndex < 0 || toIndex >= slides.length) return;
      if (fromIndex === toIndex) return;

      const nextSlides = [...slides];
      const [moved] = nextSlides.splice(fromIndex, 1);
      if (moved) {
        nextSlides.splice(toIndex, 0, moved);
        recordChange(nextSlides);
      }
    },
    [slides, recordChange]
  );

  const resetToDefault = useCallback(() => {
    recordChange(INITIAL_SLIDES);
    const first = INITIAL_SLIDES[0];
    if (first) {
      setSelectedSlideId(first.id);
    }
  }, [recordChange]);

  return {
    slides,
    storageReady,
    saveStatus,
    selectedSlideId,
    selectedSlide,
    selectedIndex,
    setSelectedSlideId,
    updateSlide,
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
    importProject: (project: StorySlide[]) => { recordChange(project); setSelectedSlideId(project[0].id); },
    undo,
    redo,
    canUndo: historyPast.length > 0,
    canRedo: historyFuture.length > 0,
  };
}
