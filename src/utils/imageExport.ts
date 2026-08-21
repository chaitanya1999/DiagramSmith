/**
 * Turns the rendered Mermaid SVG into downloadable / copyable images.
 *
 * The SVG Mermaid produces is already self-contained — it carries its own <style>
 * block with concrete colours rather than referencing the app's CSS custom
 * properties — so it can go straight to disk. Only the sizing needs fixing up:
 * Mermaid emits `width="100%"` plus a `max-width` style, and neither a standalone
 * file nor a canvas rasteriser can turn those into pixels.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';
const FALLBACK_WIDTH = 800;
const FALLBACK_HEIGHT = 600;

/** Rasterisation multiplier. 2 keeps the PNG crisp on HiDPI displays. */
const DEFAULT_PNG_SCALE = 2;

interface PreparedSvg {
  markup: string;
  width: number;
  height: number;
}

/**
 * Normalises a Mermaid SVG into a standalone document: explicit pixel dimensions,
 * a declared namespace, and optionally a painted background rectangle.
 *
 * @param background CSS colour to paint behind the diagram, or `null` for transparency.
 */
function prepareSvg(svgMarkup: string, background: string | null): PreparedSvg {
  const doc = new DOMParser().parseFromString(svgMarkup, 'image/svg+xml');
  const svgEl = doc.documentElement as unknown as SVGSVGElement;

  if (!svgEl || svgEl.nodeName.toLowerCase() !== 'svg') {
    throw new Error('The rendered diagram is not a valid SVG document.');
  }

  const viewBox = svgEl.viewBox?.baseVal;
  const width = viewBox?.width || svgEl.width?.baseVal?.value || FALLBACK_WIDTH;
  const height = viewBox?.height || svgEl.height?.baseVal?.value || FALLBACK_HEIGHT;

  svgEl.setAttribute('xmlns', SVG_NS);
  svgEl.setAttribute('width', String(width));
  svgEl.setAttribute('height', String(height));
  // Mermaid's inline max-width would otherwise cap the standalone render.
  svgEl.style.removeProperty('max-width');

  if (background) {
    const rect = doc.createElementNS(SVG_NS, 'rect');
    // Anchor to the viewBox origin, which is not necessarily 0,0.
    rect.setAttribute('x', String(viewBox?.x ?? 0));
    rect.setAttribute('y', String(viewBox?.y ?? 0));
    rect.setAttribute('width', String(width));
    rect.setAttribute('height', String(height));
    rect.setAttribute('fill', background);
    svgEl.insertBefore(rect, svgEl.firstChild);
  }

  return { markup: new XMLSerializer().serializeToString(svgEl), width, height };
}

/** The current theme's diagram-panel colour, so an export matches what is on screen. */
export function getThemeBackground(): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue('--diagram-bg').trim();
  return value || '#ffffff';
}

export function svgToBlob(svgMarkup: string, background: string | null): Blob {
  const { markup } = prepareSvg(svgMarkup, background);
  return new Blob([`<?xml version="1.0" encoding="UTF-8"?>\n${markup}`], {
    type: 'image/svg+xml;charset=utf-8',
  });
}

export async function svgToPngBlob(
  svgMarkup: string,
  background: string | null,
  scale: number = DEFAULT_PNG_SCALE
): Promise<Blob> {
  const { markup, width, height } = prepareSvg(svgMarkup, background);

  // encodeURIComponent rather than btoa: the diagram may contain non-Latin-1
  // characters, which btoa throws on.
  const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;

  const image = new Image();
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('Could not rasterise the diagram.'));
    image.src = dataUrl;
  });

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));

  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas rendering is unavailable in this browser.');
  // A transparent export simply leaves the canvas unpainted.
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Could not encode the PNG.'));
    }, 'image/png');
  });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

/** Chrome and Edge support this fully; Firefox and Safari are patchier. */
export function canCopyImages(): boolean {
  return typeof ClipboardItem !== 'undefined' && typeof navigator.clipboard?.write === 'function';
}

export async function copyPngToClipboard(blob: Blob): Promise<void> {
  if (!canCopyImages()) {
    throw new Error('This browser does not support copying images to the clipboard.');
  }
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
}
