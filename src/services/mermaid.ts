import mermaid from 'mermaid';
import type { ThemeMode } from '../types';

export function setMermaidTheme(theme: ThemeMode): void {
  mermaid.initialize({
    startOnLoad: false,
    theme: theme === 'dark' ? 'dark' : 'default',
    securityLevel: 'loose',
  });
}

// Initialize with dark theme by default
setMermaidTheme('dark');

/**
 * Validates a Mermaid diagram string.
 * Returns { valid: true } if valid, or { valid: false, error: string } if invalid.
 */
export async function validate(mermaidCode: string): Promise<{ valid: true } | { valid: false; error: string }> {
  try {
    await mermaid.parse(mermaidCode);
    return { valid: true };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Invalid Mermaid syntax';
    return { valid: false, error: message };
  }
}

/**
 * Renders a Mermaid diagram string to an SVG string.
 */
export async function render(mermaidCode: string, id: string = 'diagramsmith-diagram'): Promise<string> {
  const { svg } = await mermaid.render(id, mermaidCode);
  return svg;
}