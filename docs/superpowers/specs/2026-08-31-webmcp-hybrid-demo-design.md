# WebMCP Hybrid Demo Design

## Goal

Make LaunchPad WebMCP-native: the browser agent must gather and qualify evidence from the user's live browser context, close evidence gaps, apply evidence policies, compare counterfactual recommendations, and prove the resulting decision on the same visible page.

## Product boundary

LaunchPad remains the evidence compiler and source of truth. The browser agent orchestrates other tabs and returns structured evidence to LaunchPad; LaunchPad does not claim direct access to arbitrary sites or private sessions. The existing server-side research runner remains a public-web fallback, while the judge demo centers on browser-agent evidence ingestion and counterfactual auditing.

The existing `FoundryService` remains the only domain mutation boundary. Human controls, server research, and WebMCP handlers continue to share the same workspace and evidence graph.

## P0: trustworthy WebMCP contract

- Register tools asynchronously and pass an `AbortSignal` both to registration lifecycle and tool execution.
- Report WebMCP readiness only after every active tool registration resolves.
- Dynamically expose only tools valid for the current workspace stage.
- Pure reads must not change workspace version, activity, active tool, or UI selection state.
- A tool that deliberately highlights the page is a write tool, not a read-only tool.
- Mark outputs containing imported, web, community, or user-authored evidence with `untrustedContentHint`.
- Agent evidence decisions, blueprint finalization, and private export require a visible in-page consent request that only a human button can approve.
- Every tool response must be a compact receipt containing `ok`, `workspace_version`, `modified_ids`, `next_actions`, and either compact `data` or a recoverable `error` object.
- Tool responses must stay at or below 1,500 characters; full exports remain downloads in the page rather than tool payloads.

## P1: browser-native evidence mission

### Batch evidence ingestion

`ingest_evidence_batch` accepts one to eight evidence items. Each item records:

- title, source type, lane, URL or exact excerpt;
- publisher and publication date when known;
- `retrieved_at` as an ISO timestamp;
- `source_origin` identifying the page or connector that supplied it;
- `permission_scope` as `public` or `private_authorized`;
- whether the record contains private evidence.

Private items are rejected unless `permission_scope` is `private_authorized`. Items are deduplicated and committed in one workspace version so the visible factory receives one coherent batch.

### Gap-directed research

Gap analysis returns both human-readable gaps and structured next actions. Each action names the missing evidence category or lane, explains why it matters, and recommends the next WebMCP operation.

### Evidence policies and counterfactuals

An evidence policy can constrain:

- allowed source types;
- earliest publication date;
- geography;
- minimum independent corroboration per candidate component;
- privacy scope (`public_only` or `authorized_private`).

`compare_evidence_policy` is a pure read that reports excluded finding IDs, baseline and projected recommendation, score and coverage deltas, and whether the recommendation changes. `apply_evidence_policy` persists the policy and recalculates the visible candidate ranking without deleting evidence.

### Preview and commit

WebMCP exposes preview tools for evidence review, finalization, and export. The preview opens an in-page consent dialog. Only a human click can approve or reject it. Approval performs the prepared action against the workspace version captured by the request; stale requests fail recoverably instead of applying to a changed workspace.

## P2: agent quality evidence

- Deterministic tests cover registration, cancellation, stage-specific tool availability, receipts, consent, policy calculations, and visible page mutations.
- An eval dataset covers direct prompts, ambiguous prompts, sequencing, and mid-chain failures.
- A model-backed eval runner scores tool selection, required arguments, order constraints, and recovery. It skips with a clear configuration message when no provider credential exists.
- The connected-browser journey records the exact tool sequence and before/after workspace versions.
- The primary demo does not lead with tool count, subscription plans, or server-provider details. It leads with live context, evidence gaps, policy-driven recommendation change, and proof lineage.

## Judge demo

The target prompt is:

> Use this LaunchPad mission and the evidence available in my browser. Import the public and authorized private signals, ignore community anecdotes unless they are independently corroborated, find one credible counter-signal, and show whether the recommendation changes when evidence before 2025 is excluded. Do not finalize until I approve.

The two-minute journey must visibly show evidence arrival, a gap request, counter-evidence closure, a policy comparison, a recommendation delta, a trace to source, and a human-approved public-safe export.

## Non-goals

- LaunchPad will not scrape authenticated sites without user authorization.
- It will not expose all internal service methods simultaneously merely to increase tool count.
- It will not treat WebMCP annotations as authorization; application-level validation and consent remain mandatory.
- It will not claim that synthetic data proves the live-browser workflow.
