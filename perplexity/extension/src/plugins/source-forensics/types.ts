export interface SourceForensicsSettings {
  enabled: boolean;
  showContributionScore: boolean;
  enableVisualSourceMap: boolean;
  highlightColor: string;
  contributionScoreThreshold: number;
}

export interface SourceMapping {
  textId: string;
  sourceId: string;
  confidence: number;
  textContent: string;
  sourceElement: HTMLElement;
  textElement: HTMLElement;
  sourcePreview?: string;
}

export interface SourceContribution {
  sourceId: string;
  percentage: number;
  textSegments: number;
  avgConfidence: number;
}