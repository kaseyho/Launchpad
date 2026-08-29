# LaunchPad

**Type one problem. Get one evidence-backed solution.**

[Open the live public app](https://launchpad-nine-sand.vercel.app)

LaunchPad is an autonomous research-to-solution web app built for the [WebMCP Challenge](https://webmcp.devpost.com/). The person does one thing: describes the problem. LaunchPad then searches relevant academic research, extracts citation-linked findings, preserves limitations and counter-evidence, develops one recommended intervention, stress-tests it, and presents the solution with the complete research ledger behind it.

No API key, source upload, prompt copying, or manual research workflow is required.

## Product flow

1. Enter a real problem statement.
2. LaunchPad frames and runs three focused research searches.
3. It reads citation-ready abstracts, qualifies the useful findings, and keeps contrary findings visible.
4. It turns the strongest mechanisms into one problem-specific solution.
5. It stress-tests that recommendation and returns:
   - why the solution can work;
   - the research supporting each core decision;
   - limitations and counter-signals;
   - assumptions that remain unproven; and
   - a concrete validation plan.

The interactive voxel factory makes the run legible while it happens. The activity log is optional and stays closed until the user wants an audit trail.

## Why WebMCP matters

WebMCP is LaunchPad’s optional browser-agent control and verification layer, not another step for the user.

- `research_and_ideate` starts the same complete problem-to-solution run exposed by the page.
- Sixteen narrower tools let an agent inspect or operate the underlying brief, sources, findings, evidence gaps, candidates, lineage, stress test, and export.
- Human actions and WebMCP actions use the same domain service, update the same visible page, and write to the same activity trail.
- Read-only tools expose the final state and proof paths without mutating the result.

WebMCP does not require an API key pasted into the site. In a supported browser, the page registers its tools with `document.modelContext`; the browser agent can invoke them in the existing page session.

## Two-minute demo

1. Type a problem and click **Research this problem**.
2. Watch the factory move through planning, search, extraction, synthesis, ideation, and stress testing.
3. Reveal the finished solution, its proof cards, limitations, assumptions, and next test.
4. Open the research ledger and follow any finding to its DOI source.
5. Expand **WebMCP details** to show the one-shot agent tool and the sixteen inspection/operation tools.
6. Optionally ask a browser agent to call `research_and_ideate`, then inspect the activity log to prove the page changed through WebMCP.

## WebMCP tool surface

| Tool | Purpose |
|---|---|
| `research_and_ideate` | Runs the full visible research-to-solution workflow in one call |
| `get_foundry_state` | Reads the active brief, stage, counts, warnings, and selected solution |
| `update_problem_brief` | Updates the structured problem brief |
| `plan_research` | Creates structured research questions |
| `search_sources` | Searches a configured source lane |
| `import_source` | Adds a citation, excerpt, or connected-data result |
| `extract_findings` | Creates citation-complete atomic findings |
| `review_findings` | Accepts, rejects, or qualifies findings |
| `get_evidence_gaps` | Returns quality-gate gaps and warnings |
| `synthesize_insights` | Clusters findings and contradictions |
| `generate_idea_candidates` | Creates evidence-linked solution proposals |
| `inspect_candidate` | Reads solution structure and evidence coverage |
| `stress_test_candidate` | Applies counter-evidence and records risks |
| `revise_candidate` | Revises a candidate while preserving lineage |
| `trace_evidence` | Reads a complete solution-component-to-source path |
| `finalize_blueprint` | Locks the evidence-gated solution blueprint |
| `export_blueprint` | Produces Markdown or JSON output |

All tool schemas reject undeclared fields. Read tools carry the `readOnlyHint` annotation. Write tools validate the current state, report side effects, and return actionable failures.

## Research and evidence model

- Academic discovery uses the public Crossref Works API; the user supplies no credential.
- LaunchPad only selects records with an available abstract for the autonomous run.
- Every visible finding contains its exact abstract excerpt, title, author, date, and DOI link.
- Abstract-derived findings are explicitly qualified, not presented as verified full-paper conclusions.
- At least one counter-evidence finding is required before finalization.
- The final output says why an idea is worth testing; it never claims an unbuilt intervention is proven to work.
- High-stakes decisions should verify the full papers and involve an appropriate expert.

## Local development

Requires Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Validation:

```bash
npm test
npx next typegen
npx tsc --noEmit
npm run lint
npm run build
```

## Architecture

- Vinext/React renders a responsive single-page factory around the supplied `factory.glb` model.
- A framework-independent TypeScript service owns state transitions, evidence gates, lineage, stress tests, and exports.
- The autonomous research runner orchestrates that same service rather than maintaining a hidden second workflow.
- The Crossref adapter runs server-side and returns citation-ready metadata and abstracts.
- Browser snapshots preserve a completed workspace locally; Cloudflare/Sites deployments can also persist workspaces through the configured D1 adapter.

See [docs/architecture.md](docs/architecture.md) for the detailed state and persistence model.

## License

MIT. See [LICENSE](LICENSE).
