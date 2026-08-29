# LaunchPad

**Evidence in. Defensible ideas out.**

[Open the live public app](https://proof-foundry.hello18528.chatgpt.site)

LaunchPad is a visual research factory where a human starts with their own problem and a browser agent helps turn relevant evidence into one defensible, testable idea. It is built for the [WebMCP Challenge](https://webmcp.devpost.com/) and exposes the complete research-to-blueprint workflow as 16 narrow WebMCP tools—not as a one-shot generation wrapper.

The application is fully usable without an agent. Every manual control and every WebMCP tool invokes the same typed domain service, updates the same live workspace, and writes to the same audit trail. The activity drawer stays closed until someone wants to inspect it.

## Why WebMCP matters

LaunchPad does not place a chat box beside the product. It exposes the product itself as 16 typed browser tools:

1. An agent reads the same workspace the human sees.
2. It calls one narrow LaunchPad tool, such as `extract_findings` or `stress_test_candidate`.
3. The shared page changes immediately, including the interactive factory stage, workbench, scores, and proof lineage.

The first screen makes that loop visible with a large problem-statement input and a live WebMCP rail. Once the problem is saved, the page creates a problem-specific ChatGPT instruction. Open **Activity** only when you want proof of who acted, which tool ran, and what changed.

WebMCP does **not** require the user to paste an API key into LaunchPad. A supported browser exposes the page’s registered tools to the agent already running in that browser session. The Source Dock accepts public URLs, pasted excerpts, PDF/TXT/CSV/JSON uploads, and live Crossref academic-metadata results.

## The two-minute demo

1. Type a real problem statement into the empty factory and save it.
2. Copy the problem-specific instruction from the WebMCP rail and give it to the browser agent.
3. Watch the agent call `get_foundry_state`, read the exact human-authored brief, plan research, and import relevant evidence into the same page.
4. Inspect one evidence record to verify its exact passage, context, caveats, and provenance before accepting or rejecting it.
5. Let the agent submit structured, problem-specific candidates through `generate_idea_candidates`; LaunchPad links their components to accepted findings and scores their evidence coverage.
6. Stress-test the strongest candidate, finalize its validation plan, and trace one feature back to its source.
7. Open **Activity** briefly to verify the real agent tool calls, then export a public-safe Markdown or JSON blueprint.

In a WebMCP-enabled browser, an agent can perform the same sequence through the registered tools while the human watches and intervenes in the same page.

## WebMCP tool surface

| Tool | Mode | Visible effect |
|---|---|---|
| `get_foundry_state` | Read | Returns the human-authored brief, stage, counts, warnings, and selected candidate |
| `update_problem_brief` | Write | Updates the shared launch brief |
| `plan_research` | Write | Activates six structured source lanes |
| `search_sources` | Write | Uses connected source adapters; leaves an open import task when no adapter result exists |
| `import_source` | Write | Adds a URL, excerpt, upload, or connected-data result |
| `extract_findings` | Write | Moves citation-complete findings into inspection |
| `review_findings` | Write | Accepts, rejects, or qualifies evidence and recalculates support |
| `get_evidence_gaps` | Read | Returns quality-gate gaps and warnings |
| `synthesize_insights` | Write | Assembles opportunity themes and contradictions |
| `generate_idea_candidates` | Write | Validates and renders one to three agent-proposed, evidence-linked candidates |
| `inspect_candidate` | Read | Returns structure, coverage, links, and unsupported components |
| `stress_test_candidate` | Write | Records counter-evidence and adoption/feasibility risks |
| `revise_candidate` | Write | Revises a candidate without breaking lineage |
| `trace_evidence` | Read | Highlights the complete component-to-source proof path |
| `finalize_blueprint` | Write | Locks a versioned, evidence-gated blueprint |
| `export_blueprint` | Write | Prepares a Markdown or JSON export |

All schemas reject undeclared fields. Read tools carry the `readOnlyHint` annotation. Write tools describe their side effects, validate the current state, return modified IDs, and produce actionable failure codes.

## Local development

Requirements: Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. The manual experience works in any current browser. Agent operation requires a browser build with WebMCP enabled.

Validation commands:

```bash
npm test
npx tsc --noEmit
npm run lint
npm run build
npm run db:generate
```

## Architecture

- Vinext/React renders one persistent, responsive factory workspace around the supplied voxel factory GLB.
- A framework-independent TypeScript service owns state transitions, evidence gates, lineage, scoring, stress tests, and exports.
- Manual UI handlers and top-level `document.modelContext.registerTool` handlers call that same service instance; the WebMCP rail and optional activity drawer expose the result.
- Cloudflare D1 stores versioned workspace snapshots using an anonymous, HTTP-only browser identity.
- Cloudflare R2 stores PDF, TXT, CSV, and JSON evidence uploads; D1 stores their searchable metadata.
- A server-side Crossref adapter returns citation-ready DOI metadata without treating metadata or abstracts as accepted evidence.
- A deterministic judging pack remains available for the documented administrator-setup scenario, while custom problems never receive those unrelated fixtures.

See [docs/architecture.md](docs/architecture.md) for the detailed state, persistence, and safety model.

## Evidence and privacy rules

- Synthetic data is always labelled.
- Findings remain pending until a human or an explicitly directed agent accepts, rejects, or qualifies them.
- Every public claim in the demo carries an exact excerpt, source location, access mode, and retrieval timestamp.
- Inaccessible content remains metadata-only; LaunchPad never fabricates a passage.
- Public exports omit private sources and their findings by default.
- Uploaded files accept only PDF, TXT, CSV, or JSON up to 10 MB and remain in private object storage.
- Tokens and credentials are never placed in tool results or workspace state.

## Public source provenance

| Source | Role in the demo |
|---|---|
| [Sweller, *Cognitive load during problem solving: Effects on learning*](https://doi.org/10.1016/0364-0213(88)90023-7) | Mechanism evidence about means-ends problem solving and cognitive load |
| [Schwonke et al., *Effects of different ratios of worked solution steps and problem solving opportunities*](https://doi.org/10.1016/j.chb.2010.03.037) | Mechanism evidence for worked examples |
| [GOV.UK Service Manual, *Learning about users and their needs*](https://www.gov.uk/service-manual/user-research/start-by-learning-user-needs) | Assumption discipline |
| [W3C WAI, *Provide Help and Support*](https://www.w3.org/WAI/WCAG2/supplemental/objectives/o7-support/) | Accessibility guidance for contextual support |
| [Nielsen Norman Group, *Flash Usability Report*](https://media.nngroup.com/media/reports/free/Website_Tools_and_Applications_with_Flash.pdf) | Counter-evidence about forced tutorial control |

The GA4 funnel, support-ticket sample, and two community observations are synthetic fixtures created only for the hackathon demonstration.

## Current scope

This P0 is deliberately one excellent problem-to-blueprint journey. It does not include team accounts, enterprise OAuth connectors, semantic search over arbitrary uploads, or autonomous evidence acceptance. PDF uploads are stored and represented as metadata-only until a parser or user-supplied excerpt is available.

The repository also retains a [legacy 1:49 demo recording](artifacts/demo/ProofFoundry-demo.mp4) of the earlier interface for project history; it does not represent the current LaunchPad design.

## License

MIT. See [LICENSE](LICENSE).
