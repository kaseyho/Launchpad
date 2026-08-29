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
) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const modelContext = document.modelContext;
    if (!modelContext) return;

    let active = true;
    const unregister = registerFoundryTools(modelContext, service, { onTrace, onExport });
    queueMicrotask(() => { if (active) setReady(true); });
    return () => {
      active = false;
      unregister();
    };
  }, [onExport, onTrace, service]);

  return { ready, toolCount: WEBMCP_TOOL_COUNT };
}
