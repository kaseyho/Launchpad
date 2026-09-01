# LaunchPad architecture

## One state machine, two operators

LaunchPad keeps the application workspace mounted while its internal stage advances:

```text
EMPTY → PROBLEM_DEFINED → RESEARCH_PLANNED → SOURCING
      → EVIDENCE_REVIEW → INSIGHTS_READY → CANDIDATES_READY
      → STRESS_TESTING → FINALIZED
```

`FoundryService` is the only layer allowed to perform a domain transition. Human controls and WebMCP handlers receive the same service object, so agent activity is neither simulated nor stored in a parallel state. Every committed operation and rejected write updates the visible activity log with actor, tool, version, summary, timestamp, and status. Pure reads—including invalid read requests—never change the workspace version or Activity.

## Evidence-to-decision graph

The core relationship is explicit rather than embedded in generated prose:

```text
Source → Finding → InsightCluster → EvidenceLink → Candidate component
                                                → Final blueprint decision
```

A finding stores the normalized claim, evidence category, quantitative context when present, population, geography, timeframe, caveats, review status, quality dimensions, and a complete citation object. Candidate support is calculated from accepted links. Rejecting a finding therefore changes support coverage and can change which candidate is recommended.

The final `trace_evidence` operation resolves one component path, such as `features.0`, back through its supporting insight and finding to the original source. The UI renders the same returned nodes as an illuminated proof path.

## State gates

Operations fail closed when their prerequisites are not met. Examples:

- research planning requires a non-empty problem statement;
- source search requires a research plan;
- extraction requires known source IDs;
- synthesis requires at least four accepted findings;
- candidate generation requires four accepted findings across two evidence categories;
- stress testing requires accepted counter-evidence;
- finalization requires at least six accepted findings, three independent source domains, two evidence categories, quantitative and qualitative proof, counter-evidence, and complete component support.

Failures contain a stable code, an actionable message, and current/required counts where useful. The error appears beside the failed action and remains available in the activity drawer.

## Presentation boundary

The interface derives its visuals from domain state instead of maintaining a second animation state machine. `factory-stages.ts` maps the current workspace stage, progress, counts, and latest agent event into seven factory stations. The procedural Three.js scene renders those stations, conveyor packets, and beacon state; selecting a station reveals its real metric and purpose.

The first viewport keeps three responsibilities distinct: the launch brief defines the human goal, the factory shows where the workflow is, and the WebMCP rail explains how an agent operates the same product. The full research workbench sits below this overview. Audit history is deliberately hidden behind the **Activity** control so it can prove an agent action without permanently crowding the workspace.

## WebMCP boundary

The top-level client registers only the tools useful at the current stage through `document.modelContext.registerTool`. A registration lifetime owns an `AbortSignal`; the UI reports readiness only after all asynchronous registrations succeed, disposes the prior surface on stage changes, and propagates execution cancellation into long-running research. WebMCP is an evidence mission over the same domain service, not a second research implementation. Each tool:

- has a narrow JSON schema with `additionalProperties: false`;
- operates only on the active anonymous workspace;
- calls the shared domain service or composes its pure previews;
- declares side effects in its description;
- returns a bounded receipt with workspace version, modified IDs, next actions, and compact verification data;
- returns structured errors rather than masking a failed state gate;
- never returns secrets, raw credentials, or storage bindings.

Read tools use `readOnlyHint` and do not change version, timestamps, active tool, or activity. Evidence-returning tools use `untrustedContentHint`. Evidence batches validate every record before one atomic commit and retain origin, retrieval method, retrieval time, permission scope, and deduplication fingerprint.

Evidence policies are eligibility filters over the complete ledger. A comparison clones and recalculates candidate coverage without mutation. Applying a policy stores the filter and reranks candidates while preserving every finding and review decision, so rollback is lossless.

Evidence review, finalization, and private export are preview/commit operations. Their commit tools open an in-page consent dialog listing exact IDs, privacy scope, and workspace version. Approval comes only from the human button; decline, abort, or a stale version leaves domain state unchanged.

## Persistence and uploads

D1 is the authoritative durable store. A random workspace storage key is issued as an HTTP-only, same-site cookie, avoiding shared global demo state without adding a sign-in gate. The domain workspace ID remains stable inside the snapshot so links and fixtures stay deterministic. Version-aware upserts prevent an older client snapshot from overwriting a newer one.

R2 stores uploaded bytes. The `uploaded_files` D1 table stores filename, MIME type, size, object key, workspace key, and upload time. Uploads are restricted to PDF, TXT, CSV, and JSON, capped at 10 MB, and assigned random object keys. If the D1 metadata write fails, the just-uploaded R2 object is removed.

Text-like uploads can provide an exact excerpt to the normal import/extraction path. PDFs remain `metadata_only` until their content is supplied through a trusted parser or by the user. No uploaded content is rendered as HTML.

The autonomous `/api/research` route calls SoCLaaS's OpenAI-compatible Responses API with forced web search and a strict report schema. It accepts a report only when each source URL appeared in the web-search output, the source set includes supporting and counter evidence, and the recommendation is specific to the submitted request. Requests for a current result without essential parameters return clarification questions rather than a fabricated recommendation. The SoCLaaS credential is server-only and is never returned to the browser or WebMCP.

AI-produced findings are stored as conservative, citation-linked syntheses with `evidenceOrigin: ai_web_synthesis`; the UI tells the user to open the original source to verify wording and context. They are not represented as verbatim passages. Separately, the Crossref and Reddit adapters remain available through the same-origin manual search route. User-pasted text retains its verbatim origin, and metadata-only records still fail extraction with `NO_EXACT_PASSAGE`.

## Public/private evidence

Sources carry `accessMode`, `private`, and optional provenance fields. The seeded GA4 and support evidence is disclosed synthetic private data. Public-safe exports filter out private sources and findings. A private-inclusive export requires an explicit argument plus a visible human-consent checkpoint.

## Deterministic demo strategy

The curated scenario is intentionally deterministic so a judge can complete the entire flow in under two minutes and observe the mandatory evidence-removal moment every time. Public source URLs are genuine and inspectable; the product never pretends that seeded search is a general-purpose web crawler. User URLs, pasted excerpts, and stored documents enter through the same source and review model.
