import type { FoundryWorkspace } from '../domain/types';

export function CandidateForge({ workspace }: { workspace: FoundryWorkspace }) {
  const selected = workspace.selectedCandidateId;
  return (
    <section className="candidate-forge" aria-label="Idea candidates">
      <div className="section-readout"><span>STATION 05 / IDEA FORGE</span><strong>THREE INTERVENTIONS ASSEMBLED FROM ACCEPTED SIGNALS</strong></div>
      <div className="candidate-grid">
        {workspace.candidates.map((candidate, index) => (
          <article className="candidate-card" data-selected={candidate.id === selected} data-testid={`candidate-${candidate.id}`} key={candidate.id}>
            <header><span>CANDIDATE {String.fromCharCode(65 + index)}</span><strong>{candidate.id === selected ? `RECOMMENDED / ${candidate.score}` : `SCORE / ${candidate.score}`}</strong></header>
            <h2>{candidate.name}</h2>
            <p>{candidate.oneLiner}</p>
            <div className="candidate-coverage"><span>EVIDENCE COVERAGE</span><strong>{candidate.coverage}%</strong><i><span style={{ width: `${candidate.coverage}%` }} /></i></div>
            <ul>{candidate.features.map((feature) => <li key={feature.id}><strong>{feature.name}</strong><span>{feature.description}</span></li>)}</ul>
            <footer>
              <span>{candidate.unsupportedComponents.length} unsupported</span>
              <span>{workspace.evidenceLinks.filter((link) => link.candidateId === candidate.id).length} proof links</span>
            </footer>
          </article>
        ))}
      </div>
      {workspace.findings.some((finding) => finding.evidenceType === 'community_anecdote' && finding.reviewStatus === 'accepted') && (
        <div className="weak-evidence-alert"><span>WEAK SIGNAL DEPENDENCY</span><strong>Candidate A currently relies on two synthetic community anecdotes. Remove them to test recommendation stability.</strong></div>
      )}
    </section>
  );
}
