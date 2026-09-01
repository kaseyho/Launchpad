# WebMCP Hybrid Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a trustworthy, stage-aware WebMCP evidence mission with batch provenance, policy counterfactuals, human consent, agent evals, and a judge-ready connected-browser demo.

**Architecture:** `FoundryService` remains the mutation boundary. WebMCP registers a small stage-specific outcome surface, returns compact versioned receipts, and uses an in-page consent broker for sensitive agent actions. Evidence policies are non-destructive workspace filters, so comparisons and applied rankings preserve the complete evidence ledger.

**Tech Stack:** TypeScript 5.9, React 19, Vinext/Next, Vitest, WebMCP `document.modelContext`, existing D1/browser workspace persistence.

**Spec:** `docs/superpowers/specs/2026-08-31-webmcp-hybrid-demo-design.md`

## Global Constraints

- Preserve all pre-existing uncommitted workspace, normalization, and persistence changes.
- Do not commit or push; this checkout was already dirty and the user did not request repository-history changes.
- Keep `FoundryService` as the only domain mutation boundary.
- Keep public/private evidence truthful: signed-in or private data requires explicit authorization.
- Every production behavior follows a witnessed red-green TDD cycle.
- Full completion requires automated verification and connected-browser evidence; unit tests alone are insufficient.

---

### Task 1: Versioned service receipts and genuinely pure reads

**Files:**
- Modify: `src/domain/types.ts`
- Modify: `src/domain/foundry-service.ts`
- Test: `src/domain/foundry-service.test.ts`

**Interfaces:**
- Produces: `ServiceResult<T>.workspaceVersion`, `ServiceResult<T>.nextActions`, and exported `nextActionsForWorkspace(workspace)`.
- Produces: pure `getFoundryState`, `getEvidenceGaps`, and `inspectCandidate` methods that never call the mutation commit helper.

- [ ] **Step 1: Write failing tests for pure reads and versioned receipts**

Add tests that capture a workspace snapshot, invoke each pure read, and assert identical `version`, `activity`, `activeTool`, and `updatedAt`. Assert success and failure receipts expose the current workspace version and actionable next steps.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- src/domain/foundry-service.test.ts`

Expected: failures because reads currently append activity and service results do not expose versioned next actions.

- [ ] **Step 3: Implement the pure-read helper and receipt metadata**

Add a non-mutating success constructor beside `commit`. Make `commit` and `fail` attach the resulting workspace version plus `nextActionsForWorkspace`. Route the three pure reads through the non-mutating constructor.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `npm test -- src/domain/foundry-service.test.ts`

Expected: all focused tests pass with no workspace mutation from pure reads.

### Task 2: Current WebMCP lifecycle, annotations, compact receipts, and dynamic tools

**Files:**
- Modify: `src/webmcp/register-tools.ts`
- Modify: `src/webmcp/model-context.d.ts`
- Modify: `src/hooks/use-webmcp.ts`
- Modify: `src/components/factory-shell.tsx`
- Test: `src/webmcp/register-tools.test.ts`
- Test: `src/components/factory-shell.test.tsx`

**Interfaces:**
- Produces: `WebMCPToolExecuteOptions { signal: AbortSignal }`.
- Produces: `WebMCPRegistration { ready: Promise<void>; dispose(): void; toolNames: string[] }`.
- Produces: `activeToolNamesForStage(stage)` and stage-filtered `getFoundryToolDefinitions`.
- Produces: tool annotations with `readOnlyHint` and `untrustedContentHint`.

- [ ] **Step 1: Write failing lifecycle and tool-surface tests**

Test delayed registration readiness, registration rejection, disposal through `AbortSignal`, execution cancellation, stage-specific tool names, honest read-only annotations, untrusted evidence annotations, and the 1,500-character receipt ceiling.

- [ ] **Step 2: Run WebMCP tests and verify RED**

Run: `npm test -- src/webmcp/register-tools.test.ts src/components/factory-shell.test.tsx`

Expected: failures because registration is synchronous, all tools are static, cancellation options are ignored, and only `readOnlyHint` exists.

- [ ] **Step 3: Implement the current lifecycle and compact receipt formatter**

Use an `AbortController` for registration lifetime, await all registration promises before setting ready, propagate the execution signal to long-running callbacks, add titles and annotations, and return compact receipts with recoverable error metadata. Do not include full export content in tool output.

- [ ] **Step 4: Implement stage-specific registration**

Register only the tools valid for the current `FoundryStage`. Re-register on stage/version changes by disposing the previous controller. Keep `get_foundry_state` available throughout and expose recovery operations in error states.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run: `npm test -- src/webmcp/register-tools.test.ts src/components/factory-shell.test.tsx`

Expected: all lifecycle, annotation, receipt, and stage tests pass.

### Task 3: Batch evidence with provenance and privacy validation

**Files:**
- Modify: `src/domain/types.ts`
- Modify: `src/domain/foundry-service.ts`
- Modify: `src/webmcp/register-tools.ts`
- Test: `src/domain/foundry-service.test.ts`
- Test: `src/webmcp/register-tools.test.ts`

**Interfaces:**
- Produces: `EvidenceProvenance`, `EvidenceBatchItem`, and `FoundryService.ingestEvidenceBatch(input, actor)`.
- Produces: WebMCP tool `ingest_evidence_batch` accepting one to eight items.

- [ ] **Step 1: Write failing provenance, deduplication, and privacy tests**

Cover one-version batch commit, valid public and private-authorized records, rejection of unauthorized private records, ISO retrieval timestamps, invalid origins, and duplicate items.

- [ ] **Step 2: Run focused domain/WebMCP tests and verify RED**

Run: `npm test -- src/domain/foundry-service.test.ts src/webmcp/register-tools.test.ts`

Expected: failures because batch types, service method, and tool do not exist.

- [ ] **Step 3: Implement batch ingestion through one domain commit**

Validate all items before mutation, derive stable fingerprints, persist provenance on each `Source`, and return compact created/existing IDs. Reject the complete batch atomically if any item violates its permission scope.

- [ ] **Step 4: Register the untrusted batch tool and verify GREEN**

Run: `npm test -- src/domain/foundry-service.test.ts src/webmcp/register-tools.test.ts`

Expected: all batch and tool tests pass.

### Task 4: Gap actions, evidence policies, and counterfactual ranking

**Files:**
- Modify: `src/domain/types.ts`
- Modify: `src/domain/foundry-service.ts`
- Modify: `src/webmcp/register-tools.ts`
- Test: `src/domain/foundry-service.test.ts`
- Test: `src/webmcp/register-tools.test.ts`

**Interfaces:**
- Produces: `EvidencePolicy`, `EvidencePolicyComparison`, `compareEvidencePolicy`, and `applyEvidencePolicy`.
- Extends: `getEvidenceGaps` data with structured `nextActions` naming lane, evidence type, reason, and suggested tool.
- Produces: WebMCP tools `compare_evidence_policy` and `apply_evidence_policy`.

- [ ] **Step 1: Write failing gap-action and policy tests**

Test source-type, date, geography, corroboration, and privacy filters; verify comparison is pure; verify applying a policy preserves evidence but changes visible candidate coverage/ranking; verify rollback to the default policy restores baseline ranking.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm test -- src/domain/foundry-service.test.ts src/webmcp/register-tools.test.ts`

Expected: failures because policies and structured gap actions do not exist.

- [ ] **Step 3: Implement policy eligibility and non-destructive recalculation**

Centralize finding eligibility. Candidate coverage must count distinct supporting source families per component and honor `minimumCorroboration`. Comparison clones the workspace; application stores `activeEvidencePolicy` and recalculates without changing review statuses.

- [ ] **Step 4: Implement compact policy tools and verify GREEN**

Run: `npm test -- src/domain/foundry-service.test.ts src/webmcp/register-tools.test.ts`

Expected: all policy, gap, and tool tests pass.

### Task 5: Human consent broker and preview-before-commit actions

**Files:**
- Create: `src/components/agent-consent-dialog.tsx`
- Create: `src/components/agent-consent-dialog.test.tsx`
- Modify: `src/hooks/use-webmcp.ts`
- Modify: `src/webmcp/register-tools.ts`
- Modify: `src/components/factory-shell.tsx`
- Test: `src/webmcp/register-tools.test.ts`
- Test: `src/components/factory-shell.test.tsx`

**Interfaces:**
- Produces: `AgentConsentRequest` for evidence review, finalization, and private export.
- Produces: `requestAgentConsent(request, signal): Promise<boolean>` owned by `useWebMCP`.
- Replaces direct agent mutations with `review_evidence_with_consent`, `finalize_blueprint_with_consent`, and `export_blueprint_with_consent`.

- [ ] **Step 1: Write failing consent UI and tool tests**

Test that a sensitive tool pauses before mutation, renders exact affected IDs/privacy scope, declines without mutation, approves only from a human button, aborts cleanly, and rejects stale workspace versions.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm test -- src/components/agent-consent-dialog.test.tsx src/webmcp/register-tools.test.ts src/components/factory-shell.test.tsx`

Expected: failures because the consent broker and dialog do not exist.

- [ ] **Step 3: Implement the consent broker and dialog**

Keep one pending request at a time. Bind each request to the current workspace version. Resolve only from Approve or Decline buttons; abort or component cleanup resolves false. For approved exports, return a compact receipt while placing the complete file in the existing download surface.

- [ ] **Step 4: Route sensitive WebMCP actions through consent and verify GREEN**

Run: `npm test -- src/components/agent-consent-dialog.test.tsx src/webmcp/register-tools.test.ts src/components/factory-shell.test.tsx`

Expected: all consent tests pass and direct agent mutation is unavailable.

### Task 6: Judge-facing WebMCP narrative and visible execution receipts

**Files:**
- Modify: `src/components/webmcp-run-rail.tsx`
- Modify: `src/components/webmcp-run-rail.test.tsx`
- Modify: `src/components/factory-shell.tsx`
- Modify: `app/globals.css`
- Modify: `README.md`
- Modify: `docs/architecture.md`
- Modify: `docs/demo-script.md`

**Interfaces:**
- Consumes: active tool names, readiness/error state, latest agent activity, policy comparison, and pending consent.
- Produces: a primary evidence-mission message, compact connection receipt, and copyable judge prompt.

- [ ] **Step 1: Write failing presentation tests**

Require the primary view to lead with live browser context, gap closure, policy change, and proof. Reject `optional agent control`, a tool-count headline, and subscription-led demo copy. Require copy feedback and visible before/after workspace versions.

- [ ] **Step 2: Run component/page tests and verify RED**

Run: `npm test -- src/components/webmcp-run-rail.test.tsx src/components/factory-shell.test.tsx app/page.test.tsx`

Expected: failures on the old optional/control-plane copy and missing judge prompt.

- [ ] **Step 3: Implement the judge-facing rail and documentation**

Keep Plans functional but secondary. Surface the connected browser-agent mission, current stage tools, latest version transition, consent status, and copyable target prompt. Align README, architecture, and demo script with the shipped behavior and exact tool names.

- [ ] **Step 4: Run presentation tests and verify GREEN**

Run: `npm test -- src/components/webmcp-run-rail.test.tsx src/components/factory-shell.test.tsx app/page.test.tsx`

Expected: all presentation tests pass.

### Task 7: Agent eval dataset, model runner, and failure recovery

**Files:**
- Create: `src/webmcp/agent-evals.ts`
- Create: `src/webmcp/agent-evals.test.ts`
- Create: `scripts/run-webmcp-evals.mjs`
- Modify: `package.json`
- Modify: `README.md`

**Interfaces:**
- Produces: `WEBMCP_AGENT_EVALS` with expected ordered/unordered calls and argument predicates.
- Produces: `npm run eval:webmcp`, which exits non-zero on evaluated failures and exits with a documented skip code/message when provider credentials are absent.

- [ ] **Step 1: Write failing dataset and scorer tests**

Include direct mission start, ambiguous live-context ingestion, counterfactual policy comparison, denied consent, missing counter-evidence, stale-version recovery, and mid-chain finalization failure.

- [ ] **Step 2: Run eval unit tests and verify RED**

Run: `npm test -- src/webmcp/agent-evals.test.ts`

Expected: failure because the eval dataset and scorer do not exist.

- [ ] **Step 3: Implement the dataset, scorer, and provider runner**

The runner supplies the active stage's real tool definitions to the configured model, records selected calls and arguments, and scores required order plus recovery. It must never print provider credentials or private evidence.

- [ ] **Step 4: Run eval tests and available model evals**

Run: `npm test -- src/webmcp/agent-evals.test.ts`

Run: `npm run eval:webmcp`

Expected: unit tests pass; model evals either produce a scored report or an explicit credential-unavailable result without fabricating success.

### Task 8: Full verification and connected-browser journey

**Files:**
- Modify as needed only when a failing verification produces a new regression test first.
- Record: `artifacts/demo/webmcp-journey.json`
- Update: `artifacts/demo/README.md`

**Interfaces:**
- Produces: a tool-sequence artifact with prompt, tool names, before/after workspace versions, consent outcome, policy delta, and final public-safe export result.

- [ ] **Step 1: Run the complete automated verification matrix**

Run: `npm test`

Run: `npx next typegen && npx tsc --noEmit`

Run: `npm run lint`

Run: `npm run build`

Run: `git diff --check`

Expected: every command exits zero; test output contains no failures.

- [ ] **Step 2: Run the local browser journey**

Open the app in the in-app browser, verify tool discovery, execute the target journey, approve the visible consent request, and verify the same page displays evidence arrival, gap closure, policy comparison, recommendation result, trace, and export receipt.

- [ ] **Step 3: Run the judging-host journey when the ChatGPT built-in browser is available**

Repeat the exact prompt and record the observed tool sequence and workspace version transitions. If this host is unavailable in the current environment, report that gate as externally unverified rather than substituting a unit test.

- [ ] **Step 4: Audit every roadmap requirement against evidence**

Map each P0, P1, P2, pitch, and demo requirement to a test, source location, or browser artifact. Leave the goal active if any required gate lacks authoritative proof.
