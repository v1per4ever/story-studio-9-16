import { getSlideBlob } from './export';

export async function shareSlideNative(
  element: HTMLElement,
  title: string
): Promise<{ success: boolean; message: string }> {
  if (!navigator.share) {
    return {
      success: false,
      message: 'Web Share API не поддерживается в данном браузере',
    };
  }

  try {
    const blob = await getSlideBlob(element);
    if (!blob) {
      return { success: false, message: 'Не удалось подготовить изображение' };
    }

    const file = new File([blob], `${title}.jpg`, { type: 'image/jpeg' });

    if (navigator.canShare && !navigator.canShare({ files: [file] })) {
      return {
        success: false,
        message: 'Браузер не поддерживает прямую отправку файлов изображений',
      };
    }

    await navigator.share({
      title: title,
      files: [file],
    });

    return { success: true, message: 'История успешно передана в системное меню' };
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      return { success: true, message: 'Поделиться отменено' };
    }
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Ошибка при передаче истории',
    };
  }
}
