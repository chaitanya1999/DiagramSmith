import { useEffect, useRef, useState, useCallback } from 'react';
import Panzoom from '@panzoom/panzoom';
import { render } from '../services/mermaid';

interface DiagramViewProps {
  mermaidCode: string;
  isLoading?: boolean;
}

const MIN_SCALE = 0.3;
const MAX_SCALE = 10;
const DEFAULT_SCALE = 2.5;

export function DiagramView({ mermaidCode, isLoading }: DiagramViewProps) {
  const svgWrapperRef = useRef<HTMLDivElement>(null);
  const panzoomRef = useRef<ReturnType<typeof Panzoom> | null>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(DEFAULT_SCALE);
  const renderIdRef = useRef(0);

  // Render SVG from mermaid code
  useEffect(() => {
    let cancelled = false;
    setError(null);

    render(mermaidCode, `diagram-${++renderIdRef.current}`)
      .then((result) => {
        if (!cancelled) {
          setSvg(result);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          const message = e instanceof Error ? e.message : 'Failed to render diagram';
          setError(message);
          setSvg(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [mermaidCode]);

  // Initialize Panzoom when SVG changes
  useEffect(() => {
    if (!svgWrapperRef.current || !svg) return;

    // Destroy previous instance
    if (panzoomRef.current) {
      panzoomRef.current.destroy();
      panzoomRef.current = null;
    }

    const elem = svgWrapperRef.current;

    const panzoom = Panzoom(elem, {
      maxScale: MAX_SCALE,
      minScale: MIN_SCALE,
      step: 0.1,
      startScale: DEFAULT_SCALE,
      startX: 0,
      startY: 0,
      canvas: false,
      pinchAndPan: true,
    });

    panzoomRef.current = panzoom;
    setScale(panzoom.getScale());

    // Wheel zoom (no modifier key needed)
    const wheelHandler = (e: WheelEvent) => {
      e.preventDefault();
      panzoom.zoomWithWheel(e);
      setScale(panzoom.getScale());
    };

    // Attach to the parent so the entire diagram area responds
    const parent = elem.parentElement;
    if (parent) {
      parent.addEventListener('wheel', wheelHandler, { passive: false });
    }

    return () => {
      if (parent) {
        parent.removeEventListener('wheel', wheelHandler);
      }
      panzoom.destroy();
      panzoomRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [svg]);

  const handleZoomIn = useCallback(() => {
    if (panzoomRef.current) {
      panzoomRef.current.zoomIn();
      setScale(panzoomRef.current.getScale());
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (panzoomRef.current) {
      panzoomRef.current.zoomOut();
      setScale(panzoomRef.current.getScale());
    }
  }, []);

  const handleReset = useCallback(() => {
    if (panzoomRef.current) {
      panzoomRef.current.reset({ animate: true });
      setScale(panzoomRef.current.getScale());
    }
  }, []);

  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newScale = parseFloat(e.target.value) / 100;
    if (panzoomRef.current) {
      panzoomRef.current.zoom(newScale);
      setScale(panzoomRef.current.getScale());
    }
  }, []);

  return (
    <div className="diagram-view h-100 position-relative" style={{ overflow: 'hidden' }}>
      {isLoading && (
        <div className="position-absolute top-0 start-0 end-0 text-center py-2 loading-overlay" style={{ zIndex: 10 }}>
          <div className="spinner-border spinner-border-sm me-2" role="status" />
          Generating diagram...
        </div>
      )}

      {/* Zoom controls overlay */}
      {svg && (
        <div className="position-absolute top-0 end-0 m-2 d-flex flex-column align-items-center gap-1 zoom-controls" style={{ zIndex: 5 }}>
          <button className="btn btn-sm btn-outline-secondary border-0 zoom-btn" onClick={handleZoomIn} title="Zoom in">
            <strong>+</strong>
          </button>
          <input
            type="range"
            className="form-range zoom-slider"
            min={MIN_SCALE * 100}
            max={MAX_SCALE * 100}
            step={5}
            value={Math.round(scale * 100)}
            onChange={handleSliderChange}
            title={`Zoom: ${Math.round(scale * 100)}%`}
          />
          <button className="btn btn-sm btn-outline-secondary border-0 zoom-btn" onClick={handleZoomOut} title="Zoom out">
            <strong>−</strong>
          </button>
          <button className="btn btn-sm btn-outline-secondary border-0 zoom-btn" onClick={handleReset} title="Reset zoom to 250%">
            ⟲
          </button>
          <span className="text-center small zoom-label rounded px-1 fw-bold">
            {Math.round(scale * 100)}%
          </span>
        </div>
      )}

      {error ? (
        <div className="text-danger text-center p-4">
          <p className="mb-2">⚠ Render Error</p>
          <p className="small mb-0">{error}</p>
        </div>
      ) : svg ? (
        <div
          className="w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ cursor: 'grab', touchAction: 'none' }}
        >
          <div
            ref={svgWrapperRef}
            style={{ display: 'inline-block' }}
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        </div>
      ) : (
        <div className="d-flex align-items-center justify-content-center h-100 text-muted">
          <div className="spinner-border" role="status" />
        </div>
      )}
    </div>
  );
}