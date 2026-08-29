'use client';

import { useEffect, useState } from 'react';
import type { FoundryService } from '../domain/foundry-service';
import type { TraceNode } from '../domain/types';
import { registerFoundryTools, WEBMCP_TOOL_COUNT } from '../webmcp/register-tools';

interface ExportFile {
  filename: string;
  mimeType: string;
  content: string;
}

export function useWebMCP(
  service: FoundryService,
  onTrace: (nodes: TraceNode[]) => void,
  onExport: (file: ExportFile) => void,
  onResearch: (problemStatement?: string, actor?: 'agent') => Promise<boolean>,
) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const modelContext = document.modelContext;
    if (!modelContext) return;

    let active = true;
    const registration = registerFoundryTools(modelContext, service, {
      onTrace,
      onExport,
      onResearch: (problemStatement) => onResearch(problemStatement, 'agent'),
    });
    void registration.ready.then(() => {
      if (active) setReady(true);
    }).catch(() => {
      if (active) setReady(false);
    });
    return () => {
      active = false;
      registration.unregister();
    };
  }, [onExport, onResearch, onTrace, service]);

  return { ready, toolCount: WEBMCP_TOOL_COUNT };
}
