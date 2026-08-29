# ProofFoundry P0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and publish the complete hackathon P0 described in `docs/prd.md`: a visual, manually usable, WebMCP-native research foundry that produces proof-carrying idea blueprints with inspectable evidence lineage.

**Architecture:** A single persistent React workspace owns all visible state and calls a framework-independent TypeScript domain service. The same service methods power manual UI actions and top-level `document.modelContext.registerTool` handlers. Durable anonymous workspace snapshots use the Sites D1 binding, uploaded evidence uses R2, academic metadata uses Crossref, and the curated demo is deterministic with inspectable public citations.

**Tech Stack:** Sites Vinext scaffold, React, TypeScript, Vite/Vinext, Cloudflare-compatible server routes, D1, Vitest, Testing Library, CSS/SVG motion, native WebMCP JavaScript API.

**Spec:** `docs/prd.md`

## Global Constraints

- Implement every P0 item and every item in the PRD Definition of Done; do not add P1/P2 connectors.
- Register tools from the top-level page with `document.modelContext.registerTool`.
- Expose at least the 16 named composable tools from PRD section 18; no one-shot research-and-generate tool.
- Manual controls and WebMCP tools must invoke the same domain operations.
- Preserve exact excerpts and source URLs for every public citation; label synthetic first-party data clearly.
- Facts, hypotheses, counter-evidence, and derived calculations must be visually distinct.
- No numerical blueprint claim without citation context or a visible derived calculation.
- The factory metaphor must reflect actual records and state transitions.
- Desktop-first for side-by-side browser use, with contained tablet/mobile overflow and keyboard access.
- Respect `prefers-reduced-motion`; no WebGL or decorative spinner-only loading.
- Do not use gated Reddit or LinkedIn APIs.
- Exporting is a clear human action and excludes private evidence by default.

## UI Decision Brief

- Surface type: agent/tool run plus editor/canvas.
- Platform idiom: dense web workspace.
- Product thesis: turn fragmented evidence into one defensible, testable idea while keeping every decision traceable.
- Visual direction: industrial monospace, interpreted through the PRD's 2.5D neon research factory.
- Density: operational; three-pane first viewport plus production log.
- Hierarchy: active factory station and selected work artifact first, manual next-step action second, HUD and log supporting.
- Component grammar: stable panes, station conveyor, compact controls, status tags, master/detail evidence inspector, blueprint document.
- Typography: self-hosted open fonts; pixel-inspired display only for headings, readable sans/mono for evidence.
- Color/materials: near-black navy, indigo panels, acid lime, electric cyan, hot pink, amber, coral; crisp rules instead of generic shadows.
- Motion budget: functional; station pulse, crate/finding arrival, evidence-path illumination, blueprint assembly; all become instant state changes under reduced motion.
- Implementation track: Sites React/Vinext because persistent state, repeated components, inspectors, exports, and WebMCP handlers require a real application model.
- Responsive containment: panes stack into tabbed regions, toolbars wrap, long evidence text wraps, logs/tables scroll inside bounded regions.
- Asset plan: CSS/SVG factory diagram and Lucide-style icons only where semantics benefit; one generated social card after first preview; no stock imagery.
- Reference extraction: use Cubecade only for the structural lessons of visible agent readiness, queued actions, and a central interactive object; do not copy its cube, layout, assets, or trade dress.
- State visuals: empty, active, partial evidence, quality-gate failure, inaccessible source, WebMCP unavailable, blueprint success.
- Tasteful risk: the final blueprint physically reassembles when evidence is excluded, restrained by stable controls and document-readable content.
- Bans: generic SaaS hero, interchangeable KPI cards, decorative blobs, random gradients, fake citations, unclear spinners, page-level horizontal overflow.

## Quality Bar

- Specific job: audit and transform one ambiguous setup-activation problem into a testable intervention.
- Proof surface: live evidence-to-decision graph, evidence inspector, quality gates, and blueprint proof cards.
- Required states: empty, loading/active, partial, error, insufficient evidence, WebMCP unavailable, finalized success.
- Scan-speed decision: fixed stage rail and counters with a selected-work inspector; details expand only when chosen.
- Memorable anchor: evidence crates feeding a real stateful factory whose blueprint support changes when sources are excluded.

---

### Task 1: Scaffold and Product Slice

**Files:**
- Create/modify: generated Sites scaffold and `.openai/hosting.json`
- Create: `app/page.tsx`, `app/globals.css`, `app/layout.tsx`

**Interfaces:**
- Consumes: build-ready PRD and Sites scaffold contracts.
- Produces: compiling single-route shell with recognizable problem brief, factory floor, HUD, and production log.

- [x] Create the pinned Sites scaffold with D1 capability and install dependencies.
- [x] Inspect generated scripts and hosting metadata; preserve generated conventions.
- [x] Implement the smallest representative shell with real ProofFoundry copy and responsive pane structure.
- [x] Start the development server, require a successful local response, and open the first meaningful preview once.

### Task 2: Domain Model and Deterministic Evidence Pack

**Files:**
- Create: `src/domain/types.ts`
- Create: `src/domain/demo-data.ts`
- Create: `src/domain/foundry-service.ts`
- Test: `src/domain/foundry-service.test.ts`

**Interfaces:**
- Consumes: `FoundryWorkspace`, tool input types, and the state sequence from the PRD.
- Produces: `createInitialWorkspace()`, `createFoundryService(getState, setState)`, and typed methods matching all manual/WebMCP operations.

- [x] Write failing tests for state gates, idempotent planning/import/extraction, citation integrity, finding review, candidate generation, source exclusion support recalculation, stress testing, tracing, finalization, and export.
- [x] Run the focused tests and confirm each failure is due to missing behavior.
- [x] Define focused domain types and a curated source pack containing genuine public URLs/excerpts plus labeled synthetic analytics and support evidence.
- [x] Implement immutable domain operations and actionable error results.
- [x] Run the domain tests to green and refactor without changing behavior.

### Task 3: Complete Factory Workspace

**Files:**
- Create: `src/components/factory-shell.tsx`
- Create: `src/components/problem-panel.tsx`
- Create: `src/components/factory-floor.tsx`
- Create: `src/components/factory-hud.tsx`
- Create: `src/components/production-log.tsx`
- Create: `src/components/evidence-inspector.tsx`
- Create: `src/components/candidate-forge.tsx`
- Create: `src/components/blueprint.tsx`
- Create: `src/components/foundry-dialogs.tsx`
- Create: `src/hooks/use-foundry.ts`
- Test: `src/components/factory-shell.test.tsx`

**Interfaces:**
- Consumes: `FoundryService`, `FoundryWorkspace`, selected source/finding/candidate/component IDs.
- Produces: the full manual journey and shared UI state for tool-triggered operations.

- [x] Write failing interaction tests for the empty-to-finalized manual path, finding inspection, evidence exclusion wow moment, trace selection, error recovery, reset, and export.
- [x] Run the UI tests and verify their expected failures.
- [x] Build the stable three-pane shell, seven semantic factory stations, HUD, log, dialogs, inspector, candidate bays, stress chamber, and document-style blueprint.
- [x] Add CSS/SVG state motion, focus behavior, ARIA labels/live regions, reduced-motion behavior, and responsive containment.
- [x] Run component tests to green.

### Task 4: Top-Level WebMCP Tool Suite

**Files:**
- Create: `src/webmcp/model-context.d.ts`
- Create: `src/webmcp/register-tools.ts`
- Create: `src/webmcp/tool-definitions.ts`
- Create: `src/hooks/use-webmcp.ts`
- Test: `src/webmcp/register-tools.test.ts`

**Interfaces:**
- Consumes: the live `FoundryService` instance and browser `document.modelContext`.
- Produces: registrations for `get_foundry_state`, `update_problem_brief`, `plan_research`, `search_sources`, `import_source`, `extract_findings`, `review_findings`, `get_evidence_gaps`, `synthesize_insights`, `generate_idea_candidates`, `inspect_candidate`, `stress_test_candidate`, `revise_candidate`, `trace_evidence`, `finalize_blueprint`, and `export_blueprint`.

- [x] Write failing tests that validate names, schemas, read-only annotations, side-effect descriptions, registration cleanup, error results, idempotence, activity events, and visible-state callbacks.
- [x] Run WebMCP tests and confirm the registrations are absent.
- [x] Implement narrow JSON schemas and handlers that call only shared domain service methods.
- [x] Expose readiness/fallback state in the HUD without breaking manual use.
- [x] Run WebMCP tests to green.

### Task 5: Persistence, Export, and Server Boundaries

**Files:**
- Create: `app/api/workspace/route.ts`
- Create: `app/api/files/route.ts`, `app/api/workspace/route.ts`, `app/api/search/route.ts`
- Create: `src/persistence/workspace-snapshot.ts`, `db/storage.ts`, `db/schema.ts`
- Create: `drizzle/0000_goofy_stature.sql`
- Test: `src/persistence/workspace-snapshot.test.ts`, `src/search/crossref.test.ts`

**Interfaces:**
- Consumes: serialized validated `FoundryWorkspace` snapshots.
- Produces: load/save/reset API, D1-backed snapshots, R2 uploads, live academic metadata search, and downloadable Markdown/JSON blueprint export.

- [x] Write failing tests for serialization, validation, private-source filtering, corrupted snapshot recovery, and export content.
- [x] Run persistence tests and verify expected failures.
- [x] Implement versioned snapshot validation and safe persistence adapters.
- [x] Implement D1-compatible routes and a private-evidence-safe export route/fallback download.
- [x] Generate/inspect the migration and run persistence tests to green.

### Task 6: Documentation, Metadata, and Social Preview

**Files:**
- Create: `README.md`
- Create: `LICENSE`
- Create: `docs/architecture.md`
- Create: `public/og.png`
- Modify: `app/layout.tsx`

**Interfaces:**
- Consumes: final tool inventory, architecture, setup commands, and generated branded image.
- Produces: open-source-ready repository with complete setup, demo, tool, architecture, safety, source attribution, and social metadata.

- [x] Generate one branded landscape social card after the first preview and inspect its text before integration.
- [x] Add exact page metadata and social tags.
- [x] Write setup, architecture, tool inventory, demo path, source provenance, and limitations with no unverified deployment claims.
- [x] Add an MIT license and a public-source attribution table.

### Task 7: Verification and Sites Deployment

**Files:**
- Modify only files needed to fix verified failures.
- Package generated `dist/`, hosting metadata, and migrations.

**Interfaces:**
- Consumes: exact validated source and Sites lifecycle metadata.
- Produces: a saved Sites version, deployed URL, and one final browser handoff in the stable tab.

- [x] Run formatting/diff checks, all tests, typecheck/lint where configured, the production build, and a PRD Definition-of-Done audit.
- [x] Verify the exact source citations, tool inventory, generated artifacts, migration package, and public-access requirement.
- [ ] Commit the exact validated source on the feature branch.
- [ ] Create/reuse the Site, save a version, deploy with the required access, poll to success, and open the deployed URL in the existing Site tab.
