# LaunchPad WebMCP demo

`LaunchPad-WebMCP-demo.mp4` is a 2 minute 6 second narrated walkthrough of the final deployed WebMCP workflow.

- Resolution: 1280 × 720
- Video: H.264
- Audio: mono AAC, 22.05 kHz
- Captured from: https://launchpad.hello18528.chatgpt.site
- Sequence: finalized workspace → judge mission → versioned WebMCP activity → Admin Guild solution → four-hop proof trace → public-safe export

`LaunchPad-WebMCP-demo-contact-sheet.jpg` provides a visual QA overview of the complete video. The video is ready for upload to the public YouTube host required by the Devpost submission.

`youtube-upload.md` contains the final title, public description, chapters, and upload settings so the host upload can be completed without rewriting the submission story.

The uploaded YouTube asset is `https://youtu.be/U3tsnlD0J_s`. YouTube accepted the file and completed its copyright checks with no issues; the video remains private until the explicit public-publish confirmation.

## Connected-browser WebMCP evidence

`webmcp-journey.json` records both the original local run and the final public judging-host run. The production run used the ChatGPT desktop in-app browser against `https://launchpad.hello18528.chatgpt.site/`, discovered the 22-tool stage-aware catalog, and exercised 26 exact calls from workspace v1 through v19. It proved non-mutating reads, visible version receipts, a human evidence-consent checkpoint, policy comparison/apply/rollback, a four-hop proof trace, finalization consent, and a public-safe Markdown export. The final Sites version 17 then passed a reload smoke check with the finalized workspace intact, the completed run panel visible, the polished in-flow judge mission and non-overlapping rail present, and zero browser console errors.

The Activity dialog visibly recorded every mutating step and final file name. The final rail receipt was `export_blueprint`, `v18 → v19`, and the browser console contained no errors.

The full judging-host journey passed. The configured provider-backed eval also ran live; four cases passed in the most complete run before the provider account began returning HTTP 429. That rate limit remains explicit in `webmcp-agent-evals.json` and no passing result is fabricated.
