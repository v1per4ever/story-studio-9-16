/** Measure the final layout: zoom changes line wrapping as well as height. */
export function fitStoryContent(content: HTMLElement, body: HTMLElement) {
  let fit = 1;
  const available = content.clientHeight - 8;
  for (let step = 0; step <= 8; step++) {
    fit = 1 - step / 100;
    body.style.zoom = String(fit);
    const scale = content.getBoundingClientRect().height / content.clientHeight || 1;
    const bounds = body.getBoundingClientRect();
    const height = Math.max(bounds.height / scale, body.scrollHeight * fit);
    const width = Math.max(bounds.width / scale, body.scrollWidth * fit);
    if (height <= available + 1 && width <= content.clientWidth + 1) {
      return { fit, overflow: false };
    }
  }
  return { fit, overflow: true };
}
