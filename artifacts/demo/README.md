# ProofFoundry demo video

`ProofFoundry-demo.mp4` is a 1 minute 49 second narrated walkthrough of the deployed WebMCP workflow.

- Resolution: 1920 × 1080
- Video: H.264
- Audio: stereo AAC, 48 kHz
- Captured from: https://proof-foundry.hello18528.chatgpt.site
- Sequence: connected workspace → source lanes → citation inspection → initial candidate → evidence-driven recommendation switch → final proof trace

The video is ready for upload to the public video host used by the Devpost submission.

## Connected-browser WebMCP evidence

`webmcp-journey.json` records both the original local run and the final public judging-host run. The production run used the ChatGPT desktop in-app browser against `https://launchpad.hello18528.chatgpt.site/`, discovered the 22-tool stage-aware catalog, and exercised 26 exact calls from workspace v1 through v19. It proved non-mutating reads, visible version receipts, a human evidence-consent checkpoint, policy comparison/apply/rollback, a four-hop proof trace, finalization consent, and a public-safe Markdown export. The corrected final Sites version 13 then passed a reload smoke check with the finalized workspace intact, the completed run panel visible, the privacy schema clarification present, and zero browser console errors.

The Activity dialog visibly recorded every mutating step and final file name. The final rail receipt was `export_blueprint`, `v18 → v19`, and the browser console contained no errors.

The full judging-host journey passed. The configured provider-backed eval also ran live; four cases passed in the most complete run before the provider account began returning HTTP 429. That rate limit remains explicit in `webmcp-agent-evals.json` and no passing result is fabricated.
