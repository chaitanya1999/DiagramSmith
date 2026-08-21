import { useEffect, useRef, useState, useCallback } from 'react';
import Panzoom from '@panzoom/panzoom';
import { render, setMermaidTheme } from '../services/mermaid';
import type { ThemeMode } from '../types';

interface DiagramViewProps {
	mermaidCode: string;
	isLoading?: boolean;
	isAskMode?: boolean;
	theme: ThemeMode;
	onAbort?: () => void;
	/** Used as the diagram's accessible description — see the aria-label below. */
	summary?: string;
	/** Lifts the rendered SVG so the toolbar can export it. */
	onSvgChange?: (svg: string | null) => void;
}

const MIN_SCALE = 0.3;
const MAX_SCALE = 10;
const DEFAULT_SCALE = 2.5;

export function DiagramView({ mermaidCode, isLoading, isAskMode = false, theme, onAbort, summary, onSvgChange }: DiagramViewProps) {
	const svgWrapperRef = useRef<HTMLDivElement>(null);
	const panzoomRef = useRef<ReturnType<typeof Panzoom> | null>(null);
	const [svg, setSvg] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [scale, setScale] = useState(DEFAULT_SCALE);
	const renderIdRef = useRef(0);
	// Survives the Panzoom teardown/rebuild that every re-render triggers, so a
	// keystroke no longer snaps the view back to DEFAULT_SCALE at origin.
	const viewStateRef = useRef<{ scale: number; x: number; y: number } | null>(null);
	// Held in a ref so a new callback identity cannot re-trigger the render effect.
	const onSvgChangeRef = useRef(onSvgChange);
	onSvgChangeRef.current = onSvgChange;
	
	// Render SVG from mermaid code
	useEffect(() => {
		let cancelled = false;
		setError(null);
		
		// Apply theme before rendering so the diagram colors match the app theme
		setMermaidTheme(theme);
		
		render(mermaidCode, `diagram-${++renderIdRef.current}`)
		.then((result) => {
			if (!cancelled) {
				setSvg(result);
				onSvgChangeRef.current?.(result);
			}
		})
		.catch((e: unknown) => {
			if (!cancelled) {
				const message = e instanceof Error ? e.message : 'Failed to render diagram';
				setError(message);
				setSvg(null);
				onSvgChangeRef.current?.(null);
			}
		});
		
		return () => {
			cancelled = true;
		};
	}, [mermaidCode, theme]);
	
	// Initialize Panzoom when SVG changes
	useEffect(() => {
		if (!svgWrapperRef.current || !svg) return;
		
		// Capture the current view before tearing the instance down, so the
		// rebuild below can restore exactly where the user was.
		if (panzoomRef.current) {
			const pan = panzoomRef.current.getPan();
			viewStateRef.current = { scale: panzoomRef.current.getScale(), x: pan.x, y: pan.y };
			panzoomRef.current.destroy();
			panzoomRef.current = null;
		}

		const elem = svgWrapperRef.current;
		const saved = viewStateRef.current;

		const panzoom = Panzoom(elem, {
			maxScale: MAX_SCALE,
			minScale: MIN_SCALE,
			step: 0.1,
			startScale: saved?.scale ?? DEFAULT_SCALE,
			startX: saved?.x ?? 0,
			startY: saved?.y ?? 0,
			// The wrapper is inline-block, so it shrink-wraps the SVG. Binding events
			// to it meant dragging the empty space around the diagram did nothing,
			// while the parent still showed cursor: grab. `canvas: true` binds to the
			// parent instead, so the whole panel is draggable.
			canvas: true,
			pinchAndPan: true,
		});

		panzoomRef.current = panzoom;
		setScale(panzoom.getScale());
		
		const wheelHandler = (e: WheelEvent) => {
			e.preventDefault();
			const direction = Math.sign(e.deltaY); // -1 = scroll up (zoom in), +1 = scroll down (zoom out)
			const currentScale = panzoom.getScale();
			const factor = 1 + (direction > 0 ? -0.1 : 0.1); // ~10% per tick
			const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, currentScale * factor));
			panzoom.zoom(newScale);  // zooms toward center (no pointer option set)
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
	}, [svg]);
	
	/** Records the view so the next re-render restores it rather than resetting. */
	const rememberView = useCallback(() => {
		const panzoom = panzoomRef.current;
		if (!panzoom) return;
		const pan = panzoom.getPan();
		viewStateRef.current = { scale: panzoom.getScale(), x: pan.x, y: pan.y };
		setScale(panzoom.getScale());
	}, []);

	const handleZoomIn = useCallback(() => {
		panzoomRef.current?.zoomIn();
		rememberView();
	}, [rememberView]);

	const handleZoomOut = useCallback(() => {
		panzoomRef.current?.zoomOut();
		rememberView();
	}, [rememberView]);

	/**
	 * Scales the diagram to fit the panel instead of jumping to a fixed 250%,
	 * which on a large diagram meant "reset" left you more lost than before.
	 */
	const handleFitToView = useCallback(() => {
		const panzoom = panzoomRef.current;
		const elem = svgWrapperRef.current;
		const container = elem?.parentElement;
		if (!panzoom || !elem || !container) return;

		const svgEl = elem.querySelector('svg');
		if (!svgEl) return;

		// Prefer the viewBox: it is the untransformed size, so it does not have to be
		// un-scaled the way getBoundingClientRect() would.
		const viewBox = svgEl.viewBox?.baseVal;
		const currentScale = panzoom.getScale() || 1;
		const rect = svgEl.getBoundingClientRect();
		const naturalWidth = viewBox?.width || rect.width / currentScale;
		const naturalHeight = viewBox?.height || rect.height / currentScale;

		const availableWidth = container.clientWidth;
		const availableHeight = container.clientHeight;
		if (!naturalWidth || !naturalHeight || !availableWidth || !availableHeight) return;

		const FIT_PADDING = 0.92;
		const fitted = Math.min(
			MAX_SCALE,
			Math.max(
				MIN_SCALE,
				Math.min(availableWidth / naturalWidth, availableHeight / naturalHeight) * FIT_PADDING
			)
		);

		panzoom.pan(0, 0, { animate: true });
		panzoom.zoom(fitted, { animate: true });
		rememberView();
	}, [rememberView]);
	
	const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const newScale = parseFloat(e.target.value) / 100;
		panzoomRef.current?.zoom(newScale);
		rememberView();
	}, [rememberView]);
	
	return (
		<div className="diagram-view h-100 position-relative" style={{ overflow: 'hidden' }}>
		{isLoading && (
			<div className="position-absolute top-0 start-0 end-0 loading-overlay d-flex justify-content-between align-items-center px-3 py-2" style={{ zIndex: 10 }}>
			<div className="d-flex align-items-center">
			<div className="spinner-border spinner-border-sm me-2" role="status" />
			<span className="fw-semibold">{isAskMode ? 'Asking...' : 'Generating Diagram'}</span>
			</div>
			{onAbort && (
				<button
				type="button"
				className="btn btn-sm btn-outline-danger border-0 p-1 lh-1"
				onClick={onAbort}
				title="Stop"
				aria-label="Stop"
				style={{ width: '28px', height: '28px' }}
				>
				<svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
				<rect x="1" y="1" width="12" height="12" rx="1" />
				</svg>
				</button>
			)}
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
			<button className="btn btn-sm btn-outline-secondary border-0 zoom-btn" onClick={handleFitToView} title="Fit diagram to view" aria-label="Fit diagram to view">
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
			{/*
				A screen reader hitting a raw Mermaid SVG reads its stray text nodes in
				layout order, which is meaningless. The Text Summary is already a written
				description of this diagram, so it doubles as the accessible label.
			*/}
			<div
			ref={svgWrapperRef}
			role="img"
			aria-label={summary?.trim() ? summary : 'Rendered Mermaid diagram'}
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