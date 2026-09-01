# LaunchPad — Devpost submission draft

## Project details

- **Name:** LaunchPad
- **Tagline:** An evidence factory where browser agents research, challenge, and trace one defensible solution while humans retain control of sensitive decisions.
- **Live app:** https://launchpad.hello18528.chatgpt.site
- **Public repository:** https://github.com/kaseyho/Launchpad/tree/codex/prooffoundry-p0
- **Demo video:** https://youtu.be/U3tsnlD0J_s — public, 2:07, narrated; YouTube checks passed with no copyright issues
- **Devpost project:** https://devpost.com/software/launchpad-dzomub
- **Built with:** WebMCP, TypeScript, React, Next.js, Vinext, Cloudflare Workers, Cloudflare D1, Cloudflare R2, ChatGPT Sites, Three.js, OpenAI-compatible Responses API

## Short summary

LaunchPad turns one messy problem into one evidence-backed solution. A WebMCP-capable browser agent works inside the same live workspace as the human: it reads the current state, researches evidence, closes explicit gaps, tests counterfactual evidence policies, preserves counter-signals, and traces every recommendation component back to its source. Human consent remains mandatory for evidence acceptance, finalization, and private-data export.

## What it does

Most research agents end with a persuasive answer. LaunchPad ends with an auditable decision.

A person enters a real product or business problem. LaunchPad plans the research, collects and validates sources, extracts atomic findings, preserves counter-evidence, synthesizes mechanisms, generates candidate solutions, stress-tests them, and returns one recommendation with a concrete validation plan. The result includes the full lineage from each proposed feature to the insight, finding, and source that supports it.

The interface is a live production line rather than a chat transcript. The human can see the current stage, the evidence ledger, the selected candidate, the gaps that remain, and every workspace version transition. The agent operates that exact workspace through WebMCP instead of copying context into a separate assistant conversation.

## Why this is a strong fit for WebMCP

This workflow depends on state that only the current page truly knows: the active problem brief, research stage, current evidence, privacy scope, policy, selected candidate, stale-version boundary, and consent status. A conventional chatbot must ask the user to paste that context, risks acting on an old snapshot, and cannot prove that its answer matches what the page displays.

WebMCP makes the browser page an agent-operable evidence environment:

- The agent discovers only the tools valid for the current workflow stage.
- Pure read tools expose live state, gaps, candidate structure, proof traces, and previews without mutating anything.
- Mutation tools return compact receipts with before/after workspace versions, modified IDs, recovery guidance, and useful next operations.
- Browser-found evidence enters atomically with provenance, retrieval time, evidence lane, caveat, and public/private scope.
- Policy comparison answers questions such as “What changes if we exclude community sources or require two independent sources?” without modifying the ledger.
- Apply and rollback make policy effects visible and reversible.
- Evidence review, finalization, and private export pause at visible human-consent dialogs bound to exact finding IDs and the current workspace version.
- A stale agent call fails safely instead of silently overwriting newer human work.

The result is not “an AI button.” It is a long-running human-agent collaboration with live shared state, explicit authority boundaries, recoverable operations, and proof that survives the final answer.

## What people and agents can do together now

Before LaunchPad, a researcher could ask an agent to browse, then manually move citations into a document, reconcile contradictions, rerun the analysis under a stricter policy, and hope the final recommendation still matched the evidence. That process loses provenance and makes it hard to tell which decision changed and why.

With LaunchPad, the human sets the mission and retains responsibility while the agent performs the high-volume work:

1. Read the exact live state and identify the next evidence gap.
2. Search different evidence lanes and ingest a provenance-rich batch.
3. Preserve negative or contradictory evidence instead of optimizing it away.
4. Compare a stricter policy as a pure preview.
5. Apply or roll back that policy and see the candidate ranking change on the same page.
6. Ask for human approval before committing sensitive judgments.
7. Trace any final feature through component → insight → finding → source.
8. Export a public-safe blueprint that automatically excludes private evidence.

Humans supply intent, judgment, and consent. Agents supply breadth, repetition, gap closure, and exact stateful operations. The product makes that division of responsibility visible.

## How WebMCP is implemented

LaunchPad registers a stage-aware catalog through `document.modelContext.registerTool`. The catalog grows and contracts as the workspace moves through planning, research, evidence review, synthesis, ideation, stress testing, and finalization. The full implementation exposes 22 tools, including:

- `get_foundry_state`, `get_evidence_gaps`, `inspect_candidate`, and `trace_evidence` for pure inspection;
- `plan_research`, `search_sources`, `ingest_evidence_batch`, `extract_findings`, `synthesize_insights`, and `generate_idea_candidates` for the evidence workflow;
- `compare_evidence_policy`, `apply_evidence_policy`, and rollback behavior for reversible counterfactual analysis;
- `review_evidence_with_consent`, `finalize_blueprint_with_consent`, and `export_blueprint_with_consent` for human-authorized commits;
- `preview_finalization` and `preview_export` so an agent can inspect the consequence before requesting consent.

Schemas reject undeclared fields. Pure reads carry read-only hints. Evidence-returning tools mark untrusted content. Registration is asynchronous and abortable, and the UI reports readiness only after every stage-valid tool has registered. Receipts are capped so the agent gets the information needed for its next move without flooding context.

The same TypeScript domain service owns page interactions and WebMCP calls, so the browser agent cannot drift into a hidden parallel workflow. State changes use optimistic workspace versions. Connected evidence retains its origin and privacy scope. Public export is generated from the same graph but omits private evidence by construction.

## Demonstrated WebMCP journey

The final public build was exercised inside ChatGPT’s in-app browser against the exact judging URL. The browser discovered the 22-tool stage-aware catalog and completed 26 calls from workspace version 1 to version 19:

- six evidence lanes searched;
- nine findings extracted, including a retained caution;
- human evidence review completed;
- five insights and three candidates generated;
- a stricter evidence policy compared, applied, and rolled back;
- the selected candidate inspected and stress-tested;
- a four-hop proof path traced;
- finalization previewed and approved;
- a public-safe Markdown blueprint exported.

The winning candidate in this reproducible mission was **Admin Guild**, supported by eight findings and one caution, with 100% component coverage. The final reload preserved the finalized workspace, showed the completed run state, and produced zero browser console errors. The exact receipts are recorded in `artifacts/demo/webmcp-journey.json`.

## What was added during the submission period

LaunchPad is an existing project that was materially rebuilt for the WebMCP Challenge after August 25, 2026.

The hackathon work transformed an early agent surface into a WebMCP-native evidence system:

- expanded the catalog from 17 general tools to 22 stage-aware tools;
- removed mutation from legacy read behavior and added explicit pure previews;
- added batch provenance and privacy-aware ingestion;
- added evidence-gap actions and counter-evidence requirements;
- added pure policy comparison, non-destructive apply, and rollback;
- added version-bound consent for review, finalization, and private export;
- added compact versioned receipts, stale-version recovery, and agent-visible next operations;
- added an in-page judge mission and WebMCP activity rail;
- added provider-backed tool-selection evals covering ambiguity, denied consent, stale state, and mid-chain recovery;
- ran and recorded a 26-call production journey on the final public deployment;
- added regression coverage for the shared human/WebMCP workflow and finalized UI state.

## Challenges

The hardest problem was not registering many tools; it was designing a trustworthy protocol for a long-running agent workflow. Reads had to be truly pure. Mutations needed version boundaries. Evidence from a browser had to remain untrusted until reviewed. Private evidence could not leak into public export. And the interface had to make all of this understandable to a judge without exposing implementation noise.

A second challenge was eval honesty. The configured provider-backed selection harness completed a rich live run in which four cases passed before the provider account began returning HTTP 429. The committed report records the rate limit rather than fabricating a green result. Independent deterministic tests and the complete production browser journey remain green.

## Accomplishments

- A complete, coherent product experience rather than a tool-registration demo.
- 22 stage-aware WebMCP tools sharing one state machine with the visible UI.
- Human consent and stale-version safety for consequential actions.
- Reversible counterfactual evidence policies that can change the recommendation.
- End-to-end proof lineage and privacy-safe export.
- 108 automated tests across 24 files, plus lint, strict TypeScript, and production build checks.
- A verified 26-call WebMCP journey on the public judging host with zero console errors.

## What I learned

WebMCP is most powerful when tools expose the page’s changing decision state, not when they merely mirror existing buttons. The useful design unit is a protocol: stage discovery, compact receipts, pure preview, explicit commit, version conflict, and safe recovery. I also learned that human control becomes easier—not slower—when consent is attached to exact IDs and consequences instead of a generic confirmation modal.

## What is next

- Run the provider-backed eval suite again when the external account rate limit clears and publish the complete scorecard.
- Add authenticated team workspaces and cross-device collaboration.
- Add more first-party connectors while keeping source privacy explicit.
- Let organizations define reusable evidence policies and approval roles.
- Evaluate whether proof-carrying recommendations reduce research rework and improve decision confidence in real product teams.

## Testing instructions for judges

No account or credentials are required.

1. Open https://launchpad.hello18528.chatgpt.site in ChatGPT’s in-app browser or Chrome with WebMCP enabled.
2. Enter a problem or use the onboarding example.
3. Wait for the rail to say **Connected to this workspace**.
4. Expand **Show judge mission** and give that prompt to the browser agent.
5. Watch the rail and Activity log for the tool name, exact workspace version transition, modified IDs, and next operations.
6. At the evidence-review and finalization checkpoints, approve the visible dialog to continue. Declining is safe and commits nothing.
7. Ask the agent to compare a stricter policy, then apply and roll it back.
8. Ask it to trace one final component and export the public-safe Markdown blueprint.

For the shortest judging path, use this mission:

> Read the live workspace, plan the research, gather support and counter-evidence across the available lanes, extract findings, and tell me when human review is required. After approval, synthesize insights, generate candidates, compare a stricter public-evidence policy, apply and roll it back, stress-test the leader, trace one component to its source, preview finalization, request consent, and export a public-safe Markdown blueprint. Recover from stale state by reading the workspace again rather than guessing.

## Required Devpost form answers

- **Submitter Type (28249):** Individual
- **Country (28250):** Singapore
- **Organization (28251):** Not applicable
- **App Status (28252):** Existing
- **Existing-project update (28253):** Use the “What was added during the submission period” section above.
- **Live URL (28254):** https://launchpad.hello18528.chatgpt.site
- **Testing instructions (28255):** Use the “Testing instructions for judges” section above. No credentials required.
- **Public repo (28256):** https://github.com/kaseyho/Launchpad/tree/codex/prooffoundry-p0
- **Agents/clients tested (28257):** ChatGPT desktop in-app browser with WebMCP enabled; the live provider-backed selection harness using the configured OpenAI-compatible Responses API.
- **AI tools used (28258):** Codex for repository analysis, architecture, implementation, tests, deployment verification, and submission preparation; ChatGPT in-app browser as the WebMCP client; an OpenAI-compatible Responses API with web search for the autonomous research path and selection evals.
- **Learning level (28259):** Significant
- **Career AI value (28260):** Yes

## Submission readiness

- [x] Registered for The WebMCP Challenge
- [x] Live public judging URL
- [x] Public repository reachable
- [x] MIT license included
- [x] Complete source and setup instructions
- [x] Required form answers drafted
- [x] Final production WebMCP journey recorded
- [x] Automated tests, lint, type-check, and build passed
- [x] Core WebMCP implementation pushed to the public branch
- [x] Devpost project created and synchronized with the draft
- [x] Final narrated 2:06 demo rendered and visually checked
- [x] Final judge-layout polish and demo evidence pushed to the public branch
- [x] YouTube demo published publicly; checks passed with no copyright issues
- [ ] Final submission confirmed and verified
