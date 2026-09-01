# WebMCP roadmap implementation audit

## P0 — trustworthy agent control

- Async, abortable registration and readiness: `useWebMCP` waits for every stage-specific registration and disposes stale surfaces.
- Pure state reads: state, gap, candidate, policy comparison, finalization preview, and export preview do not mutate workspace version or Activity.
- Agent-visible trust signals: strict schemas, `readOnlyHint`, `untrustedContentHint`, compact 1,500-character receipts, `workspace_version`, modified IDs, and next actions.
- Human authority: exact record IDs, privacy scope, and expected workspace version appear in a visible consent dialog before evidence review, finalization, or private export.
- The autonomous WebMCP entry point uses the same broker twice: once before qualifying its exact extracted finding IDs and once before finalizing its selected candidate. Missing, declined, cancelled, or stale consent leaves the completed intermediate work uncommitted at that boundary.
- Dynamic capability surface: only tools valid for the current stage remain registered; recovery tools stay available in later stages.

## P1 — evidence composition and reversible judgment

- Atomic evidence batches accept one to eight records with origin, retrieval method, timestamp, and permission scope. Invalid records reject the whole batch.
- Structured gaps return actionable next tools instead of prose-only warnings.
- Counterfactual policy comparison can filter by source type, recency, geography, corroboration, and privacy without mutation.
- The latest counterfactual leader, recommendation-change result, and excluded-source count appear directly in the judge rail while the comparison remains a pure read.
- Applying a policy recalculates eligibility and ranking without deleting evidence; rollback restores the broad policy.
- Finalization and export use preview/commit boundaries. Public-safe export excludes private evidence; private-inclusive export always requires consent.

## P2 — proof that agents can use it

- Seven deterministic agent-planning cases cover direct, ambiguous, denied-consent, stale-state, missing-counter-evidence, counterfactual, and mid-chain recovery behavior.
- The provider runner records provider/model/tool sequence and scores ordered tool use when `SOCLAAS_API_KEY` is available.
- `artifacts/demo/webmcp-journey.json` records the exact connected-browser sequence, versions, consent checkpoints, final artifact, and unresolved external gates.

## Pitch surface

- The rail tells a four-part judging story: live context, close gaps, test policy, trace proof.
- The judge prompt is copyable from the page.
- Receipts show the latest tool and version transition, while Activity keeps the complete human/agent/system history.
- The final blueprint makes accepted support, retained counter-signals, risk, next test, and component-to-source trace visible on the same page.

## Remaining release gates

- Rerun `npm run eval:webmcp` with the submission provider credential and archive the scored output.
- Repeat the journey on the exact WebMCP-enabled ChatGPT/Chrome judging host and record the host/browser version.
- Treat the existing deployment as stale until this branch is deployed and the production journey is rerun.
