/**
 * Types for the Contextual Collections plugin
 */

export interface Collection {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  threads: ThreadData[];
  synthesizedContext?: string;
  tags: string[];
  color?: string;
}

export interface ThreadData {
  id: string;
  url: string;
  title: string;
  content: string;
  addedAt: Date;
  summary?: string;
  keyPoints?: string[];
}

export interface CollectionSettings {
  enabled: boolean;
  showAddButton: boolean;
  autoSynthesis: boolean;
  maxCollections: number;
  synthesisMethod: 'summarize' | 'extract-key-points' | 'build-context';
}

export interface CollectionStore {
  collections: Collection[];
  activeCollectionId?: string;
  settings: CollectionSettings;
}

export interface SynthesisResult {
  context: string;
  keyThemes: string[];
  suggestedQueries: string[];
}

export interface AddToCollectionButton {
  threadId: string;
  threadUrl: string;
  threadTitle: string;
}