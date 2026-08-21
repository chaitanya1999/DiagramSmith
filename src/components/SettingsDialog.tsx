import { useState, useEffect, useCallback } from 'react';
import type { LlmConfig } from '../types';
import { Modal, Button, Form, Spinner } from 'react-bootstrap';
import { testConnection } from '../services/llm';
import type { ConnectionTestResult } from '../services/llm';

interface SettingsDialogProps {
  show: boolean;
  config: LlmConfig;
  maxSnapshots: number;
  onSave: (config: LlmConfig) => void;
  onMaxSnapshotsChange: (max: number) => void;
  onCancel: () => void;
}

export function SettingsDialog({ show, config, maxSnapshots: currentMaxSnapshots, onSave, onMaxSnapshotsChange, onCancel }: SettingsDialogProps) {
  const [baseUrl, setBaseUrl] = useState(config.baseUrl);
  const [apiKey, setApiKey] = useState(config.apiKey);
  const [model, setModel] = useState(config.model);
  const [temperature, setTemperature] = useState(config.temperature.toString());
  const [sendAuthorization, setSendAuthorization] = useState(config.sendAuthorization);
  const [maxSnapshots, setMaxSnapshots] = useState(() => currentMaxSnapshots.toString());
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);

  /** Tests the values currently typed into the form, not the last saved ones. */
  const handleTestConnection = useCallback(async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await testConnection({
        baseUrl: baseUrl.trim(),
        apiKey: apiKey.trim(),
        model: model.trim(),
        temperature: parseFloat(temperature) || 0,
        sendAuthorization,
      });
      setTestResult(result);
    } finally {
      setIsTesting(false);
    }
  }, [baseUrl, apiKey, model, temperature, sendAuthorization]);

  useEffect(() => {
    setBaseUrl(config.baseUrl);
    setApiKey(config.apiKey);
    setModel(config.model);
    setTemperature(config.temperature.toString());
    setSendAuthorization(config.sendAuthorization);
    setMaxSnapshots(currentMaxSnapshots.toString());
    setTestResult(null);
  }, [config, currentMaxSnapshots, show]);

  const handleSave = () => {
    const temp = parseFloat(temperature);
    const snapshots = parseInt(maxSnapshots, 10);

    // Routed through the version-history hook so the new cap applies immediately;
    // writing straight to storage left the running hook on its old value until reload.
    if (!isNaN(snapshots) && snapshots >= 1 && snapshots <= 50) {
      onMaxSnapshotsChange(snapshots);
    }

    onSave({
      baseUrl: baseUrl.trim(),
      apiKey: apiKey.trim(),
      model: model.trim(),
      temperature: isNaN(temp) ? 0.3 : Math.min(2, Math.max(0, temp)),
      sendAuthorization,
    });
  };

  return (
    <Modal show={show} onHide={onCancel} centered>
      <Modal.Header closeButton>
        <Modal.Title>⚙️ Settings</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
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
              list="llm-model-suggestions"
            />
            {/* Populated from GET /models when the test succeeds, so the field autocompletes. */}
            {testResult?.models && testResult.models.length > 0 && (
              <datalist id="llm-model-suggestions">
                {testResult.models.map((id) => (
                  <option key={id} value={id} />
                ))}
              </datalist>
            )}
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

          <Form.Check
            type="switch"
            id="send-auth-switch"
            label="Send Authorization Header"
            checked={sendAuthorization}
            onChange={(e) => setSendAuthorization(e.target.checked)}
            className="mb-3"
          />
          <Form.Text className="text-muted d-block mb-3" style={{ marginTop: '-0.5rem' }}>
            When enabled, the API key is sent as a Bearer token. Disable for local models (e.g., Ollama, LM Studio) that don't require authentication.
          </Form.Text>

          <div className="d-flex align-items-center gap-2 mb-2">
            <Button
              variant="outline-primary"
              size="sm"
              onClick={handleTestConnection}
              disabled={isTesting || !baseUrl.trim() || !model.trim()}
            >
              {isTesting ? (
                <>
                  <Spinner animation="border" size="sm" className="me-1" /> Testing…
                </>
              ) : (
                '🔌 Test Connection'
              )}
            </Button>
          </div>
          {testResult && (
            <div
              className={`small mb-3 p-2 rounded border ${
                testResult.ok ? 'border-success text-success' : 'border-danger text-danger'
              }`}
              role="status"
            >
              {testResult.ok ? '✅ ' : '❌ '}
              {testResult.message}
            </div>
          )}

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