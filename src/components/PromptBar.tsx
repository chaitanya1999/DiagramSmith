import { useState, useRef, useEffect, useCallback } from 'react';
import type { LlmMode } from '../types';

interface PromptBarProps {
  mode: LlmMode;
  onModeChange: (mode: LlmMode) => void;
  onSubmit: (instruction: string) => void;
  isLoading: boolean;
  includeSummary: boolean;
  generateSummary: boolean;
  includeSyntaxGuide: boolean;
  onIncludeSummaryChange: (value: boolean) => void;
  onGenerateSummaryChange: (value: boolean) => void;
  onIncludeSyntaxGuideChange: (value: boolean) => void;
  onAbort?: () => void;
}

export function PromptBar({
  mode,
  onModeChange,
  onSubmit,
  isLoading,
  includeSummary,
  generateSummary,
  includeSyntaxGuide,
  onIncludeSummaryChange,
  onGenerateSummaryChange,
  onIncludeSyntaxGuideChange,
  onAbort,
}: PromptBarProps) {
  const [stage, setStage] = useState<'idle' | 'peek' | 'expanded'>('idle');
  const [instruction, setInstruction] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastPromptRef = useRef('');
  const peekTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isAskMode = mode === 'ask';

  const handleSubmit = useCallback(() => {
    const trimmed = instruction.trim();
    if (!trimmed || isLoading) return;
    lastPromptRef.current = trimmed;
    onSubmit(trimmed);
    setInstruction('');
    setStage('idle');
  }, [instruction, isLoading, onSubmit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
        return;
      }
      if (e.key === 'ArrowUp' && instruction.trim() === '' && lastPromptRef.current) {
        e.preventDefault();
        setInstruction(lastPromptRef.current);
      }
    },
    [handleSubmit, instruction]
  );

  const handleCancel = useCallback(() => {
    setInstruction('');
    setStage('idle');
    onAbort?.();
  }, [onAbort]);

  // Focus textarea when expanded
  useEffect(() => {
    if (stage === 'expanded' && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [stage]);

  // Clear any pending collapse timeout on unmount
  useEffect(() => {
    return () => {
      if (peekTimeoutRef.current) clearTimeout(peekTimeoutRef.current);
    };
  }, []);

  const handlePointerEnter = useCallback(() => {
    if (peekTimeoutRef.current) {
      clearTimeout(peekTimeoutRef.current);
      peekTimeoutRef.current = null;
    }
    setStage((current) => (current === 'idle' ? 'peek' : current));
  }, []);

  const handlePointerLeave = useCallback(() => {
    peekTimeoutRef.current = setTimeout(() => {
      setStage((current) => (current === 'peek' ? 'idle' : current));
    }, 150);
  }, []);

  return (
    <div
      className={`position-fixed start-50 translate-middle-x prompt-bar-wrapper prompt-bar-stage-${stage}`}
      style={{ bottom: '2rem', zIndex: 1050 }}
      onMouseEnter={handlePointerEnter}
      onMouseLeave={handlePointerLeave}
    >
      <div className="card prompt-bar-card shadow-lg border-1">
        {stage !== 'expanded' ? (
          <button
            type="button"
            className={`btn prompt-bar-trigger w-100 text-center ${isLoading ? 'prompt-bar-loading' : ''}`}
            onClick={() => setStage('expanded')}
            aria-expanded={false}
            aria-label="Ask AI to modify diagram"
          >
            {stage === 'idle' ? (
              isLoading ? (
                <span className="spinner-border spinner-border-sm" role="status" />
              ) : (
                <span className="prompt-bar-circle-label">AI</span>
              )
            ) : (
              <span className="fw-semibold">💬 Ask AI to modify diagram...</span>
            )}
          </button>
        ) : (
          <div className="card-body p-3">
            {/* Mode toggle */}
            <div className="btn-group btn-group-sm w-100 mb-2" role="group" aria-label="LLM mode">
              <button
                type="button"
                className={`btn ${!isAskMode ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => onModeChange('action')}
                disabled={isLoading}
              >
                ✏️ Action
              </button>
              <button
                type="button"
                className={`btn ${isAskMode ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => onModeChange('ask')}
                disabled={isLoading}
              >
                ❓ Ask
              </button>
            </div>

            <textarea
              ref={textareaRef}
              className="form-control mb-2"
              rows={3}
              placeholder={
                isAskMode
                  ? 'Ask a question about the diagram...'
                  : 'Describe the changes you want to make to the diagram...'
              }
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              style={{ resize: 'vertical' }}
            />
            <div className="d-flex align-items-center gap-3 mb-2 flex-wrap">
              <div className="form-check form-switch mb-0">
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  id="include-summary-switch"
                  checked={includeSummary}
                  onChange={(e) => onIncludeSummaryChange(e.target.checked)}
                  disabled={isLoading}
                />
                <label className="form-check-label small" htmlFor="include-summary-switch">
                  Include Summary in prompt
                </label>
              </div>
              {!isAskMode && (
                <div className="form-check form-switch mb-0">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    role="switch"
                    id="generate-summary-switch"
                    checked={generateSummary}
                    onChange={(e) => onGenerateSummaryChange(e.target.checked)}
                    disabled={isLoading}
                  />
                  <label className="form-check-label small" htmlFor="generate-summary-switch">
                    LLM Generate Summary
                  </label>
                </div>
              )}
              <div className="form-check form-switch mb-0">
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  id="include-syntax-guide-switch"
                  checked={includeSyntaxGuide}
                  onChange={(e) => onIncludeSyntaxGuideChange(e.target.checked)}
                  disabled={isLoading}
                />
                <label className="form-check-label small" htmlFor="include-syntax-guide-switch">
                  Include Syntax Guide
                </label>
              </div>
            </div>
            <div className="d-flex justify-content-end gap-2">
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={handleCancel}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                className="btn btn-sm btn-primary"
                onClick={handleSubmit}
                disabled={!instruction.trim() || isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" role="status" />
                    {isAskMode ? 'Asking...' : 'Generating...'}
                  </>
                ) : isAskMode ? (
                  'Ask'
                ) : (
                  'Generate'
                )}
              </button>
            </div>
            <div className="mt-1">
              <small className="text-muted">Press Ctrl+Enter to submit</small>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}