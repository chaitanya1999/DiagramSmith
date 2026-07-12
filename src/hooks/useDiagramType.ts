import { useState, useCallback } from 'react';
import type { DiagramType } from '../types';
import { DEFAULT_DIAGRAM_TYPE, DEFAULT_TEMPLATES, getDiagramType } from '../utils/constants';

interface UseDiagramTypeReturn {
  diagramType: DiagramType;
  changeDiagramType: (type: DiagramType) => string;
  detectDiagramType: (code: string) => DiagramType;
}

export function useDiagramType(): UseDiagramTypeReturn {
  const [diagramType, setDiagramType] = useState<DiagramType>(DEFAULT_DIAGRAM_TYPE);

  const changeDiagramType = useCallback((type: DiagramType): string => {
    setDiagramType(type);
    return DEFAULT_TEMPLATES[type];
  }, []);

  const detectDiagramType = useCallback((code: string): DiagramType => {
    const detected = getDiagramType(code);
    setDiagramType(detected);
    return detected;
  }, []);

  return { diagramType, changeDiagramType, detectDiagramType };
}