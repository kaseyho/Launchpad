'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { createFoundryService, createInitialWorkspace, type FoundryService } from '../domain/foundry-service';
import type { FoundryWorkspace, ServiceFailure, ServiceSuccess, TraceNode } from '../domain/types';
import { isAbortError, loadLocalWorkspace, saveWorkspaceSnapshot } from '../persistence/client-workspace';

type AnyResult = ServiceSuccess<unknown> | ServiceFailure;
type ExportFile = { filename: string; mimeType: string; content: string };

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

export function useFoundry(initialWorkspace?: FoundryWorkspace) {
  const [controller] = useState(() => new FoundryController(initialWorkspace ?? createInitialWorkspace()));
  const workspace = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  const service = controller.service;
  const [persistenceReady, setPersistenceReady] = useState(process.env.NODE_ENV === 'test');
  const [notice, setNotice] = useState('Factory initialized. Waiting for a problem brief.');
  const [storageStatus, setStorageStatus] = useState<'loading' | 'ready' | 'saving' | 'saved' | 'offline'>(process.env.NODE_ENV === 'test' ? 'ready' : 'loading');
  const [traceNodes, setTraceNodes] = useState<TraceNode[]>([]);
  const [lastExport, setLastExport] = useState<ExportFile>();

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

  const report = useCallback((result: AnyResult) => {
    setNotice(result.ok ? result.message : result.error.message);
    return result;
  }, []);

  const runPrimaryAction = useCallback(() => {
    const current = controller.getSnapshot();
    if (current.stage === 'EMPTY') {
      setNotice('Type your problem statement first. LaunchPad does not preload a demo case.');
      return;
    }
    if (current.stage === 'PROBLEM_DEFINED') {
      report(service.planResearch({ focus: current.problemBrief.desiredOutcome || current.problemBrief.problemStatement }));
      return;
    }
    if (current.stage === 'RESEARCH_PLANNED' || (current.stage === 'SOURCING' && current.sources.length === 0)) {
      setNotice('Add a relevant source, or ask your WebMCP agent to research and import evidence for this problem.');
      return;
    }
    if (current.stage === 'SOURCING') {
      report(service.extractFindings({ sourceIds: current.sources.map((source) => source.id) }));
      return;
    }
    if (current.stage === 'EVIDENCE_REVIEW') {
      const pending = current.findings.filter((finding) => finding.reviewStatus === 'pending');
      if (pending.length) {
        report(service.reviewFindings({ decision: 'accept', findingIds: pending.map((finding) => finding.id), note: 'Accepted for the deterministic demo after citation inspection.' }));
      } else {
        report(service.synthesizeInsights({}));
      }
      return;
    }
    if (current.stage === 'INSIGHTS_READY') {
      report(service.generateIdeaCandidates({ count: 3 }));
      return;
    }
    if (current.stage === 'CANDIDATES_READY') {
      const acceptedCommunity = current.findings.some((finding) => finding.evidenceType === 'community_anecdote' && finding.reviewStatus === 'accepted');
      if (acceptedCommunity) {
        report(service.reviewFindings({ decision: 'reject', evidenceType: 'community_anecdote', note: 'Excluded by human request: use only first-party, research, and standards evidence.' }));
      } else if (current.selectedCandidateId) {
        report(service.stressTestCandidate({ candidateId: current.selectedCandidateId }));
      }
      return;
    }
    if (current.stage === 'STRESS_TESTING' && current.selectedCandidateId) {
      report(service.finalizeBlueprint({ candidateId: current.selectedCandidateId }));
    }
  }, [controller, report, service]);

  const primaryActionLabel = (() => {
    if (workspace.stage === 'EMPTY') return 'ENTER YOUR PROBLEM';
    if (workspace.stage === 'PROBLEM_DEFINED') return 'PLAN RESEARCH';
    if (workspace.stage === 'RESEARCH_PLANNED') return 'ADD FIRST SOURCE';
    if (workspace.stage === 'SOURCING') return workspace.sources.length ? 'EXTRACT FINDINGS' : 'ADD FIRST SOURCE';
    if (workspace.stage === 'EVIDENCE_REVIEW') return workspace.findings.some((finding) => finding.reviewStatus === 'pending') ? 'ACCEPT ALL EVIDENCE' : 'SYNTHESIZE INSIGHTS';
    if (workspace.stage === 'INSIGHTS_READY') return 'FORGE CANDIDATES';
    if (workspace.stage === 'CANDIDATES_READY') {
      return workspace.findings.some((finding) => finding.evidenceType === 'community_anecdote' && finding.reviewStatus === 'accepted')
        ? 'EXCLUDE COMMUNITY ANECDOTES'
        : `STRESS-TEST ${workspace.candidates.find((candidate) => candidate.id === workspace.selectedCandidateId)?.name === 'First-Value Flightpath' ? 'FLIGHTPATH' : 'SELECTED IDEA'}`;
    }
    if (workspace.stage === 'STRESS_TESTING') return 'FINALIZE BLUEPRINT';
    return 'BLUEPRINT FINALIZED';
  })();

  const defineProblem = useCallback((problemStatement: string) => {
    const result = service.updateProblemBrief({ problemStatement }, 'human');
    report(result);
    return result.ok;
  }, [report, service]);

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
    setTraceNodes([]);
    setLastExport(undefined);
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
    traceNodes,
    primaryActionLabel,
    runPrimaryAction,
    defineProblem,
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
