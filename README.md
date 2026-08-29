# ProofFoundry

**Raw signals in. Proof-carrying ideas out.**

[Open the live public app](https://proof-foundry.hello18528.chatgpt.site) · [Watch the 1:49 narrated demo](artifacts/demo/ProofFoundry-demo.mp4)

ProofFoundry is a visual research factory where a human and a browser agent turn fragmented evidence into one defensible, testable idea. It is built for the [WebMCP Challenge](https://webmcp.devpost.com/) and exposes the complete research-to-blueprint workflow as 16 narrow WebMCP tools—not as a one-shot generation wrapper.

The application is fully usable without an agent. Every manual control and every WebMCP tool invokes the same typed domain service, updates the same live workspace, and writes to the same visible audit log.

Use **Define problem** for a fresh brief, or load the curated problem for the repeatable judging sequence. The Source Dock accepts public URLs, pasted excerpts, PDF/TXT/CSV/JSON uploads, and live Crossref academic-metadata results.

## The two-minute demo

1. Select **Load demo problem** to define a six-week SaaS onboarding opportunity.
2. Plan six source lanes, source the curated evidence pack, and extract nine citation-complete findings.
3. Open the Evidence Inspector to inspect exact passages, context, caveats, and provenance.
4. Accept the evidence, synthesize insights, and forge three candidates.
5. Observe **Admin Guild** lead with a score of 98.
6. Select **Exclude community anecdotes**. Candidate A drops to 50% support with two unsupported components.
7. Observe **First-Value Flightpath** become the strongest candidate at 90.
8. Stress-test and finalize the new recommendation.
9. In the blueprint, select **Why Outcome preview exists** to illuminate the feature → insight → finding → source proof path.
10. Export a public-safe Markdown or JSON blueprint.

In a WebMCP-enabled browser, an agent can perform the same sequence through the registered tools while the human watches and intervenes in the same page.

## WebMCP tool surface

| Tool | Mode | Visible effect |
|---|---|---|
| `get_foundry_state` | Read | Returns stage, counts, warnings, and selected candidate |
| `update_problem_brief` | Write | Updates the Problem Hopper |
| `plan_research` | Write | Activates six structured source lanes |
| `search_sources` | Write | Adds deduplicated source crates |
| `import_source` | Write | Adds a URL, excerpt, upload, or connected-data result |
| `extract_findings` | Write | Moves citation-complete findings into inspection |
| `review_findings` | Write | Accepts, rejects, or qualifies evidence and recalculates support |
| `get_evidence_gaps` | Read | Returns quality-gate gaps and warnings |
| `synthesize_insights` | Write | Assembles opportunity themes and contradictions |
| `generate_idea_candidates` | Write | Populates one to three evidence-linked candidates |
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

- Vinext/React renders one persistent, responsive factory workspace.
- A framework-independent TypeScript service owns state transitions, evidence gates, lineage, scoring, stress tests, and exports.
- Manual UI handlers and top-level `document.modelContext.registerTool` handlers call that same service instance.
- Cloudflare D1 stores versioned workspace snapshots using an anonymous, HTTP-only browser identity.
- Cloudflare R2 stores PDF, TXT, CSV, and JSON evidence uploads; D1 stores their searchable metadata.
- A server-side Crossref adapter returns citation-ready DOI metadata without treating metadata or abstracts as accepted evidence.
- The deterministic demo pack contains genuine public source links and clearly disclosed synthetic private/company evidence.

See [docs/architecture.md](docs/architecture.md) for the detailed state, persistence, and safety model.

## Evidence and privacy rules

- Synthetic data is always labelled.
- Findings remain pending until a human or an explicitly directed agent accepts, rejects, or qualifies them.
- Every public claim in the demo carries an exact excerpt, source location, access mode, and retrieval timestamp.
- Inaccessible content remains metadata-only; ProofFoundry never fabricates a passage.
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

## License

MIT. See [LICENSE](LICENSE).
