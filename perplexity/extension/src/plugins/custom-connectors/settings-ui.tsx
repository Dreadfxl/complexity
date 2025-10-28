import React, { useState, useEffect } from 'react';

export const pluginId = 'custom-connectors';

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

const STORAGE_KEY = 'plugins.custom-connectors';

export default function CustomConnectorsSettings() {
  const [enabled, setEnabled] = useState(false);
  const [configJson, setConfigJson] = useState('');
  const [testStatus, setTestStatus] = useState('');
  const [saveStatus, setSaveStatus] = useState('');

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        chrome.storage.local.get([STORAGE_KEY], (result) => {
          const settings = result[STORAGE_KEY] as Settings | undefined;
          if (settings) {
            setEnabled(settings.enabled);
            setConfigJson(settings.mcpConfigJson);
          }
        });
      } else {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const settings = JSON.parse(stored) as Settings;
          setEnabled(settings.enabled);
          setConfigJson(settings.mcpConfigJson);
        }
      }
    } catch (error) {
      console.error('[CustomConnectors] Failed to load settings:', error);
    }
  };

  const saveSettings = async (newSettings: Partial<Settings>) => {
    const settings: Settings = {
      enabled,
      mcpConfigJson: configJson,
      ...newSettings,
    };

    try {
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        chrome.storage.local.set({ [STORAGE_KEY]: settings });
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      }
      setSaveStatus('Saved successfully!');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (error) {
      console.error('[CustomConnectors] Failed to save settings:', error);
      setSaveStatus('Failed to save settings');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  const handleToggle = (newEnabled: boolean) => {
    setEnabled(newEnabled);
    saveSettings({ enabled: newEnabled });
  };

  const handleConfigChange = (newConfig: string) => {
    setConfigJson(newConfig);
  };

  const handleSave = () => {
    try {
      // Validate JSON before saving
      JSON.parse(configJson);
      saveSettings({ mcpConfigJson: configJson });
    } catch (error) {
      setSaveStatus('Error: Invalid JSON format');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  const testConnection = async () => {
    setTestStatus('Testing...');
    
    try {
      const config: MCPConfig = JSON.parse(configJson);
      
      if (!config.servers || config.servers.length === 0) {
        setTestStatus('Error: No servers configured');
        setTimeout(() => setTestStatus(''), 3000);
        return;
      }

      const server = config.servers[0]; // Test first server
      const testPayload = {
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'health_check',
        params: {}
      };

      console.log('[CustomConnectors] Testing connection to:', server.transport.url);
      console.log('[CustomConnectors] Test payload:', testPayload);

      const response = await fetch(server.transport.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload),
      });

      const responseData = await response.text();
      console.log('[CustomConnectors] Server response:', responseData);

      if (response.ok) {
        setTestStatus(`✓ Connection successful to ${server.name}`);
      } else {
        setTestStatus(`✗ Server error: ${response.status}`);
      }
    } catch (error) {
      console.error('[CustomConnectors] Test connection failed:', error);
      setTestStatus(`✗ Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    setTimeout(() => setTestStatus(''), 5000);
  };

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Custom Connectors (MCP)</h2>
        <p className="text-gray-600 text-sm">
          Inject custom Model Context Protocol servers into Perplexity AI requests.
        </p>
      </div>

      {/* Enable/Disable Toggle */}
      <div className="mb-6">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => handleToggle(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <span className="font-medium">Enable Custom Connector Injection</span>
        </label>
        <p className="text-xs text-gray-500 mt-1 ml-7">
          When enabled, your custom MCP sources will be added to Perplexity's requests
        </p>
      </div>

      {/* JSON Configuration */}
      <div className="mb-6">
        <label className="block font-medium mb-2">MCP Server Configuration (JSON)</label>
        <textarea
          value={configJson}
          onChange={(e) => handleConfigChange(e.target.value)}
          placeholder={`Example:\n{\n  "servers": [\n    {\n      "name": "chrome-devtools",\n      "transport": {\n        "type": "http",\n        "url": "http://localhost:8080/mcp"\n      }\n    }\n  ]\n}`}
          className="w-full h-48 p-3 border border-gray-300 rounded-md font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Save Configuration
        </button>
        <button
          onClick={testConnection}
          disabled={!configJson.trim()}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        >
          Test Connection
        </button>
      </div>

      {/* Status Messages */}
      {saveStatus && (
        <div className={`mb-4 p-3 rounded-md text-sm ${saveStatus.includes('Error') || saveStatus.includes('Failed') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {saveStatus}
        </div>
      )}

      {testStatus && (
        <div className={`mb-4 p-3 rounded-md text-sm ${testStatus.includes('✗') || testStatus.includes('Error') || testStatus.includes('failed') ? 'bg-red-50 text-red-700' : testStatus.includes('Testing') ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}`}>
          {testStatus}
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 p-4 rounded-md">
        <h3 className="font-medium text-blue-900 mb-2">How to use:</h3>
        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          <li>Start your MCP server (e.g., <code className="bg-blue-100 px-1 rounded">npx -y chrome-devtools-mcp@latest</code>)</li>
          <li>Paste the server configuration JSON above</li>
          <li>Click <strong>"Test Connection"</strong> to verify it works</li>
          <li>Enable the toggle and save configuration</li>
          <li>Visit Perplexity AI and perform searches to see custom tools in action</li>
        </ol>
      </div>
    </div>
  );
}