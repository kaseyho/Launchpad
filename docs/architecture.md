# LaunchPad architecture

## One state machine, two operators

LaunchPad keeps the application workspace mounted while its internal stage advances:

```text
EMPTY → PROBLEM_DEFINED → RESEARCH_PLANNED → SOURCING
      → EVIDENCE_REVIEW → INSIGHTS_READY → CANDIDATES_READY
      → STRESS_TESTING → FINALIZED
```

`FoundryService` is the only layer allowed to perform a domain transition. Human controls and WebMCP handlers receive the same service object, so agent activity is neither simulated nor stored in a parallel state. Every successful or rejected operation updates the visible activity log with actor, tool, version, summary, timestamp, and status.

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

The 17 tools register from the top-level client page through `document.modelContext.registerTool`. `research_and_ideate` mirrors the product’s complete autonomous run; the other 16 expose its underlying state and operations. Each tool:

- has a narrow JSON schema with `additionalProperties: false`;
- operates only on the active anonymous workspace;
- calls one domain service method;
- declares side effects in its description;
- returns success state, modified IDs, and enough data to verify the operation;
- returns structured errors rather than masking a failed state gate;
- never returns secrets, raw credentials, or storage bindings.

Read tools use `readOnlyHint`. They still add an audit event so the shared page shows that an agent inspected state, but they do not change research decisions.

## Persistence and uploads

D1 is the authoritative durable store. A random workspace storage key is issued as an HTTP-only, same-site cookie, avoiding shared global demo state without adding a sign-in gate. The domain workspace ID remains stable inside the snapshot so links and fixtures stay deterministic. Version-aware upserts prevent an older client snapshot from overwriting a newer one.

R2 stores uploaded bytes. The `uploaded_files` D1 table stores filename, MIME type, size, object key, workspace key, and upload time. Uploads are restricted to PDF, TXT, CSV, and JSON, capped at 10 MB, and assigned random object keys. If the D1 metadata write fails, the just-uploaded R2 object is removed.

Text-like uploads can provide an exact excerpt to the normal import/extraction path. PDFs remain `metadata_only` until their content is supplied through a trusted parser or by the user. No uploaded content is rendered as HTML.

Academic search calls Crossref from a same-origin server route and normalizes DOI, authors, publication date, venue, and publisher. Selecting a result imports metadata only. Extraction fails with `NO_EXACT_PASSAGE` until a readable, user-authorized passage is available; metadata is never silently promoted into evidence.

## Public/private evidence

Sources carry both `accessMode` and `private` fields. The seeded GA4 and support evidence is disclosed synthetic private data. The default blueprint export filters out private sources and findings. Including private evidence is an explicit opt-in argument on `export_blueprint`.

## Deterministic demo strategy

The curated scenario is intentionally deterministic so a judge can complete the entire flow in under two minutes and observe the mandatory evidence-removal moment every time. Public source URLs are genuine and inspectable; the product never pretends that seeded search is a general-purpose web crawler. User URLs, pasted excerpts, and stored documents enter through the same source and review model.
