export type WorkspaceStage =
  | 'EMPTY'
  | 'PROBLEM_DEFINED'
  | 'RESEARCH_PLANNED'
  | 'SOURCING'
  | 'EVIDENCE_REVIEW'
  | 'INSIGHTS_READY'
  | 'CANDIDATES_READY'
  | 'STRESS_TESTING'
  | 'BLUEPRINT_READY'
  | 'FINALIZED';

export type SourceLane =
  | 'first_party'
  | 'customer'
  | 'academic'
  | 'market'
  | 'alternatives'
  | 'community'
  | 'counter';

export type EvidenceType =
  | 'first_party_behavioral'
  | 'primary_user_evidence'
  | 'primary_research'
  | 'secondary_research'
  | 'market_signal'
  | 'competitor_evidence'
  | 'expert_opinion'
  | 'community_anecdote'
  | 'derived_calculation'
  | 'hypothesis'
  | 'counter_evidence';

export type QualityLevel = 'strong' | 'moderate' | 'weak' | 'unknown';
export type ReviewStatus = 'pending' | 'accepted' | 'rejected' | 'qualified';
export type Actor = 'human' | 'agent' | 'system';

export interface AgentConsentRequest {
  kind: 'review_evidence' | 'finalize_blueprint' | 'export_private_evidence';
  title: string;
  summary: string;
  affectedIds: string[];
  privacyScope: 'public_only' | 'includes_private';
  workspaceVersion: number;
}

export interface ProblemBrief {
  problemType: string;
  problemStatement: string;
  targetAudience: string;
  desiredOutcome: string;
  currentBehavior: string;
  constraints: string[];
  geography: string;
  timeframe: string;
  excludedApproaches: string[];
  decisionCriteria: string[];
  openQuestions: string[];
}

export interface ResearchQuestion {
  id: string;
  lane: SourceLane;
  question: string;
  purpose: string;
  priority: 'high' | 'medium' | 'low';
  preferredSourceTypes: string[];
  timeframe: string;
  query: string;
  status: 'planned' | 'searching' | 'complete';
  locked: boolean;
}

export interface Source {
  id: string;
  lane: SourceLane;
  sourceType: 'analytics' | 'customer' | 'paper' | 'report' | 'community' | 'competitor' | 'internal';
  title: string;
  author: string;
  publisher: string;
  publishedAt: string;
  url: string;
  accessMode: 'public' | 'user_provided' | 'private' | 'paywalled' | 'inaccessible';
  userProvided: boolean;
  synthetic: boolean;
  private: boolean;
  contentHash: string;
  sourceFamilyId: string;
  retrievalStatus: 'available' | 'metadata_only' | 'inaccessible';
  extractionStatus: 'pending' | 'complete' | 'failed';
  providedExcerpt?: string;
  providedExcerptKind?: 'verbatim' | 'ai_web_synthesis';
  provenance?: EvidenceProvenance;
}

export interface EvidenceProvenance {
  origin: 'public_web' | 'user_provided' | 'connected_private' | 'first_party';
  retrievedAt: string;
  retrievalMethod: 'browser_agent' | 'authorized_connector' | 'paste' | 'upload' | 'system_research';
  permissionScope?: 'public' | 'user_authorized';
}

export interface EvidenceBatchItem {
  title: string;
  sourceType: Source['sourceType'];
  lane: SourceLane;
  url?: string;
  excerpt: string;
  excerptKind?: Source['providedExcerptKind'];
  private?: boolean;
  synthetic?: boolean;
  author?: string;
  publisher?: string;
  publishedAt?: string;
  provenance: EvidenceProvenance;
}

export interface EvidencePolicy {
  allowedSourceTypes?: Source['sourceType'][];
  earliestPublishedAt?: string;
  geography?: string;
  minimumCorroboration: number;
  includePrivate: boolean;
}

export interface EvidencePolicyComparison {
  baselinePolicy: EvidencePolicy;
  proposedPolicy: EvidencePolicy;
  eligibleFindingIds: string[];
  excludedFindingIds: string[];
  baselineRanking: Array<{ candidateId: string; score: number; coverage: number }>;
  proposedRanking: Array<{ candidateId: string; score: number; coverage: number }>;
  recommendationChanged: boolean;
}

export interface EvidenceGapAction {
  lane: SourceLane;
  evidenceType: EvidenceType;
  reason: string;
  suggestedTool: 'ingest_evidence_batch' | 'search_sources';
}

export interface Citation {
  sourceId: string;
  sourceTitle: string;
  authorOrPublisher: string;
  publishedDate: string;
  urlOrDocumentId: string;
  pageOrSection: string;
  exactExcerpt: string;
  retrievedAt: string;
  accessMode: Source['accessMode'];
  evidenceOrigin?: 'verbatim_excerpt' | 'ai_web_synthesis';
}

export interface EvidenceQuality {
  directness: QualityLevel;
  relevance: QualityLevel;
  recency: QualityLevel;
  methodTransparency: QualityLevel;
  independence: QualityLevel;
  specificity: QualityLevel;
  contextCompleteness: QualityLevel;
}

export interface Finding {
  id: string;
  sourceId: string;
  normalizedClaim: string;
  evidenceType: EvidenceType;
  value?: number;
  unit?: string;
  denominator?: string;
  population: string;
  sampleSize?: number;
  geography: string;
  timeframe: string;
  direct: boolean;
  caveats: string[];
  reviewStatus: ReviewStatus;
  reviewNote?: string;
  extractionConfidence: QualityLevel;
  quality: EvidenceQuality;
  citation: Citation;
  synthetic: boolean;
}

export interface InsightCluster {
  id: string;
  title: string;
  summary: string;
  findingIds: string[];
  contradictionIds: string[];
}

export interface IdeaFeature {
  id: string;
  name: string;
  description: string;
}

export interface Assumption {
  id: string;
  statement: string;
  importance: 'critical' | 'high' | 'medium';
  evidenceStatus: 'unsupported' | 'partial' | 'supported';
  validationMethod: string;
}

export interface StressTest {
  completedAt: string;
  counterEvidenceIds: string[];
  adoptionRisks: string[];
  feasibilityRisks: string[];
  populationWarnings: string[];
}

export interface IdeaCandidate {
  id: string;
  name: string;
  oneLiner: string;
  targetUser: string;
  problem: string;
  mechanism: string;
  workflow: string[];
  features: IdeaFeature[];
  expectedOutcome: string;
  implementationConstraints: string[];
  differentiation: string;
  assumptions: Assumption[];
  coverage: number;
  score: number;
  noveltyBonus: number;
  unsupportedComponents: string[];
  status: 'candidate' | 'selected' | 'stress_tested' | 'revised';
  stressTest?: StressTest;
}

export interface IdeaCandidateProposal {
  name: string;
  oneLiner: string;
  targetUser?: string;
  problem?: string;
  mechanism: string;
  workflow?: string[];
  features: Array<{ name: string; description: string }>;
  expectedOutcome?: string;
  implementationConstraints?: string[];
  differentiation?: string;
  assumptions?: Array<{
    statement: string;
    importance?: Assumption['importance'];
    validationMethod?: string;
  }>;
}

export interface EvidenceLink {
  id: string;
  candidateId: string;
  componentPath: string;
  insightId: string;
  findingId: string;
  relationshipType: 'supports' | 'qualifies' | 'contradicts';
  explanation: string;
}

export interface ValidationPlan {
  hypothesis: string;
  targetParticipant: string;
  intervention: string;
  successMetric: string;
  failureThreshold: string;
  expectedDuration: string;
  evidenceThatChangesRecommendation: string;
}

export interface Blueprint {
  id: string;
  version: number;
  candidateId: string;
  name: string;
  proposition: string;
  targetUser: string;
  observedProblem: string;
  mechanism: string;
  proofFindingIds: string[];
  coreDecisions: Array<{ componentPath: string; decision: string; evidenceLinkIds: string[] }>;
  counterEvidenceIds: string[];
  assumptions: Assumption[];
  validationPlan: ValidationPlan;
  status: 'draft' | 'finalized';
  finalizedAt: string;
}

export interface ActivityEvent {
  id: string;
  actor: Actor;
  toolName: string;
  inputSummary: string;
  outputSummary: string;
  createdAt: string;
  workspaceVersion: number;
  status: 'success' | 'error';
}

export interface FoundryWorkspace {
  id: string;
  title: string;
  stage: WorkspaceStage;
  createdAt: string;
  updatedAt: string;
  version: number;
  problemBrief: ProblemBrief;
  researchQuestions: ResearchQuestion[];
  sources: Source[];
  findings: Finding[];
  insights: InsightCluster[];
  candidates: IdeaCandidate[];
  evidenceLinks: EvidenceLink[];
  selectedCandidateId?: string;
  blueprint?: Blueprint;
  activity: ActivityEvent[];
  activeTool?: string;
  lastError?: { code: string; message: string };
  activeEvidencePolicy?: EvidencePolicy;
}

export type ServiceSuccess<T> = {
  ok: true;
  data: T;
  message: string;
  modifiedIds: string[];
  workspaceVersion: number;
  nextActions: string[];
};

export type ServiceFailure = {
  ok: false;
  workspaceVersion: number;
  nextActions: string[];
  error: {
    code: string;
    message: string;
    required?: Record<string, number>;
    current?: Record<string, number>;
  };
};

export type ServiceResult<T> = ServiceSuccess<T> | ServiceFailure;

export interface TraceNode {
  id: string;
  kind: 'idea_component' | 'insight' | 'finding' | 'source';
  label: string;
  detail: string;
}
