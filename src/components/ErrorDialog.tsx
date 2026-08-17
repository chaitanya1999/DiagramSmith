import { Modal, Button } from 'react-bootstrap';

interface ErrorDialogProps {
  show: boolean;
  error: string | null;
  onClose: () => void;
}

export function ErrorDialog({ show, error, onClose }: ErrorDialogProps) {
  return (
    <Modal show={show} onHide={onClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>⚠ Parse Error</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <pre className="p-2 rounded mb-0 interaction-block" style={{ maxHeight: '60vh' }}>
          {error}
        </pre>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
