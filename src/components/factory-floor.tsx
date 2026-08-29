import type { FoundryWorkspace } from '../domain/types';

const stations = [
  { key: 'source', number: '01', name: 'SOURCE DOCK', active: ['SOURCING'], threshold: 3 },
  { key: 'extract', number: '02', name: 'EVIDENCE SMELTER', active: ['EVIDENCE_REVIEW'], threshold: 4 },
  { key: 'review', number: '03', name: 'INSPECTION BAY', active: ['EVIDENCE_REVIEW'], threshold: 4 },
  { key: 'insight', number: '04', name: 'SIGNAL SORTER', active: ['INSIGHTS_READY'], threshold: 5 },
  { key: 'candidate', number: '05', name: 'IDEA FORGE', active: ['CANDIDATES_READY'], threshold: 6 },
  { key: 'stress', number: '06', name: 'STRESS CHAMBER', active: ['STRESS_TESTING'], threshold: 7 },
  { key: 'blueprint', number: '07', name: 'BLUEPRINT PRINTER', active: ['FINALIZED'], threshold: 8 },
];

const stageIndex: Record<FoundryWorkspace['stage'], number> = {
  EMPTY: 0, PROBLEM_DEFINED: 1, RESEARCH_PLANNED: 2, SOURCING: 3, EVIDENCE_REVIEW: 4,
  INSIGHTS_READY: 5, CANDIDATES_READY: 6, STRESS_TESTING: 7, BLUEPRINT_READY: 8, FINALIZED: 8,
};

export function FactoryFloor({ workspace }: { workspace: FoundryWorkspace }) {
  const index = stageIndex[workspace.stage];
  const rejected = workspace.findings.filter((finding) => finding.reviewStatus === 'rejected').length;
  return (
    <section className="factory-floor" aria-label="Factory floor">
      <div className="factory-coordinate" aria-hidden="true">FLOOR_01 / STATE:{workspace.stage}</div>
      {workspace.stage === 'EMPTY' ? (
        <div className="factory-empty">
          <p className="empty-kicker">PRODUCTION STATUS / STANDBY</p>
          <h1>THE LINE IS EMPTY.</h1>
          <p>Drop in a real problem. The factory will turn scattered signals into a proof-carrying idea.</p>
        </div>
      ) : (
        <div className="factory-live">
          <div className="live-header">
            <span>LIVE WORKSPACE / {workspace.title}</span>
            <strong>{workspace.stage.replaceAll('_', ' ')}</strong>
          </div>
          <div className="evidence-lanes" aria-label="Evidence moving through the foundry">
            <div className="lane-labels"><span>FIRST PARTY</span><span>RESEARCH</span><span>MARKET</span><span>COMMUNITY</span></div>
            <div className="crate-line">
              {workspace.sources.slice(0, 12).map((source, sourceIndex) => (
                <button className="source-crate" data-type={source.sourceType} key={source.id} type="button" title={source.title} style={{ '--crate-delay': `${sourceIndex * 35}ms` } as React.CSSProperties}>
                  <span>{source.sourceType.slice(0, 3).toUpperCase()}</span>
                  <small>{String(sourceIndex + 1).padStart(2, '0')}</small>
                </button>
              ))}
              {workspace.sources.length === 0 && <span className="empty-conveyor">AWAITING SOURCE CRATES</span>}
            </div>
          </div>
          <div className="signal-readout">
            <span>{workspace.findings.length} finding blocks cast</span>
            <span>{workspace.insights.length} signal clusters assembled</span>
            <span className={rejected ? 'signal-rejected' : ''}>{rejected} weak signals scrapped</span>
          </div>
        </div>
      )}
      <div className="station-line" aria-label="Research production stages">
        {stations.map((station, stationIndex) => {
          const status = index > station.threshold ? 'complete' : station.active.includes(workspace.stage) ? 'active' : index === station.threshold ? 'ready' : 'idle';
          return (
            <div className="station-wrap" key={station.name}>
              <article className="station" data-state={status}>
                <span className="station-number">{station.number}</span>
                <div className="machine" aria-hidden="true">
                  <span className="machine-cap" />
                  <span className="machine-window" />
                  <span className="machine-base" />
                </div>
                <strong>{station.name}</strong>
                <small>{status.toUpperCase()}</small>
              </article>
              {stationIndex < stations.length - 1 && <span className="conveyor" aria-hidden="true">···›</span>}
            </div>
          );
        })}
      </div>
      <div className="floor-axis" aria-hidden="true"><span>RAW SIGNALS</span><span>EVIDENCE</span><span>DECISION</span></div>
    </section>
  );
}
