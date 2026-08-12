import { useState, useEffect } from 'react';
import type { LlmConfig } from '../types';
import { Modal, Button, Form } from 'react-bootstrap';
import { loadMaxSnapshots, saveMaxSnapshots } from '../services/storage';

interface SettingsDialogProps {
  show: boolean;
  config: LlmConfig;
  onSave: (config: LlmConfig) => void;
  onCancel: () => void;
}

export function SettingsDialog({ show, config, onSave, onCancel }: SettingsDialogProps) {
  const [baseUrl, setBaseUrl] = useState(config.baseUrl);
  const [apiKey, setApiKey] = useState(config.apiKey);
  const [model, setModel] = useState(config.model);
  const [temperature, setTemperature] = useState(config.temperature.toString());
  const [maxTokens, setMaxTokens] = useState(config.maxTokens.toString());
  const [maxSnapshots, setMaxSnapshots] = useState(() => loadMaxSnapshots().toString());

  useEffect(() => {
    setBaseUrl(config.baseUrl);
    setApiKey(config.apiKey);
    setModel(config.model);
    setTemperature(config.temperature.toString());
    setMaxTokens(config.maxTokens.toString());
    setMaxSnapshots(loadMaxSnapshots().toString());
  }, [config, show]);

  const handleSave = () => {
    const temp = parseFloat(temperature);
    const tokens = parseInt(maxTokens, 10);
    const snapshots = parseInt(maxSnapshots, 10);

    if (!isNaN(snapshots) && snapshots >= 1 && snapshots <= 50) {
      saveMaxSnapshots(snapshots);
    }

    onSave({
      baseUrl: baseUrl.trim(),
      apiKey: apiKey.trim(),
      model: model.trim(),
      temperature: isNaN(temp) ? 0.3 : Math.min(2, Math.max(0, temp)),
      maxTokens: isNaN(tokens) ? 2048 : Math.max(1, tokens),
    });
  };

  return (
    <Modal show={show} onHide={onCancel} centered>
      <Modal.Header closeButton>
        <Modal.Title>⚙️ Settings</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <h6 className="mb-3 text-muted">LLM Configuration</h6>

          <Form.Group className="mb-3">
            <Form.Label>Base URL</Form.Label>
            <Form.Control
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.openai.com/v1"
            />
            <Form.Text className="text-muted">
              Must be an OpenAI-compatible API endpoint.
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>API Key</Form.Label>
            <Form.Control
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
            />
            <Form.Text className="text-muted">
              Your key is stored locally and never sent to any server other than the configured API.
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Model Name</Form.Label>
            <Form.Control
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="gpt-4o-mini"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Temperature ({temperature})</Form.Label>
            <Form.Range
              min="0"
              max="2"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
            />
            <Form.Text className="text-muted">
              Lower = more deterministic, higher = more creative.
            </Form.Text>
          </Form.Group>

          <hr />
          <h6 className="mb-3 text-muted">Version History</h6>

          <Form.Group className="mb-3">
            <Form.Label>Max Snapshots ({maxSnapshots})</Form.Label>
            <Form.Range
              min="1"
              max="50"
              step="1"
              value={maxSnapshots}
              onChange={(e) => setMaxSnapshots(e.target.value)}
            />
            <Form.Text className="text-muted">
              Maximum number of versions to keep in history (1–50). Oldest are dropped when exceeded.
            </Form.Text>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSave}>
          Save
        </Button>
      </Modal.Footer>
    </Modal>
  );
}