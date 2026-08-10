import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/DiagramSmith/',
  optimizeDeps: {
    // Mermaid uses dynamic imports to load diagram chunks at runtime.
    // Pre-bundling rewrites those URLs with the base path (/DiagramSmith/),
    // which breaks loading (e.g. architecture diagrams).
    // Excluding mermaid lets the chunks load from their real location.
    exclude: ['mermaid'],
    // Mermaid's chunks import these packages bare. They are CJS-only (no ESM),
    // so Vite must pre-bundle them to provide proper ESM default-export interop.
    include: [
      'dayjs',
      'cytoscape',
      'cytoscape-fcose',
      'cytoscape-cose-bilkent',
      'roughjs',
      '@braintree/sanitize-url',
    ],
  },
})
