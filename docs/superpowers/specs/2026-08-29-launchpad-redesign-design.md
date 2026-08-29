# LaunchPad Interface and WebMCP Demonstration Design

## Objective

Redesign the existing research-to-idea workspace so the first viewport is calm, memorable, and immediately explains why WebMCP matters. Preserve the working evidence pipeline, persistence, manual controls, and sixteen WebMCP tools. Rename every public-facing instance of the product to **LaunchPad**.

## Approved direction

LaunchPad combines two structural lessons from the supplied references without copying their brands:

- From Willow: spacious composition, restrained sans-serif typography, a soft lavender-to-near-black atmosphere, generous negative space, and plain-spoken copy.
- From Cubecade: a single interactive object as the dominant visual anchor, a compact live-status surface, and visible agent readiness.

LaunchPad's distinctive object is a procedural WebGL miniature research factory. It is intentionally smaller than Cubecade's cube and occupies roughly the middle third of the first viewport. It represents the real workspace state rather than serving as decoration.

## Reference extraction

| Reference | Keep | Adapt for LaunchPad | Reject |
|---|---|---|---|
| Willow | atmospheric gradient, restrained type, generous spacing | use the gradient as a product-workspace atmosphere and keep controls concise | marketing navigation, testimonial strip, white-page section rhythm |
| Cubecade | object-first composition, direct manipulation, live agent status | replace the cube with a stateful miniature factory and replace game telemetry with evidence and tool progress | arcade typography, giant object scale, game-specific neon treatment |

## UX decision brief

- Pattern: agent run plus product workbench.
- Primary job: turn a defined problem into a traceable, evidence-backed idea.
- First-run success: the user can state what WebMCP does here before invoking a tool, then start the seeded workflow with one action.
- Primary action: advance the current research stage.
- Secondary actions: define/edit the problem, add a source, inspect evidence, inspect a factory station, open the activity drawer, copy the WebMCP demo prompt, export a finalized blueprint, and reset.
- Persistent context: project title, current stage, progress, WebMCP connection, current/last tool, and the next action.
- Progressive disclosure: the first viewport shows only the brief summary, factory, WebMCP explanation, and next action. Detailed candidate/blueprint content follows in the workbench. The complete audit trail lives in a toggleable drawer.
- Required states: empty, connected/manual fallback, active tool, partial research, recoverable error, finalized, and reduced-motion/WebGL fallback.

## UI decision brief

- Surface type: hybrid agent/tool run and operational workbench.
- Platform idiom: web.
- Product thesis: one shared page where a human and an agent operate the same evidence-to-decision graph.
- Visual direction: branded product-led Glow + Grain, restrained with Willow-like negative space.
- Density: sparse in the first viewport, balanced in the detailed workbench.
- Hierarchy: interactive factory first, stage action second, agent run rail third, detailed evidence content below.
- Component grammar: minimal header, stage progress, brief summary, WebGL canvas, WebMCP run rail, workbench, modal inspectors, and activity drawer.
- Typography: Geist Sans for headlines/body; Geist Mono only for tool names, stage labels, counts, and timestamps. Body copy is never set in tiny mono type.
- Color/materials: warm near-black base, lavender atmosphere, paper foreground, violet primary accent, mint connected/success state, amber warning, coral error, translucent panels.
- Motion budget: functional. Orbit and station selection communicate control; station pulses and material movement communicate progress. Drawer transitions communicate continuity. Reduced motion disables automatic rotation, ambient loops, and large transforms.
- Implementation track: existing Vinext/React stack with direct Three.js integration. Add only `three` and its types; avoid a second React renderer.
- Responsive containment: desktop uses three calm zones around the centered factory; tablet stacks the WebMCP rail below the briefing/factory; mobile stacks all regions, uses a fixed-height canvas, and presents the activity log as a full-height sheet. No page-level horizontal scrolling.
- Key art: the real interactive factory itself. No generated hero illustration.
- Tasteful risk: a miniature factory whose stations illuminate from workspace state and agent tool calls.
- Bans: no permanent bottom log, no factory-themed tiny copy everywhere, no generic AI assistant card, no decorative metric grid, no fake tool-call simulation, no page-level horizontal overflow.

## First viewport

### Header

- LaunchPad wordmark and tagline.
- Compact project/stage readout.
- WebMCP connection pill.
- `Activity` button with event count; toggles the activity drawer.

### Briefing column

- Eyebrow: current launch stage.
- Headline: `Turn scattered evidence into an idea you can defend.`
- One-sentence product explanation.
- Concise current-problem summary or an empty-state invitation.
- One visually dominant stage action.
- A compact secondary-action row.

### Interactive factory

- WebGL miniature factory on a subtle ground plane.
- Seven distinct clickable stations: Source Dock, Evidence Lab, Review Bay, Signal Tower, Idea Forge, Stress Chamber, Blueprint Bay.
- Active station uses violet emission; completed stations use mint; future stations remain muted.
- Conveyor packets and a small beacon animate only when motion is allowed.
- Pointer drag orbits the scene; wheel zoom is disabled to protect page scrolling.
- Keyboard-accessible station buttons mirror pointer selection.
- Selecting a station reveals its role, state, and current workspace count.
- WebGL failure shows an accessible schematic rather than a blank canvas.

### WebMCP run rail

- Heading: `WebMCP runs LaunchPad from the page.`
- Three-step explanation: agent reads shared state, invokes a narrow typed tool, and the same page updates for the human.
- Explicit comparison: no pasted chatbot and no parallel demo state.
- Connection status and `16 typed tools` proof.
- Current or latest agent action displayed as `intent -> tool -> visible result`.
- A copyable curated demo prompt when WebMCP is not connected; the same prompt remains available when connected.
- Recent agent events only; complete human/agent/system history moves to the activity drawer.

## Workbench

Below the first viewport, retain the current functional stage output:

- Before candidates: a compact evidence-flow summary replaces the old full factory floor.
- Candidate stage: keep comparison cards but improve spacing and typography.
- Finalized stage: keep the proof-carrying blueprint and trace interactions with the new visual tokens.

The factory remains the persistent stage map. The workbench holds detailed artifacts, so one surface never tries to perform both jobs.

## Activity drawer

- Closed by default.
- Opened from the header and dismissed by close button, backdrop click, or Escape.
- Contains the full audit trail in reverse chronological order.
- Clearly labels human, agent, and system actors.
- Each row shows timestamp, tool name, outcome, version, and status.
- Includes the current notice and any ready export download.
- Locks background scrolling while open and restores focus to the Activity button on close.

## WebMCP integrity

- Keep all sixteen existing tool registrations and their schemas.
- Do not make the UI invoke WebMCP tools itself or display fake calls.
- Manual controls and WebMCP tools continue to call the same `FoundryService` and mutate the same `FoundryWorkspace`.
- WebMCP readiness comes only from `document.modelContext` registration.
- Agent evidence comes only from activity records whose actor is `agent`.
- The 3D factory and run rail derive from workspace state, so every shown change is independently inspectable.

## Naming scope

- Public interface, metadata, social metadata, package identity, README, and product prose use `LaunchPad`.
- Existing internal type/component names may retain `Foundry` where renaming would create risk without user value.
- The existing public URL remains stable for this redesign; its displayed Site title becomes `LaunchPad`.
- The old demo video is not represented as a current LaunchPad recording. A future recording should be refreshed after the redesign is live.

## Accessibility and performance

- Every control has a text label and visible focus state.
- Canvas has a descriptive accessible label; keyboard station controls provide equivalent inspection.
- Contrast remains sufficient over the atmospheric background.
- `prefers-reduced-motion` disables ambient factory motion and turns drawer movement into a short fade.
- Three.js geometries, materials, controls, resize observers, and animation frames are disposed on unmount.
- The factory renders only while visible and caps device pixel ratio at 1.75.

## Quality bar

- Specific job: make a problem-to-idea evidence chain operable and inspectable.
- Proof surface: live factory state, WebMCP tool rail, shared audit trail, candidate evidence coverage, and blueprint lineage.
- Required states: empty, manual fallback, connected, active, partial, error, finalized, and reduced-motion/WebGL fallback.
- Scan-speed decision: one next action and one dominant object; secondary detail is below or in drawers.
- Memorable anchor: the interactive miniature evidence factory.

## Acceptance criteria

- `LaunchPad` is the only public product name in the running app and current documentation.
- The first viewport no longer contains a permanent left panel, right telemetry HUD, and bottom log.
- The activity log is closed by default and fully usable as an accessible drawer.
- The 3D factory is visible, orbitable, clickable, keyboard-inspectable, responsive, and state-driven.
- The first viewport explains WebMCP through a visible three-step mechanism and real tool activity.
- The manual workflow, candidate recommendation changes, evidence review, proof trace, persistence, search, uploads, and all sixteen WebMCP tools continue to work.
- Automated tests, lint, type checking through the production build, and the production build pass.
- Browser QA covers desktop, tablet, mobile, reduced motion, the public manual fallback, and WebMCP-enabled Chrome.
- The validated source is deployed to the existing public Site.
