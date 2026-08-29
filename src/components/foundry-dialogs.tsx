import { useState } from 'react';
import type { FoundryService } from '../domain/foundry-service';
import type { ProblemBrief, ServiceFailure, ServiceSuccess } from '../domain/types';
import type { AcademicSearchResult } from '../search/crossref';

interface SourceDialogProps {
  open: boolean;
  onClose: () => void;
  service: FoundryService;
  report: (result: ServiceSuccess<unknown> | ServiceFailure) => unknown;
}

interface ProblemDialogProps {
  open: boolean;
  onClose: () => void;
  brief: ProblemBrief;
  service: FoundryService;
  report: (result: ServiceSuccess<unknown> | ServiceFailure) => unknown;
}

export function ProblemDialog({ open, onClose, brief, service, report }: ProblemDialogProps) {
  if (!open) return null;
  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
      <form className="foundry-dialog source-dialog" role="dialog" aria-modal="true" aria-label="Edit problem brief" onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const lines = (name: string) => String(data.get(name) || '').split('\n').map((item) => item.trim()).filter(Boolean);
        const result = service.updateProblemBrief({
          problemType: String(data.get('problem_type') || 'product opportunity'),
          problemStatement: String(data.get('problem_statement') || ''),
          targetAudience: String(data.get('target_audience') || ''),
          desiredOutcome: String(data.get('desired_outcome') || ''),
          currentBehavior: String(data.get('current_behavior') || ''),
          timeframe: String(data.get('timeframe') || ''),
          geography: String(data.get('geography') || 'Not specified'),
          constraints: lines('constraints'),
          excludedApproaches: lines('excluded_approaches'),
        });
        report(result);
        if (result.ok) onClose();
      }}>
        <header className="dialog-header"><div><span>INPUT / PROBLEM HOPPER</span><h2>EDIT PROBLEM BRIEF</h2></div><button type="button" onClick={onClose}>CLOSE ×</button></header>
        <label><span>PROBLEM TYPE</span><input name="problem_type" defaultValue={brief.problemType} /></label>
        <label><span>PROBLEM STATEMENT</span><textarea name="problem_statement" defaultValue={brief.problemStatement} rows={4} required /></label>
        <label><span>TARGET AUDIENCE</span><input name="target_audience" defaultValue={brief.targetAudience} required /></label>
        <label><span>DESIRED OUTCOME</span><input name="desired_outcome" defaultValue={brief.desiredOutcome} required /></label>
        <label><span>CURRENT BEHAVIOR</span><textarea name="current_behavior" defaultValue={brief.currentBehavior} rows={2} /></label>
        <label><span>TIMEFRAME</span><input name="timeframe" defaultValue={brief.timeframe} required /></label>
        <label><span>GEOGRAPHY</span><input name="geography" defaultValue={brief.geography} /></label>
        <label><span>CONSTRAINTS / ONE PER LINE</span><textarea name="constraints" defaultValue={brief.constraints.join('\n')} rows={3} /></label>
        <label><span>EXCLUDED APPROACHES / ONE PER LINE</span><textarea name="excluded_approaches" defaultValue={brief.excludedApproaches.join('\n')} rows={2} /></label>
        <button className="primary-action" type="submit">SAVE PROBLEM BRIEF <span>↗</span></button>
      </form>
    </div>
  );
}

export function SourceDialog({ open, onClose, service, report }: SourceDialogProps) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [sourceType, setSourceType] = useState<'report' | 'paper' | 'customer' | 'analytics' | 'community'>('report');
  const [isPrivate, setIsPrivate] = useState(false);
  const [file, setFile] = useState<File>();
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [academicResults, setAcademicResults] = useState<AcademicSearchResult[]>([]);
  if (!open) return null;

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
      <form className="foundry-dialog source-dialog" role="dialog" aria-modal="true" aria-label="Add source" onSubmit={async (event) => {
        event.preventDefault();
        setError('');
        setUploading(true);
        try {
          let importedTitle = title.trim();
          let importedUrl = url || undefined;
          let importedExcerpt = excerpt || undefined;
          if (file) {
            const form = new FormData();
            form.set('file', file);
            const response = await fetch('/api/files', { method: 'POST', body: form });
            const payload = await response.json() as { file?: { filename: string; document_url: string; excerpt?: string }; message?: string };
            if (!response.ok || !payload.file) throw new Error(payload.message || 'The document could not be stored.');
            importedTitle ||= payload.file.filename;
            importedUrl = payload.file.document_url;
            importedExcerpt = payload.file.excerpt;
          }
          const result = service.importSource({ title: importedTitle, url: importedUrl, excerpt: importedExcerpt, sourceType, private: isPrivate, lane: sourceType === 'analytics' ? 'first_party' : sourceType === 'community' ? 'community' : 'customer' });
          report(result);
          if (result.ok) {
            setTitle(''); setUrl(''); setExcerpt(''); setFile(undefined); setIsPrivate(false); onClose();
          } else {
            setError(result.error.message);
          }
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : 'The source could not be imported.');
        } finally {
          setUploading(false);
        }
      }}>
        <header className="dialog-header"><div><span>STATION 01 / SOURCE DOCK</span><h2>ADD SOURCE CRATE</h2></div><button type="button" onClick={onClose}>CLOSE ×</button></header>
        <label><span>TITLE {file ? '(OPTIONAL — USES FILENAME)' : ''}</span><input value={title} onChange={(event) => setTitle(event.target.value)} required={!file} /></label>
        <label><span>SOURCE TYPE</span><select value={sourceType} onChange={(event) => setSourceType(event.target.value as typeof sourceType)}><option value="report">Public report</option><option value="paper">Research paper</option><option value="customer">Customer evidence</option><option value="analytics">Analytics export</option><option value="community">Community excerpt</option></select></label>
        <div className="academic-search">
          <label><span>CROSSREF ACADEMIC METADATA SEARCH</span><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="worked examples cognitive load" /></label>
          <button type="button" disabled={searching || searchQuery.trim().length < 3} onClick={async () => {
            setSearching(true); setError('');
            try {
              const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery.trim())}`);
              const payload = await response.json() as { results?: AcademicSearchResult[]; message?: string };
              if (!response.ok) throw new Error(payload.message || 'Academic metadata search failed.');
              setAcademicResults(payload.results ?? []);
              if (!payload.results?.length) setError('No citation-complete Crossref records matched that query.');
            } catch (caught) {
              setError(caught instanceof Error ? caught.message : 'Academic metadata search failed.');
            } finally {
              setSearching(false);
            }
          }}>{searching ? 'SEARCHING…' : 'SEARCH CROSSREF ↗'}</button>
          {academicResults.length > 0 && <div className="academic-results" aria-label="Academic search results">
            {academicResults.map((result) => <button key={result.doi} type="button" onClick={() => {
              setTitle(result.title); setUrl(result.url); setExcerpt(''); setSourceType('paper'); setAcademicResults([]);
            }}><strong>{result.title}</strong><span>{result.authors} · {result.published_at} · {result.venue}</span></button>)}
          </div>}
        </div>
        <label><span>PUBLIC URL (OPTIONAL WITH EXCERPT)</span><input type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://…" /></label>
        <label><span>PASTED EXCERPT (OPTIONAL WITH URL)</span><textarea value={excerpt} onChange={(event) => setExcerpt(event.target.value)} rows={5} /></label>
        <label><span>OR UPLOAD EVIDENCE / PDF, TXT, CSV, JSON / MAX 10 MB</span><input type="file" accept=".pdf,.txt,.csv,.json,application/pdf,text/plain,text/csv,application/json" onChange={(event) => setFile(event.target.files?.[0])} /></label>
        <label className="checkbox-label"><input type="checkbox" checked={isPrivate} onChange={(event) => setIsPrivate(event.target.checked)} /><span>PRIVATE EVIDENCE — EXCLUDE FROM PUBLIC EXPORTS</span></label>
        {error && <p className="dialog-error" role="alert">{error}</p>}
        <button className="primary-action" type="submit" disabled={uploading}>{uploading ? 'STORING SOURCE…' : 'IMPORT SOURCE'} <span>↗</span></button>
      </form>
    </div>
  );
}
