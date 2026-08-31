# LaunchPad

**Type one problem. Get one evidence-backed solution.**

[Open the live public app](https://launchpad-nine-sand.vercel.app)

LaunchPad is an autonomous research-to-solution web app built for the [WebMCP Challenge](https://webmcp.devpost.com/). The person does one thing: describes the problem. LaunchPad then uses server-side AI web research to investigate that exact request, preserves citation-linked limitations and counter-evidence, develops one problem-specific recommendation, stress-tests it, and presents the solution with the complete research ledger behind it.

No user-supplied API key, source upload, prompt copying, or manual research workflow is required. The deployment operator configures the OpenAI credential as a server-only secret.

## Functional subscription strategy

The header's **Plans** control manages a working product allowance. Explorer includes three complete research runs per month. Builder lets a user choose 10–100 runs, while Studio lets a team choose 60–500 shared runs and 3–15 seats. LaunchPad calculates the monthly quote from those inputs, applies the configuration to the product, records each completed human or WebMCP run, and blocks the next run when the allowance reaches zero.

For judging, the evaluation account is stored in the current browser so the core demo has no dependency on Supabase inactivity or payment credentials. Usage and entitlement behavior are functional; external payment collection and cross-device account persistence remain explicit production integrations. Revenue scenarios are labeled as hypotheses, not customer traction.

## Product flow

1. Enter a real problem statement.
2. LaunchPad asks its AI research agent to search the web for the actual request; a specific live-result query pauses for missing essentials instead of guessing.
3. It validates every report URL against the web-search results, qualifies conservative source-grounded findings, and keeps contrary findings visible.
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

WebMCP does not require an API key pasted into the site. In a supported browser, the page registers its tools with `document.modelContext`; the browser agent invokes the same server-side AI/web-research runner in the existing page session.

## Two-minute demo

1. Type a problem and click **Research this problem**.
2. Watch the factory move through planning, search, extraction, synthesis, ideation, and stress testing.
3. Reveal the finished solution, its proof cards, limitations, assumptions, and next test.
4. Open the research ledger and follow any finding to its original source.
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
| `import_source` | Adds a source URL, excerpt, or connected-data result |
| `extract_findings` | Creates traceable atomic findings |
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

- The autonomous runner calls SoCLaaS's OpenAI-compatible Responses API with web search and a strict structured-output schema. The server rejects uncited report URLs, duplicate sources, missing counter-evidence, and generic fallback recommendations.
- The legacy same-origin Crossref/Reddit adapters remain available for narrower manual source discovery; they are no longer the autonomous answer generator.
- The evidence model also accepts public reports, market and competitor sources, professional/community posts, user interviews, connected analytics, and uploaded or pasted excerpts through WebMCP or the source importer.
- AI web-search findings are explicitly labeled as synthesized paraphrases linked to their original URLs, never as exact quotations. User-provided passages retain their verbatim-excerpt label.
- Community and market signals are explicitly categorized and caveated; they are not presented as prevalence or verified research conclusions.
- At least one counter-evidence finding is required before finalization.
- The final output says why an idea is worth testing; it never claims an unbuilt intervention is proven to work.
- High-stakes decisions should verify the full papers and involve an appropriate expert.

## Local development

Requires Node.js 22.13 or newer.

```bash
npm install
cp .env.example .env.local
# Set SOCLAAS_API_KEY in .env.local
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
- `/api/research` runs the AI/web-search request server-side, validates citation lineage, and returns either a grounded structured report or concise clarification questions. Public source adapters remain available for manual discovery.
- Browser snapshots preserve a completed workspace locally; Cloudflare/Sites deployments can also persist workspaces through the configured D1 adapter.

See [docs/architecture.md](docs/architecture.md) for the detailed state and persistence model.

## License

MIT. See [LICENSE](LICENSE).
