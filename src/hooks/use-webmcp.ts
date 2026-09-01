'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { FoundryService } from '../domain/foundry-service';
import type { AgentConsentRequest, EvidencePolicyComparison, TraceNode, WorkspaceStage } from '../domain/types';
import { activeToolNamesForStage, registerFoundryTools } from '../webmcp/register-tools';

interface ExportFile {
  filename: string;
  mimeType: string;
  content: string;
}

export function useWebMCP(
  service: FoundryService,
  onTrace: (nodes: TraceNode[]) => void,
  onExport: (file: ExportFile) => void,
  onResearch: (
    problemStatement?: string,
    actor?: 'agent',
    signal?: AbortSignal,
    requestConsent?: (request: AgentConsentRequest, signal?: AbortSignal) => Promise<boolean>,
  ) => Promise<boolean>,
  stage: WorkspaceStage,
  workspaceVersion: number,
) {
  const [ready, setReady] = useState(false);
  const [readyStage, setReadyStage] = useState<WorkspaceStage>();
  const [error, setError] = useState<string>();
  const [policyComparisonSnapshot, setPolicyComparisonSnapshot] = useState<{ comparison: EvidencePolicyComparison; workspaceVersion: number }>();
  const [pendingConsent, setPendingConsent] = useState<AgentConsentRequest>();
  const consentRef = useRef<{ resolve: (approved: boolean) => void; cleanup: () => void } | undefined>(undefined);
  const toolNames = activeToolNamesForStage(stage);

  const settleConsent = useCallback((approved: boolean) => {
    const pending = consentRef.current;
    if (!pending) return;
    consentRef.current = undefined;
    pending.cleanup();
    setPendingConsent(undefined);
    pending.resolve(approved);
  }, []);

  const requestAgentConsent = useCallback((request: AgentConsentRequest, signal?: AbortSignal) => {
    if (consentRef.current || signal?.aborted) return Promise.resolve(false);
    return new Promise<boolean>((resolve) => {
      const abort = () => settleConsent(false);
      signal?.addEventListener('abort', abort, { once: true });
      consentRef.current = {
        resolve,
        cleanup: () => signal?.removeEventListener('abort', abort),
      };
      setPendingConsent(request);
    });
  }, [settleConsent]);

  useEffect(() => () => settleConsent(false), [settleConsent]);

  useEffect(() => {
    const modelContext = document.modelContext;
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setReady(false);
      setError(undefined);
    });
    if (!modelContext) return () => { active = false; };

    const registration = registerFoundryTools(modelContext, service, {
      stage,
      onTrace,
      onExport,
      onResearch: (problemStatement, signal) => onResearch(problemStatement, 'agent', signal, requestAgentConsent),
      requestConsent: requestAgentConsent,
      onPolicyComparison: (comparison, comparedVersion) => setPolicyComparisonSnapshot({ comparison, workspaceVersion: comparedVersion }),
    });
    void registration.ready
      .then(() => {
        if (active) {
          setReadyStage(stage);
          setReady(true);
        }
      })
      .catch((reason: unknown) => {
        if (active) {
          setReadyStage(undefined);
          setError(reason instanceof Error ? reason.message : 'WebMCP registration failed.');
        }
      });
    return () => {
      active = false;
      registration.dispose();
    };
  }, [onExport, onResearch, onTrace, requestAgentConsent, service, stage]);

  return {
    ready: ready && readyStage === stage,
    error,
    toolCount: toolNames.length,
    toolNames,
    policyComparison: policyComparisonSnapshot?.workspaceVersion === workspaceVersion
      ? policyComparisonSnapshot.comparison
      : undefined,
    pendingConsent,
    approveConsent: () => settleConsent(true),
    declineConsent: () => settleConsent(false),
  };
}
