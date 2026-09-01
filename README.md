# LaunchPad

**Type one problem. Get one evidence-backed solution.**

[Open the live public app](https://launchpad.hello18528.chatgpt.site)

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

WebMCP turns the current page into a live evidence mission rather than a chat wrapper.

- The agent reads the exact problem, stage, gaps, and recommendation already visible in the browser.
- Browser-found evidence enters in one atomic, provenance-stamped batch with origin, retrieval time, and privacy scope.
- Gap results name the evidence lane and action needed next.
- Counterfactual policies show whether source type, recency, geography, corroboration, or private evidence changes the recommendation without deleting the ledger.
- Read tools are genuinely pure. Sensitive evidence acceptance, finalization, and private export stop at a visible human-consent checkpoint bound to the current workspace version.
- Every compact receipt reports the workspace version, modified IDs, recovery actions, and the next useful operations.

WebMCP does not require an API key pasted into the site. In a supported browser, the page registers its tools with `document.modelContext`; the browser agent invokes the same server-side AI/web-research runner in the existing page session.

## Two-minute demo

1. Enter a problem, connect a WebMCP browser agent, and copy the in-page judge mission.
2. Watch the agent read live state, add browser-found evidence with provenance, and close a named evidence gap.
3. Compare a stricter evidence policy and show the candidate ranking change on the same page.
4. Approve the exact evidence IDs in the visible human-consent dialog.
5. Trace one recommendation component to its source, preview finalization/export, and approve the sensitive commit.
6. Read the version transitions and exact tool sequence from the rail and Activity log.

## WebMCP tool surface

| Tool | Purpose |
|---|---|
| `research_and_ideate` | Runs the full visible workflow, pausing for evidence-review and finalization consent |
| `get_foundry_state` | Reads the active brief, stage, counts, warnings, and selected solution |
| `update_problem_brief` | Updates the structured problem brief |
| `plan_research` | Creates structured research questions |
| `search_sources` | Searches a configured source lane |
| `import_source` | Adds one source URL, excerpt, or connected-data result |
| `ingest_evidence_batch` | Atomically adds up to eight provenance- and privacy-stamped evidence records |
| `extract_findings` | Creates traceable atomic findings |
| `review_evidence_with_consent` | Pauses for human approval, then reviews exact finding IDs |
| `get_evidence_gaps` | Returns gaps, warnings, and structured next actions |
| `compare_evidence_policy` | Purely compares a counterfactual evidence policy and ranking |
| `apply_evidence_policy` | Non-destructively applies a source/recency/geography/corroboration/privacy policy |
| `synthesize_insights` | Clusters findings and contradictions |
| `generate_idea_candidates` | Creates evidence-linked solution proposals |
| `inspect_candidate` | Reads solution structure and evidence coverage |
| `stress_test_candidate` | Applies counter-evidence and records risks |
| `revise_candidate` | Revises one candidate’s support without changing shared evidence judgments |
| `trace_evidence` | Reads a complete solution-component-to-source path |
| `preview_finalization` | Purely previews finalization gates and binds a workspace version |
| `finalize_blueprint_with_consent` | Human-approved finalization commit |
| `preview_export` | Purely previews public-safe or private-inclusive export |
| `export_blueprint_with_consent` | Commits export; private evidence always requires human consent |

Only stage-relevant tools are registered. Registration is asynchronous and abortable; readiness is shown only after every current tool succeeds. Schemas reject undeclared fields, pure reads carry `readOnlyHint`, evidence-returning tools carry `untrustedContentHint`, and output is capped at 1,500 characters.

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

Agent-selection evals:

```bash
npm run eval:webmcp
```

The dataset covers direct missions, ambiguous browser context, policy arguments, denied consent, missing counter-evidence, stale versions, and mid-chain recovery. With `SOCLAAS_API_KEY`, the runner gives the configured model the real stage-specific WebMCP definitions, records calls/arguments, and fails on selection or recovery errors. Without credentials it writes an explicit `skipped` report to `artifacts/demo/webmcp-agent-evals.json`; it never invents a pass or prints credentials/private evidence.

## Architecture

- Vinext/React renders a responsive single-page factory around the supplied `factory.glb` model.
- A framework-independent TypeScript service owns state transitions, evidence gates, lineage, stress tests, and exports.
- The autonomous research runner orchestrates that same service rather than maintaining a hidden second workflow.
- `/api/research` runs the AI/web-search request server-side, validates citation lineage, and returns either a grounded structured report or concise clarification questions. Public source adapters remain available for manual discovery.
- Browser snapshots preserve a completed workspace locally; Cloudflare/Sites deployments can also persist workspaces through the configured D1 adapter.

See [docs/architecture.md](docs/architecture.md) for the detailed state and persistence model.

## License

MIT. See [LICENSE](LICENSE).
