import { mcpInterceptor } from '@/plugins/custom-connectors/services/interceptor';

export default defineBackground(() => {
  console.log('[Background] Service worker starting...');
  
  // Initialize the MCP interceptor in the background context
  void mcpInterceptor.init();
  
  // Handle messages from the settings page
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('[Background] Received message:', message);
    
    if (message.type === 'TEST_MCP_CONNECTION') {
      handleTestConnection(message.data)
        .then(result => {
          console.log('[Background] Test connection result:', result);
          sendResponse({ success: true, data: result });
        })
        .catch(error => {
          console.error('[Background] Test connection error:', error);
          sendResponse({ 
            success: false, 
            error: error.message || 'Connection failed' 
          });
        });
      
      // Return true to indicate we will respond asynchronously
      return true;
    }
    
    if (message.type === 'GET_MCP_STATUS') {
      const status = mcpInterceptor.getStatus();
      sendResponse({ success: true, data: status });
      return true;
    }
  });
});

/**
 * Test connection to an MCP server from the privileged background context
 */
async function handleTestConnection(config: {
  url: string;
  name: string;
}): Promise<{ status: string; message: string }> {
  try {
    console.log('[Background] Testing connection to:', config.url);
    
    const testPayload = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'ping',
      params: {}
    };
    
    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload),
    });
    
    if (response.ok) {
      const responseData = await response.text();
      console.log('[Background] Server responded:', responseData);
      
      return {
        status: 'success',
        message: `Connection successful to ${config.name}`
      };
    } else {
      return {
        status: 'error',
        message: `Server returned ${response.status}: ${response.statusText}`
      };
    }
  } catch (error) {
    console.error('[Background] Connection test failed:', error);
    
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}