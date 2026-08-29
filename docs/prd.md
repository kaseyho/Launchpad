# Product Requirements Document

## **LaunchPad**

**Working tagline:** **Evidence in. Defensible ideas out.**

**Alternative tagline:** **Turn a messy problem into an idea you can defend.**

**Product category:** Agent-native research-to-idea workspace  
**Primary audience:** Product teams, innovation teams, strategy teams, consultants, founders, and hackathon teams  
**Version:** Hackathon MVP 1.0  
**Status:** Build-ready PRD

The official criteria are equally weighted, with WebMCP Leverage serving as the first tie-breaker. The submission also needs a working live URL, public open-source repository, and a public demo video of less than three minutes. This PRD is therefore designed around one visually memorable, end-to-end workflow rather than a broad research platform. ([The WebMCP Challenge](https://webmcp.devpost.com/rules "https://webmcp.devpost.com/rules"))

No PRD can guarantee a 10/10 score, but this version is deliberately optimized around every criterion.

---

# 1. Essential product correction

The product should **not** claim:

> “We prove that this idea will work.”

Research cannot prove that an unbuilt product or intervention will succeed.

The credible promise is:

> **“We produce an evidence-backed idea that is worth testing—and show exactly why.”**

The final output should therefore contain three distinct sections:

1. **Why this idea can work**
    
2. **What must be true**
    
3. **What should be tested next**
    

That framing makes the product more trustworthy, more enterprise-ready, and less like an AI idea generator making unjustified claims.

---

# 2. Executive summary

LaunchPad is a visual, agent-native research and ideation workspace.

A user enters a real problem, such as:

- a customer problem;
    
- a business case;
    
- an enterprise challenge;
    
- a product opportunity;
    
- a hackathon brief;
    
- an operational problem;
    
- a growth or analytics problem.
    

After that single submission, LaunchPad autonomously:

1. converts the problem into a structured research brief;
    
2. creates a research plan;
    
3. searches or imports relevant sources;
    
4. extracts atomic findings with exact citations;
    
5. separates strong evidence from weak anecdotes;
    
6. surfaces contradictions and missing evidence;
    
7. clusters findings into opportunity areas;
    
8. generates one evidence-backed solution;
    
9. stress-tests the strongest candidate;
    
10. assembles a final **Proof-Carrying Idea Blueprint**.
    

The human is not asked to provide an API key, find sources, approve intermediate stages, or operate a manual research workflow. They see the entire process advance through a compact interactive 3D factory and can inspect the final research ledger.

WebMCP exposes the same complete run to a browser agent through one high-level tool and exposes the underlying stages through narrower inspection and operation tools. It is an optional control and verification layer, not a prerequisite for using the product.

Research papers, reports, analytics, uploaded documents, community observations, and market evidence enter as “raw material.” Findings move through visual processing stations. Contradictions are flagged as defects. Insights are assembled into a final product blueprint.

Most importantly:

> **Every important part of the final idea can be traced backward to the evidence that caused it to exist.**

The user can click a feature, target audience, design decision, or numerical claim and see:

```text
Idea component
      ↓
Insight that motivated it
      ↓
Findings that support it
      ↓
Exact passages and numerical evidence
      ↓
Original sources
```

This evidence lineage is the product’s primary innovation.

---

# 3. Five-second pitch

> **LaunchPad turns one messy problem into one evidence-backed solution. The product researches autonomously; WebMCP lets a browser agent start the same run and verify every step.**

The visual hook:

```text
PROBLEM IN
   ↓
RESEARCH FACTORY
   ↓
DEFENSIBLE IDEA OUT
```

The memorable phrase for judges is:

# **Proof-carrying ideas**

Not merely ideas with a bibliography.

Ideas where every important decision carries its supporting evidence.

---

# 4. The real-world problem

Today, research and ideation are disconnected.

A product manager or strategist may have:

- 14 browser tabs;
    
- several research papers;
    
- a consulting report;
    
- an analytics dashboard;
    
- customer interview notes;
    
- support tickets;
    
- community discussions;
    
- competitor pages;
    
- a spreadsheet of metrics.
    

They then open an AI assistant and ask:

> “Given all this, what should we build?”

The output may sound plausible, but the reasoning is difficult to audit.

The team cannot easily answer:

- Which evidence caused this feature to be proposed?
    
- Was the idea driven by first-party behavior or online anecdotes?
    
- Did multiple sources repeat the same underlying report?
    
- Does the evidence apply to our audience, geography, or timeframe?
    
- What findings contradict the recommendation?
    
- Which parts are facts, and which parts are hypotheses?
    
- What changes if one source is removed?
    
- Does the final idea address the observed problem or merely sound innovative?
    

The resulting gap is:

```text
RESEARCH EXISTS
      +
IDEAS EXIST
      ≠
TRACEABLE RESEARCH-TO-IDEA REASONING
```

LaunchPad closes that gap.

---

# 5. Product vision

## Long-term vision

LaunchPad becomes the default workspace for turning ambiguous problems into evidence-backed interventions.

Its core object is not a document, board, prompt, or chat.

Its core object is:

# **An evidence-to-decision graph**

That graph connects:

```text
Sources
→ Findings
→ Insights
→ Opportunities
→ Ideas
→ Design decisions
→ Validation experiments
```

## Hackathon vision

For the hackathon, build one exceptional workflow:

> Enter a problem once, let LaunchPad construct the evidence factory, challenge its own recommendation, and receive a final solution with visible, clickable proof.

The user should understand the product before the first tool call finishes.

---

# 6. Why WebMCP is fundamental

WebMCP is the **control plane**, not the research data source.

LaunchPad owns:

- its source adapters;
    
- its research jobs;
    
- its database;
    
- its evidence graph;
    
- its citation system;
    
- its visualization;
    
- its analytics connector;
    
- its extraction and synthesis logic.
    

WebMCP allows the user’s agent to operate those capabilities directly on the same live page.

OpenAI’s current site-tools documentation describes WebMCP as a mechanism for the website and agent to share the same page and session. The agent can invoke structured actions, inspect the resulting page changes, and use the application’s existing logic. OpenAI specifically recommends narrow inputs, explicit side effects, existing authentication and validation, and results sufficient to verify the operation. ([ChatGPT Learn](https://learn.chatgpt.com/docs/webmcp "https://learn.chatgpt.com/docs/webmcp"))

## Without WebMCP

The user would manually:

1. write a problem brief;
    
2. create six research questions;
    
3. issue multiple searches;
    
4. import URLs;
    
5. inspect each source;
    
6. extract findings;
    
7. classify findings;
    
8. detect duplicates;
    
9. organize clusters;
    
10. create idea candidates;
    
11. connect evidence to features;
    
12. search counter-evidence;
    
13. revise the idea;
    
14. create the final blueprint.
    

Alternatively, the user could ask a generic chatbot for an answer, but the result would live in linear prose rather than a persistent, inspectable evidence workspace.

## With WebMCP

The user says:

> “Research this problem, prioritize first-party behavior and recent academic evidence, find what contradicts the obvious solution, and construct the best idea we could test in six weeks.”

The agent composes LaunchPad’s tools to complete that workflow.

The user watches sources arrive, findings form, gaps appear, and ideas change.

The human can interrupt:

> “Exclude community anecdotes.”

> “Only use evidence after 2024.”

> “Our real customer is the administrator, not the employee.”

> “Show me what supports this feature.”

> “Find evidence against this.”

The agent reads the changed workspace state and continues.

This is the human-agent experience judges need to see.

---

# 7. Product positioning

LaunchPad should not be positioned as:

- another AI search engine;
    
- an AI brainstorming tool;
    
- a generic “deep research” clone;
    
- an autonomous consultant;
    
- a citation generator;
    
- an idea-scoring dashboard;
    
- a replacement for human judgment.
    

It should be positioned as:

> **A visual workspace where humans and agents transform fragmented evidence into proof-carrying ideas.**

## Competitive distinction

|Existing product type|Typical strength|Typical weakness|
|---|---|---|
|Chat assistants|Flexible reasoning|Output is usually linear and difficult to audit|
|Search engines|Source discovery|Weak research-to-decision synthesis|
|Research assistants|Summaries and citations|Limited connection between findings and product decisions|
|Whiteboards|Flexible visual organization|Highly manual|
|Analytics platforms|First-party behavioral evidence|Do not combine evidence into new interventions|
|LaunchPad|Shared evidence graph and agent operation|Narrower, focused on problem-to-idea transformation|

---

# 8. Target users

## Primary persona: Product or innovation lead

**Situation:** Has a poorly defined customer or business problem and must recommend an intervention.

**Inputs:**

- analytics;
    
- customer feedback;
    
- reports;
    
- internal documents;
    
- market research;
    
- public evidence.
    

**Job to be done:**

> “Help me understand what the evidence actually suggests we should build, and give me something I can defend to my team.”

**Success condition:**

A clear idea with traceable rationale, caveats, and a test plan.

---

## Secondary persona: Consultant or strategy analyst

**Situation:** Must turn mixed research into a client recommendation.

**Job to be done:**

> “Show me how each recommendation follows from the available evidence, and make unsupported assumptions visible.”

**Success condition:**

A defensible recommendation with a source trail and transparent limitations.

---

## Entry-wedge persona: Hackathon team

**Situation:** Has very limited time to choose an idea that scores against explicit criteria.

**Job to be done:**

> “Find a genuine problem, show that it matters, generate a differentiated solution, and prove that the solution fits the judging criteria.”

**Success condition:**

A project concept whose impact, novelty, technical fit, and evidence are visible in one blueprint.

---

## Additional users

- founders validating early opportunities;
    
- growth teams interpreting funnel problems;
    
- customer-experience teams;
    
- enterprise transformation teams;
    
- design researchers;
    
- venture studios;
    
- policy and nonprofit innovation teams.
    

---

# 9. Jobs to be done

## Core functional job

> When I encounter an ambiguous problem, help me combine fragmented evidence into one coherent idea so that I can decide what to test next.

## Emotional job

> Help me feel confident that I am not merely choosing the most exciting-sounding solution.

## Social job

> Help me explain and defend the recommendation to colleagues, judges, executives, clients, or investors.

---

# 10. Product principles

## 10.1 Evidence before ideation

The factory should not generate ideas immediately.

It must first build a minimum evidence base.

## 10.2 Facts and hypotheses must look different

The UI must visibly distinguish:

- sourced fact;
    
- derived calculation;
    
- qualitative pattern;
    
- interpretation;
    
- assumption;
    
- hypothesis;
    
- counter-evidence.
    

## 10.3 No invisible reasoning

Users do not need private model reasoning. They need inspectable product reasoning:

- source;
    
- finding;
    
- insight;
    
- idea relationship.
    

## 10.4 Every important number must be traceable

No numerical claim may appear in the final blueprint without either:

- an exact source citation; or
    
- a visible calculation derived from cited inputs.
    

## 10.5 Contradictions are first-class outputs

Conflicting evidence should not be silently averaged away.

## 10.6 The human controls judgment

The agent handles breadth and repetitive operations.

The human controls:

- problem framing;
    
- evidence acceptance;
    
- constraints;
    
- risk tolerance;
    
- candidate selection;
    
- final approval.
    

## 10.7 The factory metaphor must represent real state

Every animated object must correspond to an actual record or event.

No fake conveyor animation during an unrelated loading operation.

## 10.8 No embedded chatbot

The app should not duplicate ChatGPT with another generic chat panel.

The interaction model is:

```text
ChatGPT conversation
       +
LaunchPad visual workspace
       +
WebMCP site tools
```

---

# 11. Product scope

## P0 — Hackathon MVP

The complete judging workflow:

1. enter a problem;
    
2. structure the brief;
    
3. create a research plan;
    
4. search/import sources;
    
5. extract findings with citations;
    
6. inspect and accept evidence;
    
7. identify gaps and contradictions;
    
8. synthesize insight clusters;
    
9. generate three idea candidates;
    
10. choose and stress-test one;
    
11. produce a final Proof-Carrying Idea Blueprint;
    
12. trace any idea component back to evidence;
    
13. export or share the blueprint;
    
14. expose the workflow through non-trivial WebMCP tools.
    

## P1 — Strong stretch features

- direct Google Analytics read-only OAuth;
    
- research date and geography controls;
    
- source-diversity warnings;
    
- idea comparison matrix;
    
- automatic analogous-solution search;
    
- editable evaluation criteria;
    
- workspace snapshots and undo;
    
- collaborative comments;
    
- polished PDF export.
    

## P2 — Post-hackathon

- approved Reddit integration;
    
- approved LinkedIn integration;
    
- CRM and support-system connectors;
    
- team workspaces;
    
- enterprise authentication;
    
- persistent monitoring of new evidence;
    
- idea portfolio management;
    
- experiment outcome feedback loop.
    

---

# 12. Non-goals

The MVP will not:

- crawl the entire internet;
    
- guarantee an idea’s success;
    
- directly scrape Reddit or LinkedIn;
    
- bypass paywalls or platform permissions;
    
- replace legal, medical, financial, or scientific experts;
    
- generate a complete business plan;
    
- conduct original customer interviews;
    
- autonomously commit business resources;
    
- support every possible data connector;
    
- optimize for mobile;
    
- become a general-purpose document editor;
    
- provide unsupported “truth percentages.”
    

These cuts are essential for the Execution score.

---

# 13. Core end-to-end user journey

## Stage 1: Problem Hopper

The user enters:

```text
Our mid-market SaaS product loses new administrators
during setup. We cannot increase support headcount.
We need an intervention that could be shipped within
six weeks and should improve first-session activation.
```

This is the only required user input. LaunchPad infers a provisional audience, desired outcome, and research focus from the statement. Those inferences remain visible as assumptions in the final output rather than becoming another form the user must complete.
    

The factory displays:

```text
RAW PROBLEM RECEIVED
STATUS: UNREFINED
```

---

## Stage 2: Brief Refinery

LaunchPad converts the problem into:

```text
Primary audience:
Administrators at mid-market SaaS customers

Observed problem:
Users abandon setup before completing a first valuable action

Desired outcome:
Increase first-session activation

Constraints:
• six-week implementation
• no additional support headcount
• existing product architecture
• must work for non-technical admins

Open questions:
• Which setup stage creates the largest drop?
• What outcome represents “first value”?
• Are failures caused by complexity, trust, or missing information?
```

The pipeline continues automatically. The brief is recorded in the audit trail and can be inspected later; no intermediate approval is required.

---

## Stage 3: Research Planner

LaunchPad creates a focused plan across academic-mechanism and counter-evidence lanes for the autonomous P0 run. The wider data model retains first-party, customer, market, alternatives, and community lanes for future connected sources.

1. **First-party behavior**
    
2. **Customer evidence**
    
3. **Academic or mechanism evidence**
    
4. **Market and industry evidence**
    
5. **Existing alternatives and failures**
    

Each research question has:

- purpose;
    
- proposed source types;
    
- timeframe;
    
- search query;
    
- completion state.
    

Research questions are visible in the evidence graph but do not interrupt the run.

---

## Stage 4: Source Dock

Sources enter the factory as visual crates.

Possible labels:

```text
PAPER
REPORT
ANALYTICS
CUSTOMER
MARKET
COMMUNITY
COMPETITOR
INTERNAL
```

Each source record includes:

- title;
    
- source type;
    
- author or publisher;
    
- publication date;
    
- URL or document identifier;
    
- access status;
    
- extraction status;
    
- source-family identifier;
    
- user-provided versus independently retrieved status.
    

Duplicate sources are stacked rather than counted multiple times.

---

## Stage 5: Evidence Smelter

The system extracts atomic findings.

One source may produce several findings.

A finding contains:

- normalized claim;
    
- exact supporting excerpt;
    
- citation;
    
- page or section;
    
- evidence type;
    
- quantitative value;
    
- unit;
    
- population;
    
- sample size, when available;
    
- geography;
    
- timeframe;
    
- caveats;
    
- direct versus inferred status;
    
- extraction confidence.
    

Example structure:

```text
FINDING

Claim:
A significant portion of new users leave during the
integration step.

Evidence type:
First-party behavioral observation

Metric:
[retrieved value]

Population:
New administrators

Date range:
Last 90 days

Source:
Connected analytics report

Supports:
Setup complexity is a primary friction point
```

---

## Stage 6: Inspection Bay

The human or agent can:

- accept;
    
- reject;
    
- qualify;
    
- label as anecdotal;
    
- mark as outdated;
    
- mark as duplicated;
    
- add context;
    
- request a stronger source.
    

The UI shows the source and extracted finding side by side.

A finding cannot become final evidence without a valid citation object.

---

## Stage 7: Signal Sorter

Accepted findings are clustered into insights.

Example:

```text
CLUSTER 01
Users do not understand what successful setup looks like.

CLUSTER 02
Users must provide substantial configuration before
experiencing product value.

CLUSTER 03
Support requests repeat the same small set of questions.

CONFLICT
Some users prefer guided setup; others explicitly skip tutorials.
```

The agent then searches for missing or opposing evidence.

---

## Stage 8: Idea Forge

The agent generates up to three candidates.

Each candidate must include:

- target user;
    
- problem addressed;
    
- core mechanism;
    
- key user workflow;
    
- three essential capabilities;
    
- expected outcome;
    
- evidence-linked rationale;
    
- assumptions;
    
- implementation constraint;
    
- differentiation from existing approaches.
    

Ideas without sufficient support are visibly marked:

```text
EVIDENCE COVERAGE: LOW
UNSUPPORTED COMPONENTS: 2
```

---

## Stage 9: Stress Chamber

The selected idea is attacked rather than celebrated.

The system asks:

- What evidence contradicts this?
    
- Which assumptions remain untested?
    
- What population differences matter?
    
- What existing alternatives already solve this?
    
- What could make adoption fail?
    
- What could make implementation infeasible?
    
- Is the evidence describing correlation rather than cause?
    
- Is the evidence concentrated in one source family?
    
- Does the idea solve the observed behavior or merely add functionality?
    

The agent may conduct another targeted research pass.

---

## Stage 10: Blueprint Printer

The final output is produced.

```text
THE IDEA

[Idea name]

[One-sentence proposition]


WHO IT IS FOR

[Specific audience]


THE OBSERVED PROBLEM

[Evidence-linked problem statement]


THE MECHANISM

[Why this intervention may address the problem]


WHY THIS CAN WORK

[Proof card] [Proof card] [Proof card] [Proof card]


CORE DESIGN DECISIONS

Decision 1 → evidence path
Decision 2 → evidence path
Decision 3 → evidence path


COUNTER-EVIDENCE

[Contradictory findings]


WHAT MUST BE TRUE

[Critical assumptions]


WHAT TO TEST NEXT

[Smallest decisive experiment]
```

---

# 14. Final output requirements

## 14.1 Idea header

Must contain:

- memorable idea name;
    
- one-sentence concept;
    
- specific target user;
    
- desired measurable outcome;
    
- primary mechanism.
    

## 14.2 Proof Stack

Directly below the idea, show three to five large evidence cards.

Each proof card contains:

```text
[PRIMARY NUMBER OR FINDING]

Plain-language context

Population · timeframe · geography

Source name · date

Supports:
[Specific part of idea]

[Inspect evidence]
```

A number must never be shown without its denominator, population, timeframe, or relevant context where available.

## 14.3 Evidence-to-feature map

Each core feature contains a **Why this exists** control.

Selecting it highlights:

```text
Feature
→ Insight cluster
→ Accepted findings
→ Exact source excerpts
```

## 14.4 Counter-evidence panel

The final screen must show at least one of:

- contradictory finding;
    
- unresolved gap;
    
- inaccessible source;
    
- weak assumption;
    
- population mismatch.
    

A perfect-looking evidence stack will feel less credible than a transparent one.

## 14.5 Validation plan

The system outputs the smallest experiment capable of invalidating the idea.

Fields:

- hypothesis;
    
- target participant;
    
- intervention;
    
- success metric;
    
- failure threshold;
    
- expected duration;
    
- evidence that would change the recommendation.
    

---

# 15. Evidence taxonomy

Every finding must be classified.

|Category|Example|
|---|---|
|First-party behavioral|Analytics, transaction, product usage|
|Primary user evidence|Interview, survey, support ticket|
|Primary research|Original academic or institutional research|
|Secondary research|Review paper, synthesis, consulting report|
|Market signal|Search behavior, adoption data, market statistics|
|Competitor evidence|Product capability, pricing, positioning|
|Expert opinion|Specialist article or professional post|
|Community anecdote|Forum thread or public discussion|
|Derived calculation|Calculation using cited source inputs|
|Hypothesis|Proposed but not yet evidenced|
|Counter-evidence|Finding opposing the current conclusion|

The interface should never visually equate one anecdotal comment with first-party behavioral data or a well-described study.

---

# 16. Evidence quality model

Do not show a mysterious “truth score.”

Show a multidimensional evidence profile:

- **Directness:** Does the source directly address the claim?
    
- **Relevance:** Does it apply to the current audience and problem?
    
- **Recency:** Is the evidence current enough?
    
- **Method transparency:** Is the method or data origin described?
    
- **Independence:** Is it independent of other sources?
    
- **Specificity:** Does it provide actionable detail?
    
- **Context completeness:** Are timeframe, population, and geography known?
    

Each can be:

```text
STRONG
MODERATE
WEAK
UNKNOWN
```

The user can override classifications, with changes recorded in the production log.

---

# 17. Evidence quality gates

Default finalization gate:

- at least six accepted findings;
    
- at least three independent source domains;
    
- at least two source categories;
    
- at least one quantitative finding;
    
- at least one qualitative finding;
    
- at least one counter-evidence search;
    
- every final numerical claim cited;
    
- every core design decision linked to at least one accepted finding;
    
- unsupported content explicitly labelled as hypothesis.
    

These thresholds should be configurable rather than presented as universal scientific standards.

---

# 18. WebMCP tool architecture

## Core design rule

Expose both levels of control:

1. `research_and_ideate` mirrors the product’s actual one-input autonomous workflow and visibly changes the whole page.
2. Narrow tools expose the underlying research state, evidence lineage, quality gates, stress test, and export so an agent can verify or intervene without relying on an opaque wrapper.

The high-level tool proves WebMCP can operate the product as intended. The narrow tools prove that the result remains composable and auditable.

## Proposed site tools

|Tool|Type|Purpose|Visible page effect|
|---|---|---|---|
|`research_and_ideate`|Write|Runs the complete problem-to-solution workflow from the submitted statement|Factory advances through every station and the final solution appears|
|`get_foundry_state`|Read|Returns active brief, stage, counts, warnings, and selected candidate|None|
|`update_problem_brief`|Write|Adds or revises audience, outcome, constraints, or timeframe|Problem Hopper and brief panel update|
|`plan_research`|Write|Creates structured research questions and proposed source lanes|Planner station activates|
|`search_sources`|Write|Searches approved source adapters for one research question|Source crates enter factory|
|`import_source`|Write|Adds a URL, pasted excerpt, uploaded document, or connected-data result|New crate appears|
|`extract_findings`|Write|Extracts structured findings from selected sources|Findings move into Evidence Smelter|
|`review_findings`|Write|Accepts, rejects, qualifies, or labels findings|Crates move to accepted, rejected, or caution lanes|
|`get_evidence_gaps`|Read|Returns missing, weak, concentrated, or contradictory evidence areas|Gap indicators highlight|
|`synthesize_insights`|Write|Clusters accepted findings into opportunity themes|Insight modules assemble|
|`generate_idea_candidates`|Write|Creates one to three candidates using selected insights and constraints|Idea bays populate|
|`inspect_candidate`|Read|Returns candidate structure, evidence coverage, and unsupported components|Candidate opens|
|`stress_test_candidate`|Write|Searches contradictions, assumptions, alternatives, and risks|Stress chamber activates|
|`revise_candidate`|Write|Revises a candidate while preserving evidence lineage|Blueprint changes visually|
|`trace_evidence`|Read|Returns the complete proof path for an idea component|Source-to-feature graph highlights|
|`finalize_blueprint`|Write|Locks the chosen candidate into a final blueprint version|Blueprint printer activates|
|`export_blueprint`|Write|Produces a shareable report|Export link appears|

## Tool design requirements

Every tool must:

- have a narrow schema;
    
- operate on the active workspace;
    
- describe its side effects;
    
- validate inputs;
    
- be idempotent where practical;
    
- return created or modified record IDs;
    
- return enough information to verify the operation;
    
- update visible application state;
    
- write to an activity log;
    
- use read-only annotations where appropriate;
    
- avoid returning secret tokens or raw credentials.
    

## Recommended demo tool sequence

```text
research_and_ideate
get_foundry_state
inspect_candidate
trace_evidence
export_blueprint
```

The first call runs the real product. The read calls then verify the completed state and its source lineage. Judges can also invoke the narrow write tools individually to demonstrate composability.

## Registration requirement

Register tools from the top-level application page, not an embedded iframe. OpenAI’s current implementation does not discover tools registered inside iframes. Tools should call the same domain functions used by the human-facing UI. ([ChatGPT Learn](https://learn.chatgpt.com/docs/webmcp "https://learn.chatgpt.com/docs/webmcp"))

---

# 19. Human-agent responsibility model

|Responsibility|Human|Agent|Application|
|---|--:|--:|--:|
|Define original problem|Primary|Assist|Store|
|Clarify audience and constraints|Approve|Propose|Validate|
|Create research plan|Review|Primary|Render|
|Search multiple source lanes|Direct|Primary|Execute|
|Extract structured findings|Inspect|Request|Process|
|Accept or reject evidence|Primary|Recommend|Record|
|Identify contradictions|Review|Primary|Detect/render|
|Generate idea candidates|Guide|Primary|Structure/render|
|Select final idea|Primary|Advise|Persist|
|Trace evidence|Inspect|Operate|Resolve|
|Approve final blueprint|Primary|Prepare|Export|

This division must be visible in the demo.

---

# 20. Application state model

```text
EMPTY
  ↓
PROBLEM_DEFINED
  ↓
RESEARCH_PLANNED
  ↓
SOURCING
  ↓
EVIDENCE_REVIEW
  ↓
INSIGHTS_READY
  ↓
CANDIDATES_READY
  ↓
STRESS_TESTING
  ↓
BLUEPRINT_READY
  ↓
FINALIZED
```

A WebMCP tool must check whether the current state permits the requested operation.

Example:

```text
generate_idea_candidates()
```

should fail gracefully if there are no accepted findings.

Returned error:

```text
CANNOT GENERATE CANDIDATES

Required:
At least 4 accepted findings and 2 source categories.

Current:
2 accepted findings and 1 source category.
```

---

# 21. Data model

## Workspace

```text
id
owner_id
title
status
current_stage
created_at
updated_at
version
```

## ProblemBrief

```text
workspace_id
problem_type
problem_statement
target_audience
desired_outcome
current_behavior
constraints[]
geography
timeframe
excluded_approaches[]
decision_criteria[]
```

## ResearchQuestion

```text
id
workspace_id
question
purpose
priority
preferred_source_types[]
status
```

## Source

```text
id
workspace_id
source_type
title
author
publisher
published_at
url
access_mode
user_provided
content_hash
source_family_id
retrieval_status
```

## Finding

```text
id
source_id
normalized_claim
exact_excerpt
page_or_section
evidence_type
value
unit
population
sample_size
geography
timeframe
directness
caveats[]
review_status
```

## InsightCluster

```text
id
workspace_id
title
summary
finding_ids[]
contradiction_ids[]
```

## IdeaCandidate

```text
id
workspace_id
name
one_liner
target_user
problem
mechanism
workflow
features[]
expected_outcome
implementation_constraints[]
status
```

## EvidenceLink

```text
id
idea_candidate_id
idea_component_path
finding_id
relationship_type
explanation
```

## Assumption

```text
id
candidate_id
statement
importance
evidence_status
validation_method
```

## ActivityEvent

```text
id
workspace_id
actor
tool_name
input_summary
output_summary
created_at
workspace_version
```

---

# 22. Research pipeline

## 22.1 Problem parsing

Convert the raw problem into:

- audience;
    
- observed behavior;
    
- desired outcome;
    
- constraints;
    
- existing assumptions;
    
- unknowns;
    
- decision criteria.
    

## 22.2 Query planning

Produce research questions covering:

- prevalence and severity;
    
- current behavior;
    
- current workarounds;
    
- why existing solutions fail;
    
- relevant psychological or technical mechanisms;
    
- market timing;
    
- competing approaches;
    
- contradictory evidence.
    

## 22.3 Retrieval

Search one source lane at a time.

Do not issue one giant universal query.

## 22.4 Extraction

Convert sources into atomic findings.

## 22.5 Fidelity validation

For each extracted number:

- ensure the number appears in the source or is visibly derived;
    
- preserve its unit;
    
- preserve its population;
    
- preserve its timeframe;
    
- preserve qualifying language;
    
- reject unsupported transformations.
    

## 22.6 Deduplication

Detect when multiple articles repeat the same underlying study or press release.

These should appear as one source family.

## 22.7 Clustering

Group findings by underlying pattern rather than source.

## 22.8 Contradiction detection

Detect:

- opposite findings;
    
- different populations;
    
- different time periods;
    
- causal versus correlational language;
    
- different definitions of the same metric.
    

## 22.9 Candidate generation

Generate candidates only from accepted insight clusters.

## 22.10 Stress testing

Look for evidence against the candidate before finalization.

---

# 23. Source and integration strategy

This is one of the most important execution decisions.

## P0 supported sources

### Public webpages and public reports

The user or agent can:

- search through a configured search adapter;
    
- submit an accessible URL;
    
- import metadata and short relevant excerpts;
    
- retain the original URL for citation.
    

### Research papers

Use an academic metadata adapter such as Crossref for works, DOI metadata, dates, authors, journals, and related publication information. Crossref exposes a public REST API for works and associated metadata. Full text should only be processed when publicly accessible or supplied by the user. ([Crossref API](https://api.crossref.org/ "https://api.crossref.org/"))

### PDF, CSV, text, and JSON uploads

The user can upload:

- reports;
    
- research papers;
    
- interview notes;
    
- analytics exports;
    
- support-ticket exports;
    
- survey results;
    
- internal documents.
    

Uploaded sources must be marked as user-provided.

### First-party analytics

P0 should support importing a Google Analytics export as CSV.

A direct Google Analytics connector is a strong P1 feature. Google’s Data API can return customized reports using dimensions, metrics, filters, and date ranges, and supports read-only OAuth access. ([Google for Developers](https://developers.google.com/analytics/devguides/reporting/data/v1/rest/v1beta/properties/runReport "https://developers.google.com/analytics/devguides/reporting/data/v1/rest/v1beta/properties/runReport"))

### Community or professional posts

For P0:

- user pastes an excerpt;
    
- user supplies the source URL;
    
- the record is labelled `USER_PROVIDED`;
    
- the app does not claim independent retrieval.
    

## Restricted integrations

Direct Reddit access must not be a hackathon dependency. Reddit’s current policy requires explicit approval before accessing Reddit data through its API. ([Reddit Help](https://support.reddithelp.com/hc/en-us/articles/14945211791892-Developer-Platform-Accessing-Reddit-Data "https://support.reddithelp.com/hc/en-us/articles/14945211791892-Developer-Platform-Accessing-Reddit-Data"))

Direct retrieval of LinkedIn member posts must also remain outside P0. LinkedIn documents that read access to member social content is restricted and available to approved users. ([Microsoft Learn](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api?view=li-lms-2026-08 "https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api?view=li-lms-2026-08"))

Therefore:

|Source|Hackathon approach|
|---|---|
|Public reports|Direct URL or search|
|Academic metadata|Direct adapter|
|Publicly accessible papers|Direct where permitted|
|Uploaded PDFs|Direct upload|
|GA4|CSV P0; OAuth P1|
|Reddit|Manual import only|
|LinkedIn|Manual import only|
|Internal company documents|Upload|
|Consulting reports|Public URL or user upload|
|Paywalled documents|User-provided authorized copy only|

This is the correct trade-off for Execution.

---

# 24. UI and visual design

## Design direction

The interface combines two references without copying either one:

- Cubecade contributes an object-first composition: one interactive 3D object anchors the opening viewport and makes system state tangible.
    
- Willow contributes restraint: generous space, editorial sans-serif typography, quiet framing, soft lavender atmosphere, and a strong light/dark transition.
    
- LaunchPad provides the original product metaphor: a compact working factory whose seven stations represent the real evidence-to-blueprint workflow.
    
- Agent readiness and activity are explicit but subordinate to the user’s problem and current result.

The 3D factory should be smaller than Cubecade’s cube—roughly half its visual mass—so the launch brief and WebMCP explanation remain readable in the first viewport.

## Design principle

**80% clear product workflow, 20% spatial factory metaphor.**

The factory should create a memorable center of gravity without turning the workspace into a game dashboard.

---

# 25. Visual identity

## Working brand

```text
LAUNCHPAD
```

## Landing-page copy

Eyebrow:

```text
THE RESEARCH FACTORY
```

Headline:

```text
EVIDENCE IN.
DEFENSIBLE IDEAS OUT.
```

Body:

```text
Give LaunchPad a real product problem.
You and a browser agent turn scattered evidence
into one traceable, testable blueprint.
```

CTA:

```text
LOAD DEMO PROBLEM
```

Status indicator:

```text
● WEBMCP READY
```

## Color system

|Role|Suggested color|
|---|---|
|Background|Warm near-black `#0D0C12`|
|Atmosphere|Soft violet `#9587FF`|
|Secondary atmosphere|Pale lavender `#D8D3FF`|
|Light surface|Warm ivory `#F6F3ED`|
|Completed state|Soft mint `#8FFFD0`|
|Warning|Muted amber `#FFC56E`|
|Contradiction|Soft coral `#FF8174`|

## Typography

- Display and interface: spacious Geist Sans with restrained weight contrast;
    
- metadata, tool names, and compact metrics: Geist Mono;
    
- evidence and blueprint copy: readable sans-serif at comfortable line length;
    
- numeric proof cards: tabular numerals.

Monospace is a semantic cue for machine-readable details, not the overall visual identity.

---

# 26. Main workspace layout

Desktop-first, optimized for the ChatGPT side-by-side browser, with a complete stacked mobile layout.

```text
┌──────────────────────────────────────────────────────────────────┐
│ LaunchPad                 ● WebMCP ready              Activity    │
├────────────────┬────────────────────────────┬────────────────────┤
│ LAUNCH BRIEF   │    INTERACTIVE FACTORY     │ WEBMCP RUN         │
│                │                            │                    │
│ Problem        │      [7 real stations]     │ 1 Read workspace   │
│ Audience       │                            │ 2 Call typed tool  │
│ Outcome        │    orbit · select · trace  │ 3 Page updates     │
│ Constraints    │                            │ latest agent event │
├────────────────┴────────────────────────────┴────────────────────┤
│ RESEARCH WORKBENCH · evidence · candidates · blueprint           │
└──────────────────────────────────────────────────────────────────┘
                                  Activity opens as an overlay →
```

## Left: Launch brief

- problem;
    
- audience;
    
- success criteria;
    
- constraints;
    
- evidence filters;
    
- editable decision criteria.
    

## Center: Interactive factory

Source lanes feed into stations:

```text
SOURCE DOCK
    ↓
EVIDENCE SMELTER
    ↓
INSPECTION BAY
    ↓
SIGNAL SORTER
    ↓
IDEA FORGE
    ↓
STRESS CHAMBER
    ↓
BLUEPRINT PRINTER
```

Each station is selectable by pointer or keyboard. Its state and displayed metric are derived from the shared domain workspace, never from a separate demo animation.

## Right: WebMCP run rail

- plain-language three-step explanation;
    
- exact count of registered typed tools;
    
- connection state;
    
- latest real agent activity;
    
- copyable judge prompt;
    
- clear manual fallback when WebMCP is unavailable.

## Activity drawer

The full history is closed by default and opens from the header. It distinguishes human, agent, and system activity; displays the exact tool, result, status, and workspace version; supports Escape/backdrop dismissal; and restores focus to the trigger.

Example history:

Example:

```text
AGENT 19:42  searched academic sources
SYSTEM 19:42  8 sources retrieved
AGENT 19:43  extracted findings from 5 sources
HUMAN 19:44  rejected Finding F-18
SYSTEM 19:44  Candidate B evidence coverage fell to 61%
```

---

# 27. Factory visual semantics

Every visual object must have meaning.

|Visual element|Real object|
|---|---|
|Source intake|Source record|
|Conveyor packet|Extracted finding or work item|
|Evidence stacks|Accepted and pending findings|
|Red defective block|Contradictory or weak finding|
|Conveyor lane|Source category|
|Machine station|Pipeline operation|
|Blueprint sheet|Idea candidate|
|Glowing connection|Evidence link|
|Broken connection|Unsupported idea component|
|Beacon pulse|Active stage or agent operation|

When a source is removed, dependent evidence lines should fade or break.

When an idea is revised, the active station and supporting workbench should update together.

That is the key wow moment.

---

# 28. Screen states

## Empty state

Calm idle factory with the launch brief as the primary action.

Copy:

```text
THE LINE IS EMPTY.

Drop in a problem to begin.
```

## Researching

Source crates arrive incrementally.

Do not display an indefinite spinner.

## Evidence inspection

Selecting the review station and opening a finding reveals the inspection surface.

Split screen:

```text
ORIGINAL SOURCE | EXTRACTED FINDING
```

## Ideation

The idea station activates while the workbench produces three candidate blueprints.

## Stress test

The stress chamber activates and the workbench exposes counter-evidence and adoption or feasibility risks.

## Final output

The visual style becomes cleaner and more document-like while preserving factory accents.

The final idea should be easy to screenshot.

---

# 29. Motion requirements

- Tool invocation: active station and beacon pulse;
    
- source discovered: crate enters lane;
    
- extraction: crate opens into finding blocks;
    
- accepted finding: block turns cyan or lime;
    
- rejected finding: block moves to scrap lane;
    
- contradiction: red signal flashes once;
    
- idea generation: blueprint bay activates;
    
- evidence trace: upstream path lights sequentially;
    
- finalization: blueprint printer animation.
    

All animation must support reduced-motion mode.

Use a compact procedural Three.js scene with simple geometry, one renderer, conservative lighting, no wheel zoom, and complete disposal on unmount. Pause ambient movement when off-screen and disable it under reduced-motion preferences. Every pointer interaction needs a visible keyboard equivalent and a useful non-WebGL fallback.

---

# 30. Technical architecture

```text
┌─────────────────────────────────────────┐
│ ChatGPT / Codex agent                   │
│ User conversation context               │
└──────────────────┬──────────────────────┘
                   │ WebMCP
                   ▼
┌─────────────────────────────────────────┐
│ LaunchPad top-level React application│
│                                         │
│ • Factory UI                            │
│ • Workspace state                       │
│ • Evidence graph                        │
│ • Tool activity log                     │
│ • Manual controls                       │
└──────────────────┬──────────────────────┘
                   │ application services
                   ▼
┌─────────────────────────────────────────┐
│ Backend                                 │
│                                         │
│ • Research planner                      │
│ • Source adapters                       │
│ • Document parser                       │
│ • Finding extractor                     │
│ • Citation validator                    │
│ • Deduplication                         │
│ • Insight clustering                    │
│ • Candidate generator                   │
│ • Stress tester                         │
└────────────┬───────────────┬────────────┘
             │               │
             ▼               ▼
      Postgres / graph    Object storage
      workspace state     uploaded files
```

## Recommended implementation stack

- React with TypeScript;
    
- a single persistent workspace route;
    
- server-side API routes;
    
- Postgres;
    
- object storage for uploads;
    
- background job queue;
    
- server-sent events or WebSocket progress;
    
- structured model outputs;
    
- a graph visualization library;
    
- CSS/SVG factory animation;
    
- source-adapter abstraction.
    

## Why a persistent single-page workspace matters

WebMCP tools belong to the page providing them, and navigation can make tools unavailable. The main workspace should therefore remain mounted while its internal stage changes. ([ChatGPT Learn](https://learn.chatgpt.com/docs/webmcp "https://learn.chatgpt.com/docs/webmcp"))

---

# 31. Backend service boundaries

```text
ProblemService
ResearchPlanService
SourceSearchService
SourceImportService
FindingExtractionService
CitationService
EvidenceReviewService
InsightService
IdeaService
StressTestService
BlueprintService
WebMCPToolService
```

Every WebMCP tool must call one of these services.

The UI buttons must call the same services.

That ensures WebMCP is not a parallel demo-only implementation.

---

# 32. Citation integrity requirements

A citation object must include:

```text
source_id
source_title
author_or_publisher
published_date
url_or_document_id
page_or_section
exact_excerpt
retrieved_at
access_mode
```

## Quantitative claim validation

Before a number enters the final blueprint:

1. verify that the source contains the value;
    
2. verify the unit;
    
3. verify the denominator;
    
4. verify the population;
    
5. verify the timeframe;
    
6. preserve qualifying language;
    
7. mark calculations as derived.
    

If extraction confidence is low, the number is excluded until reviewed.

## Copyright-conscious display

For public sources:

- display only the shortest useful excerpt;
    
- link to the original;
    
- avoid storing or reproducing entire copyrighted reports;
    
- store full content only when user-uploaded or permitted.
    

---

# 33. Safety and security

## Source prompt injection

All retrieved documents are untrusted data.

The extraction system must:

- ignore instructions found inside source content;
    
- isolate source text from system instructions;
    
- produce strict structured output;
    
- never execute source-provided code;
    
- never follow source-provided authentication instructions.
    

## URL fetching

Protect against:

- SSRF;
    
- local-network URLs;
    
- malicious redirects;
    
- oversized files;
    
- executable content;
    
- unsupported MIME types.
    

## Private data

For Google Analytics and internal uploads:

- use read-only access;
    
- encrypt credentials;
    
- never expose tokens to WebMCP;
    
- isolate workspaces;
    
- allow connection deletion;
    
- mark private evidence clearly;
    
- exclude private sources from public exports unless approved.
    

## Tool permissions

Read tools should be annotated as read-only.

Exporting or publishing should require a clear human action.

---

# 34. Error handling

The app must have explicit states for:

- source inaccessible;
    
- source paywalled;
    
- unsupported file type;
    
- extraction failed;
    
- no exact supporting passage found;
    
- conflicting numerical values;
    
- search quota exceeded;
    
- OAuth expired;
    
- insufficient evidence;
    
- model timeout;
    
- WebMCP unavailable.
    

Example:

```text
SOURCE INACCESSIBLE

The source was discovered, but its content could not
be retrieved.

Status:
Unknown — not rejected and not accepted.

Options:
[Upload document] [Add excerpt] [Remove source]
```

Never silently transform inaccessible evidence into an unsupported verdict.

---

# 35. Direct usability

The website must remain coherent without an agent.

A human can complete the product without an agent by entering one problem statement and starting the run. LaunchPad performs the research workflow, then presents the solution, citations, counter-evidence, assumptions, and validation plan.
    

This satisfies the “complete product” requirement rather than producing a WebMCP-only technical demonstration.

WebMCP should let a browser agent start, inspect, and verify the same workflow. It must never create a separate demo-only path or add an API-key requirement.

---

# 36. Success metrics

## North-star product metric

> **Percentage of finalized idea components linked to accepted evidence.**

## Supporting metrics

- time to first evidence-backed candidate;
    
- percentage of numerical claims with complete citation context;
    
- number of source families represented;
    
- unsupported component count;
    
- contradiction count surfaced;
    
- user evidence overrides;
    
- percentage of projects with a validation experiment;
    
- blueprint export rate;
    
- return rate for revisions.
    

## Hackathon-specific reliability targets

- successful demo from a fresh session;
    
- at least 10 visible WebMCP tool calls;
    
- zero fabricated citations;
    
- every tool call reflected in the UI;
    
- final idea produced in under two minutes in demo mode;
    
- WebMCP tool success rate above 95% in the curated scenario;
    
- full video under 2 minutes 50 seconds;
    
- app usable without requiring judges to create an account.
    

---

# 37. Evaluation plan

## Citation fidelity test

For 30 extracted findings:

- exact excerpt exists;
    
- number matches;
    
- population matches;
    
- timeframe matches;
    
- source link resolves.
    

Target: 100% for demo sources.

## Evidence-link test

For each core idea component:

- linked finding is relevant;
    
- relationship explanation is understandable;
    
- removing the finding updates support status.
    

## Tool test

For each WebMCP tool:

- valid call succeeds;
    
- invalid call produces actionable error;
    
- repeated call does not create accidental duplicates;
    
- visible UI updates;
    
- activity log records the action.
    

## Adversarial tests

- source contains prompt injection;
    
- report contradicts another report;
    
- source lacks publication date;
    
- number is present but refers to a different population;
    
- multiple articles repeat one original study;
    
- user excludes a previously important source;
    
- source becomes inaccessible.
    

---

# 38. Rubric optimization

## WebMCP Leverage — target 10/10

The submission demonstrates:

- 15+ purposeful tools;
    
- meaningful read and write operations;
    
- structured inputs;
    
- a long, composable workflow;
    
- live shared application state;
    
- agent inspection of page changes;
    
- visible tool execution;
    
- manual and agent operation using the same domain logic;
    
- human intervention during the workflow;
    
- evidence tracing and verification;
    
- no one-shot wrapper tool.
    

**Judge takeaway:**

> “WebMCP is the interaction architecture, not an added button.”

---

## Execution — target 10/10

The submission includes:

- complete problem-to-blueprint journey;
    
- polished desktop UI;
    
- seeded reliable demo workspace;
    
- real citations;
    
- error handling;
    
- source inspection;
    
- final export;
    
- manual controls;
    
- persistent state;
    
- no dependency on gated Reddit or LinkedIn APIs;
    
- deployment that works in WebMCP-enabled Chrome;
    
- open-source repository and setup instructions.
    

**Judge takeaway:**

> “This is a coherent product someone could use, not a technology demonstration.”

---

## Potential Impact — target 10/10

The problem is specific:

> Teams struggle to convert fragmented public and private evidence into recommendations whose reasoning can be inspected and defended.

The audience is specific:

- product teams;
    
- innovation teams;
    
- strategy teams;
    
- consultants;
    
- founders;
    
- hackathon teams.
    

The product demonstrates actual resolution:

- research is centralized;
    
- findings are normalized;
    
- contradictions are surfaced;
    
- internal and external evidence are combined;
    
- recommendations are traceable;
    
- assumptions become visible;
    
- a validation experiment is produced.
    

**Judge takeaway:**

> “This can improve high-value decisions, not merely save a few clicks.”

---

## Creativity and Ambition — target 10/10

Distinctive concepts:

- proof-carrying ideas;
    
- a versioned evidence-to-decision graph;
    
- a research factory whose visualization represents real state;
    
- agent-generated ideas that can be debugged backward;
    
- sources dynamically affecting idea support;
    
- visible contradiction processing;
    
- the agent using the website to audit its own recommendation.
    

**Judge takeaway:**

> “I have seen AI research tools, but I have not seen ideas assembled like inspectable products with proof lineage.”

---

# 39. The mandatory wow moment

The demo must include this sequence:

1. The user types one genuine problem and clicks **Research this problem**.
    
2. The voxel factory visibly advances through planning, search, extraction, synthesis, ideation, and stress testing.
    
3. One problem-specific solution appears, not a pre-generated demo.
    
4. The page immediately shows why it may work, what can undermine it, what remains assumed, and what to test next.
    
5. The user opens a research finding and follows its DOI link.
    
6. A browser agent calls `research_and_ideate` for a second problem through WebMCP.
    
7. The activity trail proves that the agent changed the same page and produced a different evidence-backed result.
    
8. The user traces one solution feature through insight and finding to its original source.
    
This proves that the output is generated from the submitted problem, the research is not decorative, and WebMCP operates the real product rather than a separate chat experience.

---

# 40. Hackathon demo scenario

## Recommended seeded problem

> A mid-market B2B SaaS product loses new administrators during setup. The company cannot increase support headcount. It wants an intervention that can be shipped in six weeks and should improve first-session activation.

## Seeded evidence pack

- disclosed synthetic GA4 dataset;
    
- anonymized sample support-ticket export;
    
- two public research papers;
    
- one public industry report;
    
- several public product-community observations;
    
- three competitor workflow examples;
    
- one contradictory source.
    

The public sources must be genuine and inspectable.

The private company data may be synthetic but must be labelled clearly.

## Why this scenario works

It combines:

- first-party quantitative evidence;
    
- qualitative customer evidence;
    
- external research;
    
- market evidence;
    
- implementation constraints;
    
- a clear measurable outcome.
    

It also produces a visually understandable final idea.

---

# 41. Demo script — 2 minutes 20 seconds

## 0:00–0:20 — Hook and WebMCP loop

Show the launch brief, compact interactive factory, and WebMCP rail together.

Narration:

> “Teams do not lack information. They lack a visible path from information to decision. LaunchPad turns scattered evidence into an idea you can defend. This factory reflects the real research state.”

Point out the loop: the browser agent reads this workspace, calls one of 16 typed tools, and the same page updates. Copy the prepared demo prompt.

## 0:20–0:50 — WebMCP moves the product

Give the copied prompt to the browser agent. Ask it to load the seeded SaaS problem, plan research, source the curated evidence, and extract findings.

As the factory advances, show the agent calling:

- `update_problem_brief`;
    
- `plan_research`;
    
- `search_sources`;
    
- `extract_findings`.

The live WebMCP event shows intent, exact tool, and visible result.

## 0:50–1:15 — Evidence inspection and ideas

Open one numerical finding. Reveal its exact source context, population, timeframe, caveats, and synthetic-data label.

Accept the findings, synthesize insights, and generate three candidates. Show why Admin Guild initially scores 98.

## 1:15–1:40 — Evidence changes the recommendation

Say:

> “Exclude community anecdotes and optimize for a six-week enterprise implementation.”

The agent calls `review_findings`. Admin Guild falls to 50% support and First-Value Flightpath becomes the recommendation at 90.

## 1:40–2:00 — Attack, then commit

Stress-test First-Value Flightpath. Show the counter-evidence and feasibility risks, then finalize only after the quality gates pass.

## 2:00–2:20 — Proof lineage and agent proof

Click one core feature. The path lights up from:

```text
Feature
→ Insight
→ Finding
→ Exact source
```

Open **Activity** briefly to verify the actor, exact WebMCP tool, result, and workspace version, then close it and export the public-safe blueprint.

Narration:

> “Evidence in. Defensible ideas out. LaunchPad is one shared product for humans and agents, made operable by WebMCP.”

Judges may choose to rely heavily on the video, description, and images instead of fully testing every submission, so the demonstration must communicate the product independently and immediately. ([The WebMCP Challenge](https://webmcp.devpost.com/rules "https://webmcp.devpost.com/rules"))

---

# 42. Implementation plan

Given the submission deadline, build P0 before touching optional connectors.

## Day 1 — Foundation

- finalize scope;
    
- create seeded case;
    
- define data model;
    
- build workspace state machine;
    
- create visual shell;
    
- implement problem brief;
    
- establish source/finding/idea entities.
    

## Day 2 — Evidence pipeline

- URL and upload ingestion;
    
- source metadata;
    
- structured finding extraction;
    
- exact citation capture;
    
- review controls;
    
- source deduplication.
    

## Day 3 — Factory interface

- source crates;
    
- processing stations;
    
- evidence inspector;
    
- production log;
    
- progressive job events;
    
- core animations.
    

## Day 4 — WebMCP and ideation

- register tools at top-level page;
    
- connect tools to domain services;
    
- build insight clustering;
    
- generate candidates;
    
- implement evidence links;
    
- add stress testing.
    

## Day 5 — Blueprint and reliability

- final output;
    
- proof cards;
    
- trace-evidence interaction;
    
- error handling;
    
- export;
    
- seeded deterministic demo;
    
- tool-call tests.
    

## Day 6 — Submission

- Chrome WebMCP testing;
    
- deployment hardening;
    
- public repository;
    
- license;
    
- README;
    
- architecture diagram;
    
- record demo;
    
- prepare Devpost text;
    
- verify live URL.
    

OpenAI currently documents that site tools are unavailable in Edu workspaces, while the official challenge rules support testing through Chrome 149 or later with WebMCP enabled. The build and recording plan should therefore include WebMCP-enabled Chrome as the guaranteed testing path. ([ChatGPT Learn](https://learn.chatgpt.com/docs/webmcp "https://learn.chatgpt.com/docs/webmcp"))

---

# 43. Scope cuts when time is limited

Cut in this order:

1. direct Google Analytics OAuth — use CSV;
    
2. multiuser collaboration;
    
3. multiple export formats;
    
4. advanced source weighting;
    
5. automated competitor scraping;
    
6. workspace history;
    
7. multiple problem templates;
    
8. full-text academic retrieval;
    
9. source-monitoring alerts.
    

Never cut:

- WebMCP tools;
    
- evidence citations;
    
- proof lineage;
    
- human intervention;
    
- counter-evidence;
    
- final blueprint;
    
- visual factory;
    
- seeded demo reliability.
    

---

# 44. Major risks and mitigations

|Risk|Consequence|Mitigation|
|---|---|---|
|Looks like another AI research tool|Low creativity score|Lead with proof-carrying ideas and evidence lineage|
|One-shot generation|Weak WebMCP leverage|Use composable tools and visible intermediate state|
|Too many source promises|Poor execution|Restrict P0 to public web, academic metadata, uploads, and CSV|
|Citation hallucinations|Loss of trust|Exact excerpt validation and human inspection|
|Factory feels gimmicky|Judges dismiss visual design|Tie every object and animation to real state|
|External API failure|Demo breaks|Seed and cache the judging scenario|
|Confirmation bias|Weak recommendation quality|Mandatory counter-evidence stage|
|Weak ideas despite good research|Product feels anticlimactic|Curate one strong demo problem and evidence pack|
|Agent hides work in prose|WebMCP appears unnecessary|Require visible app state and evidence operations|
|Overclaiming success|Credibility damage|Say “worth testing,” not “will succeed”|
|Restricted platform data|Legal and technical risk|Manual imports only for Reddit and LinkedIn|
|Slow research jobs|Poor demo|Progressive rendering and pre-indexed demo sources|

---

# 45. Definition of done

The project is ready when all of the following are true:

## Product

- User can enter a new problem.
    
- Agent can read and update the problem through WebMCP.
    
- Agent can create a research plan.
    
- App can add at least three source types.
    
- Findings include exact citations.
    
- User can accept or reject findings.
    
- System detects at least one evidence gap or contradiction.
    
- System creates at least three candidates.
    
- One candidate can be stress-tested.
    
- Final blueprint contains proof cards.
    
- Every core component has a traceable evidence path.
    
- Blueprint includes assumptions and a validation experiment.
    
- User can export or share the output.
    

## WebMCP

- Tools register from the top-level page.
    
- At least ten tools are exercised in the demo.
    
- Read tools are marked appropriately.
    
- Write operations update visible state.
    
- Invalid calls return useful errors.
    
- Tool calls are recorded in the production log.
    
- Tools invoke the same services as manual UI actions.
    
- App works in WebMCP-enabled Chrome.
    

## Quality

- No fabricated citations.
    
- No unexplained numbers.
    
- No hidden dependency on Reddit or LinkedIn APIs.
    
- Demo scenario works repeatedly.
    
- Reduced-motion mode works.
    
- Critical interactions are keyboard accessible.
    
- Empty, loading, success, and failure states exist.
    

## Submission

- Live public URL.
    
- Public repository.
    
- Open-source license visible.
    
- Complete setup instructions.
    
- Tool inventory in README.
    
- Architecture diagram.
    
- Demo video under three minutes with audio.
    
- Devpost description explains what humans and agents can do together.
    

---

# 46. Suggested Devpost positioning

## Project title

**LaunchPad — Evidence in. Defensible ideas out.**

## One-line description

> LaunchPad is an agent-native research factory that turns messy business and customer problems into evidence-backed ideas whose features, assumptions, and claims can be traced directly to their sources.

## Why WebMCP

> Research-to-idea work requires many connected operations: framing a problem, planning research, importing sources, extracting findings, reviewing evidence, identifying gaps, generating candidates, stress-testing assumptions, and tracing final decisions back to citations. LaunchPad exposes these operations as composable WebMCP tools, allowing the user’s agent to operate the same live visual workspace while the human reviews evidence and controls judgment.

## What was difficult before

> Teams had to choose between manually coordinating dozens of tabs and documents or accepting an AI-generated recommendation whose reasoning was difficult to inspect. LaunchPad makes the entire evidence-to-idea path visible, editable, and auditable.

## Creative thesis

> The future of agent-native work is not a chatbot attached to every website. It is websites that expose structured environments where agents can assemble complex, verifiable work products alongside humans. LaunchPad applies that idea to innovation itself.

---

# 47. Final product thesis

The strongest version of the concept is not:

> “An AI that researches anything and gives you an idea.”

That sounds generic and technically unbounded.

It is:

> **A visual research foundry where humans and agents manufacture proof-carrying ideas from real evidence.**

And the final screen should not merely say:

```text
HERE IS THE IDEA
```

It should communicate:

```text
HERE IS THE IDEA.

HERE IS WHY IT IS WORTH TESTING.

HERE IS THE EVIDENCE THAT SHAPED IT.

HERE IS WHAT CONTRADICTS IT.

HERE IS WHAT MUST STILL BE TRUE.

HERE IS THE NEXT TEST.
```

That combination—**agent orchestration, evidence lineage, human judgment, a memorable factory interface, and a complete final work product**—is the path to making this concept competitive across all four judging criteria.
