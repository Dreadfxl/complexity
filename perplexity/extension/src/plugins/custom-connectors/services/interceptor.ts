/**
 * MCP Request Interceptor
 * Intercepts Perplexity requests and injects custom MCP sources
 */

interface MCPConfig {
  servers: Array<{
    name: string;
    transport: {
      type: string;
      url: string;
    };
  }>;
}

interface Settings {
  enabled: boolean;
  mcpConfigJson: string;
}

interface PerplexityPayload {
  params?: {
    sources?: string[];
    [key: string]: any;
  };
  [key: string]: any;
}

const STORAGE_KEY = 'plugins.custom-connectors';

export class MCPInterceptor {
  private originalFetch: typeof window.fetch | null = null;
  private OriginalWebSocket: typeof window.WebSocket | null = null;
  private isInitialized = false;
  private settings: Settings = { enabled: false, mcpConfigJson: '' };
  private sources: string[] = [];

  async init(): Promise<void> {
    if (this.isInitialized) return;
    
    console.log('[CustomConnectors] Initializing interceptor...');
    
    // Load current settings
    await this.loadSettings();
    
    // Update sources from config
    this.updateSourcesFromConfig();
    
    // Only patch if enabled and have sources
    if (this.settings.enabled && this.sources.length > 0) {
      this.patchNetworkAPIs();
      console.log('[CustomConnectors] Network patching active for sources:', this.sources);
    } else {
      console.log('[CustomConnectors] Interceptor disabled or no sources configured');
    }
    
    this.isInitialized = true;
    
    // Expose for debugging
    (window as any).__cplx_custom_connectors = this;
    console.log('[CustomConnectors] Interceptor initialized');
  }

  private async loadSettings(): Promise<void> {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        return new Promise((resolve) => {
          chrome.storage.local.get([STORAGE_KEY], (result) => {
            this.settings = result[STORAGE_KEY] || { enabled: false, mcpConfigJson: '' };
            resolve();
          });
        });
      } else {
        const stored = localStorage.getItem(STORAGE_KEY);
        this.settings = stored ? JSON.parse(stored) : { enabled: false, mcpConfigJson: '' };
      }
    } catch (error) {
      console.error('[CustomConnectors] Failed to load settings:', error);
      this.settings = { enabled: false, mcpConfigJson: '' };
    }
  }

  private updateSourcesFromConfig(): void {
    try {
      if (!this.settings.mcpConfigJson.trim()) {
        this.sources = [];
        return;
      }
      
      const config: MCPConfig = JSON.parse(this.settings.mcpConfigJson);
      if (config.servers && Array.isArray(config.servers)) {
        this.sources = config.servers.map(server => server.name).filter(Boolean);
      } else {
        this.sources = [];
      }
    } catch (error) {
      console.error('[CustomConnectors] Failed to parse MCP config:', error);
      this.sources = [];
    }
  }

  private patchNetworkAPIs(): void {
    this.patchFetch();
    this.patchWebSocket();
  }

  private patchFetch(): void {
    if (this.originalFetch) return; // Already patched
    
    this.originalFetch = window.fetch;
    const self = this;
    
    window.fetch = async function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      
      // Check if this is a Perplexity API call
      if (self.isPerplexityAPICall(url) && init?.body && typeof init.body === 'string') {
        const modifiedBody = self.modifyPayload(init.body);
        if (modifiedBody) {
          console.log('[CustomConnectors] Intercepted and modified fetch request to:', url);
          return self.originalFetch!.call(this, input, { ...init, body: modifiedBody });
        }
      }
      
      return self.originalFetch!.call(this, input, init);
    };
  }

  private patchWebSocket(): void {
    if (this.OriginalWebSocket) return; // Already patched
    
    this.OriginalWebSocket = window.WebSocket;
    const self = this;
    
    window.WebSocket = class extends self.OriginalWebSocket! {
      constructor(url: string | URL, protocols?: string | string[]) {
        super(url, protocols);
        
        if (self.isPerplexityAPICall(url.toString())) {
          const originalSend = this.send;
          
          this.send = function(data: string | ArrayBufferLike | Blob | ArrayBufferView) {
            if (typeof data === 'string') {
              const modifiedData = self.modifyPayload(data);
              if (modifiedData) {
                console.log('[CustomConnectors] Intercepted and modified WebSocket message');
                return originalSend.call(this, modifiedData);
              }
            }
            return originalSend.call(this, data);
          };
        }
      }
    };
  }

  private isPerplexityAPICall(url: string): boolean {
    return url.includes('perplexity.ai') && 
           (url.includes('/socket.io/') || url.includes('/api/') || url.includes('/copilot'));
  }

  private modifyPayload(data: string): string | null {
    try {
      const payload: PerplexityPayload = JSON.parse(data);
      
      if (!payload.params) return null;
      if (!Array.isArray(payload.params.sources)) {
        payload.params.sources = [];
      }
      
      const originalSources = [...payload.params.sources];
      
      // Add our custom sources
      for (const source of this.sources) {
        if (!payload.params.sources.includes(source)) {
          payload.params.sources.push(source);
        }
      }
      
      // Only return modified payload if we actually changed something
      if (JSON.stringify(originalSources) !== JSON.stringify(payload.params.sources)) {
        console.log('[CustomConnectors] Injected sources:', {
          before: originalSources,
          after: payload.params.sources
        });
        return JSON.stringify(payload);
      }
      
      return null; // No changes needed
    } catch (error) {
      console.debug('[CustomConnectors] Failed to parse payload as JSON:', error);
      return null;
    }
  }

  // Public methods for settings UI
  getSettings(): Settings {
    return { ...this.settings };
  }

  async updateSettings(newSettings: Partial<Settings>): Promise<void> {
    this.settings = { ...this.settings, ...newSettings };
    this.updateSourcesFromConfig();
    
    // Re-patch if needed
    if (this.settings.enabled && this.sources.length > 0 && !this.originalFetch) {
      this.patchNetworkAPIs();
    }
  }
}

export const mcpInterceptor = new MCPInterceptor();