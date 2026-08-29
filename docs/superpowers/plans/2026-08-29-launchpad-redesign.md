# LaunchPad Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the cluttered ProofFoundry shell with a distinctive LaunchPad workspace centered on a stateful 3D factory and an explicit WebMCP run experience.

**Architecture:** Keep the existing `FoundryService`, workspace model, persistence, dialogs, candidate view, blueprint view, and sixteen WebMCP registrations. Add a presentation-only stage model, a direct Three.js canvas component, a concise briefing component, a WebMCP run rail, and an accessible activity drawer; compose them in a rewritten persistent shell. Public naming and metadata change to LaunchPad while internal Foundry identifiers remain stable.

**Tech Stack:** Vinext, React 19, TypeScript, Three.js, Vitest, Testing Library, CSS, OpenAI Sites.

**Spec:** `docs/superpowers/specs/2026-08-29-launchpad-redesign-design.md`

## Global Constraints

- Preserve all sixteen WebMCP tool names, schemas, side effects, and shared `FoundryService` state.
- The WebMCP UI must show real readiness and real agent activity only; never simulate tool calls.
- The activity log is closed by default and remains fully keyboard accessible.
- The 3D factory is interactive, state-driven, smaller than the Cubecade reference object, and has a reduced-motion/WebGL fallback.
- Public product naming is `LaunchPad`; the existing public URL remains stable.
- No page-level horizontal overflow at 390px, 768px, or desktop width.
- Follow red-green-refactor for every production behavior.

---

### Task 1: Factory presentation model

**Files:**
- Create: `src/presentation/factory-stages.ts`
- Create: `src/presentation/factory-stages.test.ts`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: `WorkspaceStage`, `FoundryWorkspace`, and `ActivityEvent` from `src/domain/types.ts`.
- Produces: `FactoryStation`, `FACTORY_STATIONS`, `getStageProgress(stage)`, `getActiveStationKey(stage)`, `getStationState(stage, stationKey)`, `getStationMetric(workspace, stationKey)`, and `getLatestAgentEvent(workspace)`.

- [ ] **Step 1: Add a failing presentation-model test**

```ts
import { describe, expect, it } from 'vitest';
import { createInitialWorkspace } from '../domain/foundry-service';
import { getActiveStationKey, getLatestAgentEvent, getStageProgress, getStationMetric, getStationState } from './factory-stages';

describe('factory presentation model', () => {
  it('maps workspace stages to visible factory progress', () => {
    expect(getActiveStationKey('EMPTY')).toBe('source');
    expect(getActiveStationKey('CANDIDATES_READY')).toBe('idea');
    expect(getActiveStationKey('FINALIZED')).toBe('blueprint');
    expect(getStageProgress('EMPTY')).toBe(0);
    expect(getStageProgress('FINALIZED')).toBe(100);
    expect(getStationState('CANDIDATES_READY', 'review')).toBe('complete');
    expect(getStationState('CANDIDATES_READY', 'stress')).toBe('idle');
  });

  it('derives station metrics and the latest real agent event', () => {
    const workspace = createInitialWorkspace();
    expect(getStationMetric(workspace, 'source')).toEqual({ value: 0, label: 'sources' });
    expect(getLatestAgentEvent(workspace)).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run the test and verify the missing module fails**

Run: `npm test -- src/presentation/factory-stages.test.ts`

Expected: FAIL because `factory-stages.ts` does not exist.

- [ ] **Step 3: Implement the typed stage model**

Create seven station definitions for `source`, `evidence`, `review`, `signal`, `idea`, `stress`, and `blueprint`. Map every workspace stage, including `BLUEPRINT_READY`, to one active station and a 0-100 progress value. Derive metrics from the existing source, finding, insight, candidate, counter-evidence, and blueprint collections. Return the last `activity` event whose actor is `agent` without synthesizing data.

- [ ] **Step 4: Run the focused test and full domain/WebMCP tests**

Run: `npm test -- src/presentation/factory-stages.test.ts src/domain/foundry-service.test.ts src/webmcp/register-tools.test.ts`

Expected: PASS with no warnings.

- [ ] **Step 5: Add Three.js**

Run: `npm install three@0.179.1 && npm install -D @types/three@0.179.0`

Expected: `package.json` and `package-lock.json` contain the exact pinned versions and the security audit reports no production vulnerability.

- [ ] **Step 6: Commit**

```bash
git add src/presentation/factory-stages.ts src/presentation/factory-stages.test.ts package.json package-lock.json
git commit -m "feat: add LaunchPad factory stage model"
```

### Task 2: Interactive miniature factory

**Files:**
- Create: `src/components/interactive-factory.tsx`
- Create: `src/components/interactive-factory.test.tsx`
- Modify: `test/setup.ts`

**Interfaces:**
- Consumes: `FoundryWorkspace`, `FactoryStation`, and factory-stage helpers.
- Produces: `InteractiveFactory({ workspace })`, a WebGL canvas with station selection and an accessible station-control list.

- [ ] **Step 1: Write the failing accessibility/state test**

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createInitialWorkspace } from '../domain/foundry-service';
import { InteractiveFactory } from './interactive-factory';

it('offers keyboard-equivalent station inspection', async () => {
  const user = userEvent.setup();
  render(<InteractiveFactory workspace={createInitialWorkspace()} />);
  expect(screen.getByLabelText(/interactive research factory/i)).toBeVisible();
  await user.click(screen.getByRole('button', { name: /evidence lab/i }));
  expect(screen.getByRole('status')).toHaveTextContent(/Evidence Lab/);
  expect(screen.getByRole('status')).toHaveTextContent(/findings/);
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `npm test -- src/components/interactive-factory.test.tsx`

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Build the semantic shell and fallback first**

Render a labeled canvas container, a station-selection button row, and a live selected-station status. If WebGL initialization throws, set `webglFailed` and render an accessible schematic with the same station state and buttons.

- [ ] **Step 4: Run the focused test and verify semantic behavior passes**

Run: `npm test -- src/components/interactive-factory.test.tsx`

Expected: PASS in JSDOM using the fallback while retaining station selection.

- [ ] **Step 5: Add the Three.js scene**

Inside one effect, create and dispose the renderer, camera, lights, ground plane, factory groups, raycaster, pointer handlers, resize observer, and animation frame. Model the factory procedurally from boxes, cylinders, pipes, roofs, a conveyor, packets, and a beacon. Store each station key in `group.userData.stationKey`. Use `OrbitControls` with damping, bounded polar angle, disabled pan, and disabled wheel zoom. Cap pixel ratio at `Math.min(devicePixelRatio, 1.75)`.

- [ ] **Step 6: Add state and motion behavior**

Update material emission from `getStationState`. Raycast pointer clicks to select a station. Animate the beacon, conveyor packets, and slow orbit only when `prefers-reduced-motion` is false. Do not require animation to understand state.

- [ ] **Step 7: Run focused tests and production type/build checks**

Run: `npm test -- src/components/interactive-factory.test.tsx src/presentation/factory-stages.test.ts && npm run build`

Expected: PASS; build exits 0.

- [ ] **Step 8: Commit**

```bash
git add src/components/interactive-factory.tsx src/components/interactive-factory.test.tsx test/setup.ts
git commit -m "feat: add interactive LaunchPad factory"
```

### Task 3: WebMCP run rail and toggleable activity drawer

**Files:**
- Create: `src/components/webmcp-run-rail.tsx`
- Create: `src/components/activity-drawer.tsx`
- Create: `src/components/webmcp-run-rail.test.tsx`
- Create: `src/components/activity-drawer.test.tsx`
- Modify: `src/hooks/use-webmcp.ts`

**Interfaces:**
- Consumes: `FoundryWorkspace`, WebMCP readiness, notice text, optional export filename and download callback.
- Produces: `WebMCPRunRail({ workspace, ready })` and `ActivityDrawer({ workspace, open, onClose, notice, ... })`.
- Updates: `useWebMCP` returns `{ ready, toolCount: 16 }` instead of a bare boolean.

- [ ] **Step 1: Write failing run-rail tests**

```tsx
it('explains WebMCP as a shared-page tool workflow', () => {
  render(<WebMCPRunRail workspace={createInitialWorkspace()} ready={false} />);
  expect(screen.getByRole('heading', { name: /WebMCP runs LaunchPad from the page/i })).toBeVisible();
  expect(screen.getByText(/reads the shared workspace/i)).toBeVisible();
  expect(screen.getByText(/calls one of 16 typed tools/i)).toBeVisible();
  expect(screen.getByText(/same page updates/i)).toBeVisible();
  expect(screen.getByRole('button', { name: /copy demo prompt/i })).toBeEnabled();
});
```

- [ ] **Step 2: Write failing drawer behavior tests**

```tsx
it('keeps the activity log hidden until requested and closes with Escape', async () => {
  const user = userEvent.setup();
  const onClose = vi.fn();
  const { rerender } = render(<ActivityDrawer workspace={createInitialWorkspace()} open={false} onClose={onClose} notice="Ready" />);
  expect(screen.queryByRole('dialog', { name: /activity/i })).not.toBeInTheDocument();
  rerender(<ActivityDrawer workspace={createInitialWorkspace()} open onClose={onClose} notice="Ready" />);
  expect(screen.getByRole('dialog', { name: /activity/i })).toBeVisible();
  await user.keyboard('{Escape}');
  expect(onClose).toHaveBeenCalledOnce();
});
```

- [ ] **Step 3: Run both tests and verify missing components fail**

Run: `npm test -- src/components/webmcp-run-rail.test.tsx src/components/activity-drawer.test.tsx`

Expected: FAIL because both components do not exist.

- [ ] **Step 4: Implement the WebMCP run rail**

Show the three numbered steps, connection state, exact tool count, latest real agent event from `getLatestAgentEvent`, and a copyable demo prompt. Use the Clipboard API when available and fall back to a temporary textarea/selection path. Copy feedback must be an `aria-live` message.

- [ ] **Step 5: Implement the activity drawer**

Render nothing while closed. While open, render a modal dialog with backdrop, close button, complete reverse-chronological activity timeline, actor/status labels, current notice, and optional download action. Add Escape handling and body-scroll locking with cleanup.

- [ ] **Step 6: Update WebMCP hook result without changing registration**

Keep the current registration lifecycle. Export the exact tool count from `register-tools.ts` or derive it from the registered definition array, then return `{ ready, toolCount }` from `useWebMCP`.

- [ ] **Step 7: Run focused and existing WebMCP/log tests**

Run: `npm test -- src/components/webmcp-run-rail.test.tsx src/components/activity-drawer.test.tsx src/components/production-log.test.tsx src/webmcp/register-tools.test.ts`

Expected: PASS and still exactly sixteen registered tools.

- [ ] **Step 8: Commit**

```bash
git add src/components/webmcp-run-rail.tsx src/components/activity-drawer.tsx src/components/webmcp-run-rail.test.tsx src/components/activity-drawer.test.tsx src/hooks/use-webmcp.ts src/webmcp/register-tools.ts
git commit -m "feat: make WebMCP workflow visible"
```

### Task 4: Simplified LaunchPad shell

**Files:**
- Create: `src/components/launch-brief.tsx`
- Modify: `src/components/factory-shell.tsx`
- Modify: `src/components/factory-shell.test.tsx`
- Modify: `app/page.test.tsx`
- Modify: `src/components/candidate-forge.tsx`
- Modify: `src/components/blueprint.tsx`
- Delete: `src/components/factory-hud.tsx`
- Delete: `src/components/factory-floor.tsx`

**Interfaces:**
- Consumes: existing `useFoundry`, dialogs, candidate/blueprint surfaces, new factory, rail, and drawer.
- Produces: a persistent LaunchPad shell with a sparse first viewport and a detailed workbench.

- [ ] **Step 1: Rewrite shell assertions before production code**

Update tests to require the `LaunchPad` banner, the heading `Turn scattered evidence into an idea you can defend.`, the interactive factory region, the WebMCP explanation, an `Activity` toggle, and no visible activity dialog on initial render. Preserve all existing manual-flow, evidence-review, candidate-change, final blueprint, and trace assertions.

- [ ] **Step 2: Run shell tests and verify the old shell fails the new contract**

Run: `npm test -- src/components/factory-shell.test.tsx app/page.test.tsx`

Expected: FAIL on LaunchPad naming, new heading, factory label, WebMCP explanation, and activity toggle.

- [ ] **Step 3: Implement `LaunchBrief`**

Move concise problem/state copy and manual actions into a new briefing component. Keep the existing callbacks and primary-action behavior. Show audience/outcome/constraint counts only when a problem exists. Hide rare actions behind a compact secondary row without removing them.

- [ ] **Step 4: Recompose `FactoryShell`**

Render the LaunchPad header, stage progress, briefing column, `InteractiveFactory`, `WebMCPRunRail`, and an Activity button in the first viewport. Render the candidate view, blueprint view, or a compact current-stage summary in a workbench below. Keep dialogs mounted. Mount `ActivityDrawer` only from toggle state. Restore focus to the Activity button after the drawer closes.

- [ ] **Step 5: Refine candidate and blueprint semantics**

Remove obsolete factory terminology from public copy, retain all evidence values and interaction labels, and add short human-readable introductions. Do not remove proof links, stress-test results, counter-evidence, assumptions, validation plan, or export actions.

- [ ] **Step 6: Remove obsolete permanent HUD/floor components**

Delete components only after no imports remain. Preserve `ProductionLog` temporarily for its formatter test until the drawer owns the display; delete or reduce it in Task 5 only if no runtime import remains.

- [ ] **Step 7: Run complete component workflow tests**

Run: `npm test -- src/components app/page.test.tsx`

Expected: every existing workflow and the new first-viewport contract passes.

- [ ] **Step 8: Commit**

```bash
git add src/components app/page.test.tsx
git commit -m "feat: simplify the LaunchPad workspace"
```

### Task 5: Willow-inspired visual system and responsive containment

**Files:**
- Modify: `app/globals.css`
- Modify: `src/components/factory-shell.test.tsx`
- Modify: `src/components/production-log.tsx`
- Modify: `src/components/production-log.test.tsx`

**Interfaces:**
- Consumes: the class names emitted by Tasks 2-4.
- Produces: a glow-and-grain LaunchPad visual system with contained responsive layouts and accessible motion.

- [ ] **Step 1: Add behavior-level style guard tests**

Assert that the shell exposes `data-stage`, the activity trigger exposes `aria-expanded`/`aria-controls`, the drawer has `aria-modal`, and factory buttons expose selected state. Avoid snapshot or class-name-only tests.

- [ ] **Step 2: Run tests and verify missing accessibility state fails**

Run: `npm test -- src/components/factory-shell.test.tsx src/components/activity-drawer.test.tsx src/components/interactive-factory.test.tsx`

Expected: FAIL on the newly required state attributes.

- [ ] **Step 3: Replace the old industrial stylesheet**

Create tokens for near-black, lavender glow, paper foreground, violet accent, mint success, amber warning, and coral error. Use large restrained sans headlines, readable body sizes, mono only for metadata, soft translucent borders, and a single atmospheric background. Style the first viewport as the dominant composition and the workbench as a quiet artifact surface.

- [ ] **Step 4: Add responsive and reduced-motion rules**

At desktop, keep the factory central and smaller than half the viewport. At tablet, use a two-column briefing/factory layout with the WebMCP rail below. At 390px, stack all regions and use a full-height activity sheet. Contain candidate and evidence rows locally. Under `prefers-reduced-motion: reduce`, disable ambient keyframes and minimize transitions.

- [ ] **Step 5: Satisfy the accessibility state tests**

Add exact expanded, selected, controlled-region, and modal attributes to the production components.

- [ ] **Step 6: Run component tests, lint, and build**

Run: `npm test -- src/components app/page.test.tsx && npm run lint && npm run build`

Expected: all commands exit 0 with no lint/type/build errors.

- [ ] **Step 7: Commit**

```bash
git add app/globals.css src/components
git commit -m "style: give LaunchPad a focused visual system"
```

### Task 6: Public LaunchPad identity and documentation

**Files:**
- Modify: `app/site-metadata.ts`
- Modify: `app/site-head.tsx`
- Modify: `app/layout.test.tsx`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `README.md`
- Modify: `docs/prd.md`
- Modify: `docs/architecture.md`
- Modify: `docs/demo-script.md`
- Replace: `public/og.png`
- Modify: `public/favicon.svg`

**Interfaces:**
- Produces: consistent public LaunchPad naming while preserving the canonical URL and internal persistence compatibility.

- [ ] **Step 1: Change metadata tests first**

Require `applicationName`, title, Open Graph title, and image alt text to contain LaunchPad while the canonical base remains `https://proof-foundry.hello18528.chatgpt.site/`.

- [ ] **Step 2: Run metadata tests and verify old identity fails**

Run: `npm test -- app/layout.test.tsx`

Expected: FAIL because metadata still says ProofFoundry.

- [ ] **Step 3: Rename public metadata and package identity**

Set the package name to `launchpad`, update descriptions, metadata, favicon title/accessibility text, and social image alt text. Do not rename the stable cookie, storage keys, internal service types, or URL.

- [ ] **Step 4: Update current documentation**

Replace public product prose with LaunchPad and rewrite the WebMCP explanation to match the visible `intent -> tool -> result` experience. Mark the existing old-branded video as legacy or remove it from the primary README callout until a current recording exists.

- [ ] **Step 5: Generate and wire a new social preview**

Use one image-generation task after the first meaningful local preview. The card must say `LaunchPad`, use the lavender-to-black atmosphere, show a small stylized research factory, and include `Evidence in. Defensible ideas out.` Inspect the output for exact text before replacing `public/og.png`.

- [ ] **Step 6: Run identity scan and verification**

Run: `rg -n "ProofFoundry|PROOF//FOUNDRY|Proof Foundry" app src README.md docs package.json public --glob '!docs/superpowers/plans/2026-08-29-prooffoundry-p0.md' --glob '!artifacts/demo/**'`

Expected: no public-facing current-product matches; internal compatibility names are explicitly reviewed if any remain.

Run: `npm test -- app/layout.test.tsx app/page.test.tsx && npm run build`

Expected: PASS; build exits 0.

- [ ] **Step 7: Commit**

```bash
git add app src README.md docs package.json package-lock.json public
git commit -m "refactor: rename the product to LaunchPad"
```

### Task 7: End-to-end verification and production publication

**Files:**
- Modify only if verification finds a reproducible issue.
- Inspect: `.openai/hosting.json`

**Interfaces:**
- Produces: a verified, deployed public LaunchPad version on the existing Site.

- [ ] **Step 1: Run the complete automated gate**

Run: `npm test && npm run lint && npm run build && npm audit --omit=dev && git diff --check`

Expected: all tests pass, lint and build exit 0, production audit reports zero vulnerabilities, and diff check is clean.

- [ ] **Step 2: Run local browser QA**

Use the existing Site tab. Check desktop, 768px, and 390px widths; empty and finalized states; activity open/close/backdrop/Escape; copy prompt; factory orbit/click/keyboard station selection; dialogs; candidate flow; evidence trace; exports; no console errors; and no horizontal page overflow.

- [ ] **Step 3: Run reduced-motion and WebGL fallback QA**

Emulate reduced motion and verify information remains visible without ambient animation. Disable or stub WebGL once and confirm the schematic fallback and station controls remain usable.

- [ ] **Step 4: Verify WebMCP in connected Chrome**

Confirm `WEBMCP CONNECTED`, exactly sixteen registered tools, real agent tool calls appearing in the rail/drawer, shared page mutations, and the manual/agent actor distinction. Do not count manual actions as WebMCP proof.

- [ ] **Step 5: Push the exact validated commit and package the Site**

Commit any final verified fixes, push the branch-head SHA to the existing Sites source repository, and package the existing D1/R2-enabled build with the Sites packaging helper.

- [ ] **Step 6: Save and deploy one Site version**

Reuse the project ID in `.openai/hosting.json`, save one version from the exact pushed SHA/archive, deploy using the existing access policy, poll until terminal success, and update the Site display title to `LaunchPad`.

- [ ] **Step 7: Verify the public deployment**

Open the exact deployed URL in the existing Site tab. Confirm the LaunchPad title, 3D factory, WebMCP explanation, closed-by-default log, manual workflow, persistence, and no console errors. Separately verify connected Chrome still registers all tools on production.

- [ ] **Step 8: Final commit and status**

```bash
git status --short
git log -7 --oneline
```

Expected: clean worktree; the deployed commit is the branch head.
