import { useState, useCallback } from 'react';
import type { DiagramType } from '../types';
import { DEFAULT_DIAGRAM_TYPE, DEFAULT_TEMPLATES, tryGetDiagramType } from '../utils/constants';

interface UseDiagramTypeReturn {
  diagramType: DiagramType;
  changeDiagramType: (type: DiagramType) => string;
  detectDiagramType: (code: string) => DiagramType | null;
}

export function useDiagramType(): UseDiagramTypeReturn {
  const [diagramType, setDiagramType] = useState<DiagramType>(DEFAULT_DIAGRAM_TYPE);

  const changeDiagramType = useCallback((type: DiagramType): string => {
    setDiagramType(type);
    return DEFAULT_TEMPLATES[type];
  }, []);

  // When the type can't be determined (e.g. mid-edit, or an unsupported
  // directive), hold the last known type rather than snapping the dropdown
  // back to flowchart, which would misreport the diagram to the user.
  const detectDiagramType = useCallback((code: string): DiagramType | null => {
    const detected = tryGetDiagramType(code);
    if (detected) setDiagramType(detected);
    return detected;
  }, []);

  return { diagramType, changeDiagramType, detectDiagramType };
}