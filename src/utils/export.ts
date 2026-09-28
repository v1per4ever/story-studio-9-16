import { toJpeg, toBlob } from 'html-to-image';
import JSZip from 'jszip';

export async function exportSlideToJpeg(element: HTMLElement, filename: string): Promise<void> {
  if (document.fonts) {
    await document.fonts.ready;
  }

  const currentWidth = element.offsetWidth;
  const targetWidth = 1080;
  const pixelRatio = targetWidth / currentWidth;

  const dataUrl = await toJpeg(element, {
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
  if (document.fonts) {
    await document.fonts.ready;
  }

  const currentWidth = element.offsetWidth;
  const targetWidth = 1080;
  const pixelRatio = targetWidth / currentWidth;

  return await toBlob(element, {
    quality: 0.95,
    pixelRatio: pixelRatio,
    cacheBust: true,
    backgroundColor: '#000000',
  });
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
