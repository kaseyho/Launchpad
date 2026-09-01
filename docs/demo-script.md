# LaunchPad WebMCP demo script

Target recording length: 2 minutes 20 seconds or less.

## Live evidence mission

**0:00–0:20 — The browser is the context**

“LaunchPad turns scattered evidence into a recommendation you can defend. WebMCP lets the browser agent operate the same live workspace the judge is looking at.”

Enter the problem. Expand **Show judge mission**, copy the prepared prompt, and point to the stage-scoped tools. The rail should say **Connected to this workspace** only after registration completes.

**0:20–0:50 — Evidence arrives with provenance**

The agent calls `get_foundry_state`, researches relevant public sources in the browser, and calls `ingest_evidence_batch`. Point to the compact version transition and the same evidence appearing in the page. Open one record and show origin, retrieval time, citation, caveat, and privacy scope.

Call `get_evidence_gaps`. Read the structured next action: which lane is missing, why it matters, and which tool should close it. Add counter-evidence rather than hiding the contradiction.

**0:50–1:20 — Policy changes the decision**

Generate candidates, then ask: “What changes if community evidence is excluded, only recent sources count, and each component needs independent corroboration?”

The agent calls `compare_evidence_policy`. Emphasize that the comparison is pure. Show the before/after ranking, then call `apply_evidence_policy` and show the visible recommendation change. The complete ledger and its review decisions remain intact, so the default policy can restore the baseline.

**1:20–1:45 — The human remains responsible**

Call `review_evidence_with_consent` with exact finding IDs and the observed workspace version. The tool pauses. Show the dialog’s IDs, privacy scope, and version, then approve from the human button. Mention that decline, cancellation, or a stale version commits nothing.

**1:45–2:05 — Preview, attack, commit**

Stress-test the leading candidate with accepted counter-evidence. Call `preview_finalization`; if the preview is clear, call `finalize_blueprint_with_consent` and approve the visible checkpoint. This is preview first, human commit second.

**2:05–2:20 — Trace the proof**

Call `trace_evidence` for one feature. Follow the visible component → insight → finding → source path. Preview a public-safe export, commit it, and show that the full file stays in the download surface while the agent receives only a compact receipt.

Close with: “Live context. Gap closure. A policy that can change the answer. Proof you can trace. WebMCP makes the evidence workflow operable; LaunchPad keeps the decision accountable.”
