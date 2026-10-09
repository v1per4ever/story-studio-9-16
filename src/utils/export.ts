import { toJpeg } from 'html-to-image';
import JSZip from 'jszip';
import { fitStoryContent } from './layout';

async function prepareCanvas(element: HTMLElement): Promise<void> {
  await document.fonts.ready;
  await new Promise<void>((resolve, reject) => {
    const ready = () => {
      if (element.hasAttribute('data-qr-error')) { finish(new Error('Не удалось создать QR-код. Проверьте ссылку.')); }
      else if (!element.hasAttribute('data-qr-pending')) { finish(); }
    };
    const observer = new MutationObserver(ready);
    const timer = setTimeout(() => finish(new Error('QR-код не готов. Повторите экспорт.')), 10000);
    const finish = (error?: Error) => { observer.disconnect(); clearTimeout(timer); error ? reject(error) : resolve(); };
    observer.observe(element, { attributes: true });
    ready();
  });
  await Promise.all(Array.from(element.querySelectorAll('img')).map(async (image) => {
    try { await image.decode(); } catch { throw new Error('Не удалось загрузить изображение слайда'); }
  }));
  await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  const content = element.querySelector<HTMLElement>('[data-story-content]');
  const body = content?.querySelector<HTMLElement>('[data-content-body]');
  if (content && body && fitStoryContent(content, body).overflow) {
    throw new Error('Контент не помещается в кадр. Сократите текст или уменьшите размер шрифта.');
  }
}

export async function exportSlideToJpeg(element: HTMLElement, filename: string): Promise<void> {
  await prepareCanvas(element);

  const currentWidth = element.offsetWidth || 360;
  const targetWidth = 1080;
  const pixelRatio = targetWidth / currentWidth;

  const dataUrl = await toJpeg(element, {
    filter: (node) => !(node instanceof HTMLElement && node.hasAttribute('data-editor-only')),
    width: 360, height: 640, style: { transform: 'none', boxShadow: 'none' },
    quality: 0.95,
    pixelRatio: pixelRatio,
    cacheBust: true,
    backgroundColor: '#000000',
  });

  const link = document.createElement('a');
  link.download = filename.endsWith('.jpg') ? filename : `${filename}.jpg`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function getSlideBlob(element: HTMLElement): Promise<Blob | null> {
  await prepareCanvas(element);

  const currentWidth = element.offsetWidth || 360;
  const targetWidth = 1080;
  const pixelRatio = targetWidth / currentWidth;

  const dataUrl = await toJpeg(element, {
    width: 360, height: 640, style: { transform: 'none', boxShadow: 'none' },
    quality: 0.95, pixelRatio, cacheBust: true, backgroundColor: '#000000',
    filter: (node) => !(node instanceof HTMLElement && node.hasAttribute('data-editor-only')),
  });
  return await (await fetch(dataUrl)).blob();
}

export async function exportAllSlidesToZip(
  slideElements: { id: string; element: HTMLElement; index: number }[],
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  const zip = new JSZip();
  const folder = zip.folder('stories_1080x1920');

  for (let i = 0; i < slideElements.length; i++) {
    const item = slideElements[i];
    if (!item) continue;
    if (onProgress) {
      onProgress(i + 1, slideElements.length);
    }

    const blob = await getSlideBlob(item.element);
    if (blob && folder) {
      const paddedIndex = String(item.index + 1).padStart(2, '0');
      folder.file(`story-${paddedIndex}.jpg`, blob);
    }

    // Brief delay to prevent browser thread saturation
    await new Promise((resolve) => setTimeout(resolve, 80));
  }

  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);

  const link = document.createElement('a');
  link.download = `stories-pack-${Date.now()}.zip`;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
