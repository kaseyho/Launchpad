'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createFoundryService, createInitialWorkspace, type FoundryService } from '../domain/foundry-service';
import type { Actor, AgentConsentRequest, FoundryWorkspace, ServiceFailure, ServiceSuccess, TraceNode } from '../domain/types';
import { isAbortError, loadLocalWorkspace, saveWorkspaceSnapshot } from '../persistence/client-workspace';
import { runAutonomousResearch, type AutonomousResearchProgress } from '../research/autonomous-research';

type AnyResult = ServiceSuccess<unknown> | ServiceFailure;
type ExportFile = { filename: string; mimeType: string; content: string };
type ResearchAllowance = {
  check: () => { allowed: true; remaining: number } | { allowed: false; remaining: 0; message: string };
  recordCompletedRun: () => void;
};

class FoundryController {
  private workspace: FoundryWorkspace;
  private readonly listeners = new Set<() => void>();
  readonly service: FoundryService;

  constructor(initialWorkspace: FoundryWorkspace) {
    this.workspace = structuredClone(initialWorkspace);
    this.service = createFoundryService(this.getSnapshot, this.replaceWorkspace);
  }

  readonly getSnapshot = () => this.workspace;
  readonly subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
  readonly replaceWorkspace = (workspace: FoundryWorkspace) => {
    this.workspace = workspace;
    for (const listener of this.listeners) listener();
  };
}

export function useFoundry(initialWorkspace?: FoundryWorkspace, allowance?: ResearchAllowance) {
  const [controller] = useState(() => new FoundryController(initialWorkspace ?? createInitialWorkspace()));
  const workspace = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  const service = controller.service;
  const [persistenceReady, setPersistenceReady] = useState(process.env.NODE_ENV === 'test');
  const [notice, setNotice] = useState('Factory initialized. Waiting for a problem brief.');
  const [storageStatus, setStorageStatus] = useState<'loading' | 'ready' | 'saving' | 'saved' | 'offline'>(process.env.NODE_ENV === 'test' ? 'ready' : 'loading');
  const [traceNodes, setTraceNodes] = useState<TraceNode[]>([]);
  const [lastExport, setLastExport] = useState<ExportFile>();
  const [researchRun, setResearchRun] = useState<AutonomousResearchProgress>(() => initialWorkspace?.stage === 'FINALIZED'
    ? { phase: 'complete', progress: 100, message: 'Your evidence-backed solution is ready.' }
    : { phase: 'idle', progress: 0, message: 'Waiting for your problem statement.' });
  const runAbortRef = useRef<AbortController | undefined>(undefined);

  useEffect(() => {
    if (process.env.NODE_ENV === 'test') return;
    let cancelled = false;
    const localWorkspace = loadLocalWorkspace();
    if (localWorkspace) {
      controller.replaceWorkspace(localWorkspace);
      queueMicrotask(() => {
        if (cancelled) return;
        setStorageStatus('saved');
        setNotice('Restored your workspace from this browser.');
      });
    }
    void fetch('/api/workspace', { cache: 'no-store' })
      .then(async (response) => {
        if (response.status === 404) return undefined;
        if (!response.ok) throw new Error('Persistent workspace is temporarily unavailable.');
        return response.json() as Promise<{ workspace?: FoundryWorkspace }>;
      })
      .then((payload) => {
        if (cancelled) return;
        setStorageStatus('ready');
        if (payload?.workspace && (!localWorkspace || payload.workspace.version > localWorkspace.version)) {
          controller.replaceWorkspace(payload.workspace);
          setNotice('Restored the latest durable workspace snapshot.');
        }
        setPersistenceReady(true);
      })
      .catch(() => {
        if (!cancelled) {
          setStorageStatus(localWorkspace ? 'saved' : 'ready');
          setPersistenceReady(true);
        }
      });
    return () => { cancelled = true; };
  }, [controller]);

  useEffect(() => {
    if (process.env.NODE_ENV === 'test' || !persistenceReady) return;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      setStorageStatus('saving');
      void saveWorkspaceSnapshot(workspace, controller.signal)
        .then((saved) => setStorageStatus(saved ? 'saved' : 'offline'))
        .catch((error) => {
          if (!isAbortError(error)) setStorageStatus('offline');
        });
    }, 350);
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [persistenceReady, workspace]);

  useEffect(() => {
    if (!persistenceReady || runAbortRef.current) return;
    if (workspace.stage === 'FINALIZED') {
      if (researchRun.phase !== 'complete') {
        queueMicrotask(() => setResearchRun({ phase: 'complete', progress: 100, message: 'Your evidence-backed solution is ready.' }));
      }
    } else if (researchRun.phase === 'idle' && workspace.stage !== 'EMPTY') {
      queueMicrotask(() => setResearchRun({
        phase: 'error',
        progress: 0,
        message: 'The previous research run was interrupted.',
        error: 'Retry the run to rebuild the solution from the saved problem statement.',
      }));
    }
  }, [persistenceReady, researchRun.phase, workspace.stage]);

  const report = useCallback((result: AnyResult) => {
    setNotice(result.ok ? result.message : result.error.message);
    return result;
  }, []);

  const checkAllowance = useCallback(() => {
    const result = allowance?.check();
    if (!result || result.allowed) return true;
    setResearchRun({
      phase: 'error',
      progress: 0,
      message: 'Monthly research allowance reached.',
      error: result.message,
      errorCode: 'usage_limit',
    });
    setNotice(result.message);
    return false;
  }, [allowance]);

  const startResearch = useCallback(async (
    problemStatement?: string,
    actor: Actor = 'human',
    executionSignal?: AbortSignal,
    requestAgentConsent?: (request: AgentConsentRequest, signal?: AbortSignal) => Promise<boolean>,
  ) => {
    if (runAbortRef.current) return false;
    if (executionSignal?.aborted) return false;
    const problem = problemStatement?.trim() || controller.getSnapshot().problemBrief.problemStatement.trim();
    if (!problem) {
      setResearchRun({ phase: 'error', progress: 0, message: 'A problem statement is required.', error: 'Enter the problem you want LaunchPad to research.' });
      return false;
    }
    if (!checkAllowance()) return false;
    const abortController = new AbortController();
    const forwardExecutionAbort = () => abortController.abort(executionSignal?.reason);
    executionSignal?.addEventListener('abort', forwardExecutionAbort, { once: true });
    runAbortRef.current = abortController;
    setTraceNodes([]);
    setLastExport(undefined);
    setNotice('LaunchPad is researching your problem.');
    try {
      await runAutonomousResearch({
        problem,
        service,
        getWorkspace: controller.getSnapshot,
        signal: abortController.signal,
        actor,
        requestAgentConsent,
        onProgress: (progress) => {
          setResearchRun(progress);
          setNotice(progress.message);
        },
        pause: () => new Promise((resolve) => window.setTimeout(resolve, 140)),
      });
      allowance?.recordCompletedRun();
      return true;
    } catch (error) {
      if (isAbortError(error)) {
        setResearchRun((current) => ({
          phase: 'error',
          progress: current.progress,
          message: 'Research stopped.',
          error: 'Your problem and completed work are safe. Retry when you are ready.',
        }));
      } else {
        const message = error instanceof Error ? error.message : 'The research run could not be completed.';
        setResearchRun((current) => ({ phase: 'error', progress: current.progress, message: 'Research needs another attempt.', error: message }));
        setNotice(message);
      }
      return false;
    } finally {
      executionSignal?.removeEventListener('abort', forwardExecutionAbort);
      runAbortRef.current = undefined;
    }
  }, [allowance, checkAllowance, controller, service]);

  const stopResearch = useCallback(() => {
    runAbortRef.current?.abort();
  }, []);

  const retryResearch = useCallback((problemStatement?: string) => {
    const problem = problemStatement?.trim() || controller.getSnapshot().problemBrief.problemStatement;
    if (!problem) return;
    if (!checkAllowance()) return;
    report(service.resetWorkspace('system'));
    void startResearch(problem, 'human');
  }, [checkAllowance, controller, report, service, startResearch]);

  const traceEvidence = useCallback((candidateId: string, componentPath: string) => {
    const result = service.traceEvidence({ candidateId, componentPath }, 'human');
    report(result);
    if (result.ok) setTraceNodes(result.data.nodes);
  }, [report, service]);

  const exportBlueprint = useCallback((format: 'markdown' | 'json' = 'markdown') => {
    const result = service.exportBlueprint({ format });
    report(result);
    if (!result.ok || typeof document === 'undefined') return;
    const blob = new Blob([result.data.content], { type: result.data.mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = result.data.filename;
    link.click();
    URL.revokeObjectURL(url);
  }, [report, service]);

  const resetWorkspace = useCallback(() => {
    runAbortRef.current?.abort();
    runAbortRef.current = undefined;
    setTraceNodes([]);
    setLastExport(undefined);
    setResearchRun({ phase: 'idle', progress: 0, message: 'Waiting for your problem statement.' });
    report(service.resetWorkspace());
  }, [report, service]);

  const acceptAgentTrace = useCallback((nodes: TraceNode[]) => {
    setTraceNodes(nodes);
    setNotice('Agent highlighted the complete feature-to-source proof path.');
  }, []);

  const acceptAgentExport = useCallback((file: ExportFile) => {
    setLastExport(file);
    setNotice(`${file.filename} is ready to download.`);
  }, []);

  const downloadLastExport = useCallback(() => {
    if (!lastExport || typeof document === 'undefined') return;
    const blob = new Blob([lastExport.content], { type: lastExport.mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = lastExport.filename;
    link.click();
    URL.revokeObjectURL(url);
  }, [lastExport]);

  return {
    workspace,
    service,
    notice,
    storageStatus,
    researchRun,
    traceNodes,
    startResearch,
    stopResearch,
    retryResearch,
    report,
    traceEvidence,
    exportBlueprint,
    resetWorkspace,
    lastExport,
    acceptAgentTrace,
    acceptAgentExport,
    downloadLastExport,
  };
}
