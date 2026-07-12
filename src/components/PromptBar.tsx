import { useState, useRef, useEffect, useCallback } from 'react';

interface PromptBarProps {
  onSubmit: (instruction: string) => void;
  isLoading: boolean;
}

export function PromptBar({ onSubmit, isLoading }: PromptBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [instruction, setInstruction] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = instruction.trim();
    if (!trimmed || isLoading) return;
    onSubmit(trimmed);
    setInstruction('');
    setIsExpanded(false);
  }, [instruction, isLoading, onSubmit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleCancel = useCallback(() => {
    setInstruction('');
    setIsExpanded(false);
  }, []);

  // Focus textarea when expanded
  useEffect(() => {
    if (isExpanded && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isExpanded]);

  return (
    <div className="position-fixed start-50 translate-middle-x" style={{ bottom: '2rem', zIndex: 1050, width: 'min(600px, 90%)' }}>
      <div className="card shadow-lg border-0">
        {!isExpanded ? (
          <button
            className="btn btn-light w-100 text-center py-2"
            onClick={() => setIsExpanded(true)}
          >
            <span className="fw-semibold">💬 Ask AI to modify diagram...</span>
          </button>
        ) : (
          <div className="card-body p-3">
            <textarea
              ref={textareaRef}
              className="form-control mb-2"
              rows={3}
              placeholder="Describe the changes you want to make to the diagram..."
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              style={{ resize: 'vertical' }}
            />
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
                    Generating...
                  </>
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