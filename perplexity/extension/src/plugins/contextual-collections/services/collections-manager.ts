/**
 * Collections Manager Service
 * Handles CRUD operations for Collections and thread management
 */

import type {
  Collection,
  ThreadData,
  CollectionStore,
  SynthesisResult,
  CollectionSettings
} from '../types';

const STORAGE_KEY = 'contextual-collections';
const MAX_CONTENT_LENGTH = 50000; // Limit content size for storage

export class CollectionsManager {
  private store: CollectionStore = {
    collections: [],
    settings: {
      enabled: true,
      showAddButton: true,
      autoSynthesis: true,
      maxCollections: 10,
      synthesisMethod: 'build-context'
    }
  };

  constructor() {
    this.loadFromStorage();
  }

  // Storage operations
  private async loadFromStorage(): Promise<void> {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        const result = await chrome.storage.local.get(STORAGE_KEY);
        if (result[STORAGE_KEY]) {
          this.store = { ...this.store, ...result[STORAGE_KEY] };
        }
      } else {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          this.store = { ...this.store, ...JSON.parse(stored) };
        }
      }
    } catch (error) {
      console.error('[ContextualCollections] Failed to load from storage:', error);
    }
  }

  private async saveToStorage(): Promise<void> {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        await chrome.storage.local.set({ [STORAGE_KEY]: this.store });
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.store));
      }
    } catch (error) {
      console.error('[ContextualCollections] Failed to save to storage:', error);
    }
  }

  // Collection CRUD operations
  async createCollection(name: string, description?: string): Promise<Collection> {
    if (this.store.collections.length >= this.store.settings.maxCollections) {
      throw new Error(`Maximum of ${this.store.settings.maxCollections} collections allowed`);
    }

    const collection: Collection = {
      id: this.generateId(),
      name,
      description,
      createdAt: new Date(),
      updatedAt: new Date(),
      threads: [],
      tags: [],
    };

    this.store.collections.push(collection);
    await this.saveToStorage();
    console.log('[ContextualCollections] Created collection:', collection.name);
    return collection;
  }

  async deleteCollection(collectionId: string): Promise<void> {
    this.store.collections = this.store.collections.filter(c => c.id !== collectionId);
    if (this.store.activeCollectionId === collectionId) {
      this.store.activeCollectionId = undefined;
    }
    await this.saveToStorage();
    console.log('[ContextualCollections] Deleted collection:', collectionId);
  }

  async updateCollection(collectionId: string, updates: Partial<Collection>): Promise<Collection | null> {
    const collection = this.store.collections.find(c => c.id === collectionId);
    if (!collection) return null;

    Object.assign(collection, updates, { updatedAt: new Date() });
    await this.saveToStorage();
    return collection;
  }

  getCollection(collectionId: string): Collection | null {
    return this.store.collections.find(c => c.id === collectionId) || null;
  }

  getAllCollections(): Collection[] {
    return [...this.store.collections];
  }

  // Thread operations
  async addThreadToCollection(
    collectionId: string,
    threadUrl: string,
    threadTitle: string,
    threadContent: string
  ): Promise<boolean> {
    const collection = this.getCollection(collectionId);
    if (!collection) return false;

    // Check if thread already exists in collection
    if (collection.threads.some(t => t.url === threadUrl)) {
      console.warn('[ContextualCollections] Thread already exists in collection');
      return false;
    }

    const threadData: ThreadData = {
      id: this.generateId(),
      url: threadUrl,
      title: threadTitle,
      content: this.truncateContent(threadContent),
      addedAt: new Date(),
    };

    collection.threads.push(threadData);
    collection.updatedAt = new Date();

    // Auto-synthesize if enabled
    if (this.store.settings.autoSynthesis) {
      await this.synthesizeCollectionContext(collectionId);
    }

    await this.saveToStorage();
    console.log('[ContextualCollections] Added thread to collection:', threadTitle);
    return true;
  }

  async removeThreadFromCollection(collectionId: string, threadId: string): Promise<void> {
    const collection = this.getCollection(collectionId);
    if (!collection) return;

    collection.threads = collection.threads.filter(t => t.id !== threadId);
    collection.updatedAt = new Date();

    // Re-synthesize after removal if auto-synthesis is enabled
    if (this.store.settings.autoSynthesis && collection.threads.length > 0) {
      await this.synthesizeCollectionContext(collectionId);
    } else if (collection.threads.length === 0) {
      collection.synthesizedContext = undefined;
    }

    await this.saveToStorage();
  }

  // Context synthesis
  async synthesizeCollectionContext(collectionId: string): Promise<SynthesisResult | null> {
    const collection = this.getCollection(collectionId);
    if (!collection || collection.threads.length === 0) return null;

    try {
      const synthesis = await this.performSynthesis(collection);
      collection.synthesizedContext = synthesis.context;
      collection.updatedAt = new Date();
      await this.saveToStorage();
      
      console.log('[ContextualCollections] Synthesized context for collection:', collection.name);
      return synthesis;
    } catch (error) {
      console.error('[ContextualCollections] Synthesis failed:', error);
      return null;
    }
  }

  private async performSynthesis(collection: Collection): Promise<SynthesisResult> {
    // This is a simplified synthesis - in a full implementation,
    // this could call an AI service for more sophisticated analysis
    const allContent = collection.threads.map(t => `${t.title}: ${t.content}`).join('\n\n');
    const method = this.store.settings.synthesisMethod;

    let context = '';
    const keyThemes: string[] = [];
    const suggestedQueries: string[] = [];

    switch (method) {
      case 'summarize':
        context = `Research collection "${collection.name}" contains ${collection.threads.length} related threads exploring: ${collection.threads.map(t => t.title).join(', ')}.`;
        break;
      
      case 'extract-key-points':
        context = `Key research areas from "${collection.name}":\n${collection.threads.map((t, i) => `${i + 1}. ${t.title}`).join('\n')}`;
        keyThemes.push(...collection.threads.map(t => this.extractMainTopic(t.title)));
        break;
      
      case 'build-context':
      default:
        context = `Based on my research in the "${collection.name}" collection (${collection.threads.length} threads), I have explored: ${collection.threads.map(t => t.title).join(', ')}. This context should inform the following query:`;
        keyThemes.push(...collection.threads.map(t => this.extractMainTopic(t.title)));
        suggestedQueries.push(
          `Compare the main approaches discussed in my ${collection.name} research`,
          `What are the key trade-offs between the options I've explored?`,
          `Based on my research, what would be the best approach for...`
        );
        break;
    }

    return { context, keyThemes: [...new Set(keyThemes)], suggestedQueries };
  }

  private extractMainTopic(title: string): string {
    // Simple topic extraction - could be enhanced with NLP
    const words = title.toLowerCase().split(' ');
    return words.find(word => word.length > 4) || words[0] || 'topic';
  }

  // Settings management
  async updateSettings(settings: Partial<CollectionSettings>): Promise<void> {
    this.store.settings = { ...this.store.settings, ...settings };
    await this.saveToStorage();
  }

  getSettings(): CollectionSettings {
    return { ...this.store.settings };
  }

  // Active collection management
  setActiveCollection(collectionId?: string): void {
    this.store.activeCollectionId = collectionId;
    this.saveToStorage();
  }

  getActiveCollection(): Collection | null {
    return this.store.activeCollectionId 
      ? this.getCollection(this.store.activeCollectionId)
      : null;
  }

  // Utility methods
  private generateId(): string {
    return `coll_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private truncateContent(content: string): string {
    return content.length > MAX_CONTENT_LENGTH 
      ? content.substring(0, MAX_CONTENT_LENGTH) + '...'
      : content;
  }

  // Search and filtering
  searchCollections(query: string): Collection[] {
    const lowercaseQuery = query.toLowerCase();
    return this.store.collections.filter(collection => 
      collection.name.toLowerCase().includes(lowercaseQuery) ||
      collection.description?.toLowerCase().includes(lowercaseQuery) ||
      collection.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
      collection.threads.some(thread => 
        thread.title.toLowerCase().includes(lowercaseQuery)
      )
    );
  }

  getCollectionsByTag(tag: string): Collection[] {
    return this.store.collections.filter(c => c.tags.includes(tag));
  }

  getAllTags(): string[] {
    const allTags = this.store.collections.flatMap(c => c.tags);
    return [...new Set(allTags)];
  }
}

export const collectionsManager = new CollectionsManager();