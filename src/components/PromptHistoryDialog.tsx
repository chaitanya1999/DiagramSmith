import { Modal, Button } from 'react-bootstrap';
import type { LlmInteraction } from '../types';

interface PromptHistoryDialogProps {
  show: boolean;
  interaction: LlmInteraction | null;
  onClose: () => void;
}

export function PromptHistoryDialog({ show, interaction, onClose }: PromptHistoryDialogProps) {
  const isActionMode = interaction?.mode === 'action';

  return (
    <Modal show={show} onHide={onClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          {interaction ? (
            isActionMode ? (
              '✏️ Last LLM Interaction (Action)'
            ) : (
              '❓ Last LLM Interaction (Ask)'
            )
          ) : (
            'LLM Interaction History'
          )}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {!interaction ? (
          <p className="text-muted mb-0">No LLM interaction yet. Submit a prompt or ask a question to see it here.</p>
        ) : (
          <div>
            <div className="mb-3">
              <div className="d-flex align-items-center gap-2 mb-1">
                <span className="badge text-bg-secondary">{isActionMode ? '✏️ Action' : '❓ Ask'}</span>
                <small className="text-muted">
                  {new Date(interaction.timestamp).toLocaleString()}
                </small>
              </div>
              <h6 className="mb-1">Prompt</h6>
              <pre className="p-2 rounded mb-0 interaction-block">{interaction.prompt}</pre>
            </div>
            <div>
              <h6 className="mb-1">Response</h6>
              <pre className="p-2 rounded mb-0 interaction-block">{interaction.response}</pre>
            </div>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}