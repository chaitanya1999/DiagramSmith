import { useEffect, useRef, useState, useCallback } from 'react';
import Panzoom from '@panzoom/panzoom';
import { render } from '../services/mermaid';

interface DiagramViewProps {
  mermaidCode: string;
  isLoading?: boolean;
}

export function DiagramView({ mermaidCode, isLoading }: DiagramViewProps) {
  const svgWrapperRef = useRef<HTMLDivElement>(null);
  const panzoomRef = useRef<ReturnType<typeof Panzoom> | null>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
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
      maxScale: 5,
      minScale: 0.3,
      step: 0.1,
      startScale: 1,
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

  return (
    <div className="diagram-view h-100 position-relative" style={{ overflow: 'hidden' }}>
      {isLoading && (
        <div className="position-absolute top-0 start-0 end-0 text-center py-2 bg-dark bg-opacity-75 text-white" style={{ zIndex: 10 }}>
          <div className="spinner-border spinner-border-sm me-2" role="status" />
          Generating diagram...
        </div>
      )}

      {/* Zoom controls overlay */}
      {svg && (
        <div className="position-absolute top-0 end-0 m-2 d-flex flex-column gap-1" style={{ zIndex: 5 }}>
          <button className="btn btn-sm btn-dark bg-opacity-75 border-0" onClick={handleZoomIn} title="Zoom in">
            <strong>+</strong>
          </button>
          <button className="btn btn-sm btn-dark bg-opacity-75 border-0" onClick={handleZoomOut} title="Zoom out">
            <strong>−</strong>
          </button>
          <button className="btn btn-sm btn-dark bg-opacity-75 border-0" onClick={handleReset} title="Reset zoom">
            ⟲
          </button>
          <span className="text-center text-white small bg-dark bg-opacity-50 rounded px-1">
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