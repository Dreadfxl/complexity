import type { SourceMapping, SourceContribution } from "../types";

/**
 * Analyzes the DOM structure to identify source-to-text mappings
 */
export function analyzeSourceMappings(messageElement: Element): SourceMapping[] {
  const mappings: SourceMapping[] = [];
  
  // Find all source citations in the message
  const sourceCitations = messageElement.querySelectorAll('[data-testid*="citation"], a[href*="#citation"], [class*="citation"]');
  const sourceElements = Array.from(sourceCitations).filter(el => {
    const text = el.textContent?.trim() || '';
    return /\[\d+\]/.test(text);
  });

  // Find all text content paragraphs
  const textElements = messageElement.querySelectorAll('p, div[class*="text"], span[class*="content"]');
  
  sourceElements.forEach((sourceEl, sourceIndex) => {
    const sourceText = sourceEl.textContent?.trim() || '';
    const sourceMatch = sourceText.match(/\[(\d+)\]/);
    
    if (!sourceMatch) return;
    
    const sourceId = sourceMatch[1];
    
    // Try to find nearby text that might be related to this source
    const sourceRect = sourceEl.getBoundingClientRect();
    
    textElements.forEach((textEl, textIndex) => {
      if (textEl.contains(sourceEl) || sourceEl.contains(textEl)) return;
      
      const textRect = textEl.getBoundingClientRect();
      const distance = Math.sqrt(
        Math.pow(sourceRect.left - textRect.left, 2) + 
        Math.pow(sourceRect.top - textRect.top, 2)
      );
      
      // If text is relatively close to source, consider it related
      if (distance < 500) {
        const textId = `text-${textIndex}-${Date.now()}`;
        textEl.setAttribute('data-sf-text-id', textId);
        
        mappings.push({
          textId,
          sourceId,
          confidence: Math.max(0.1, 1 - (distance / 500)),
          textContent: textEl.textContent?.trim() || '',
          sourceElement: sourceEl as HTMLElement,
          textElement: textEl as HTMLElement,
        });
      }
    });
  });

  // Enhance mappings with semantic analysis
  return enhanceMappingsWithSemantics(mappings);
}

/**
 * Enhances mappings using semantic analysis and keyword matching
 */
function enhanceMappingsWithSemantics(mappings: SourceMapping[]): SourceMapping[] {
  return mappings.map(mapping => {
    // Try to find source preview text for better matching
    const sourcePreview = findSourcePreviewText(mapping.sourceElement);
    
    if (sourcePreview) {
      const semanticScore = calculateSemanticSimilarity(
        mapping.textContent,
        sourcePreview
      );
      
      return {
        ...mapping,
        confidence: Math.min(1, mapping.confidence + semanticScore * 0.3),
        sourcePreview,
      };
    }
    
    return mapping;
  });
}

/**
 * Finds preview text associated with a source element
 */
function findSourcePreviewText(sourceElement: HTMLElement): string | undefined {
  // Look for tooltip or preview content
  const tooltipSelectors = [
    '[role="tooltip"]',
    '[data-tooltip]',
    '.tooltip',
    '[title]',
    '[aria-label]'
  ];
  
  for (const selector of tooltipSelectors) {
    const tooltipEl = sourceElement.querySelector(selector) || 
                     sourceElement.closest('[data-testid*="source"]')?.querySelector(selector);
    
    if (tooltipEl) {
      const text = tooltipEl.getAttribute('title') || 
                  tooltipEl.getAttribute('aria-label') || 
                  tooltipEl.textContent;
      
      if (text && text.trim().length > 20) {
        return text.trim();
      }
    }
  }
  
  return undefined;
}

/**
 * Calculates semantic similarity between two text strings
 */
function calculateSemanticSimilarity(text1: string, text2: string): number {
  if (!text1 || !text2) return 0;
  
  const words1 = text1.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const words2 = text2.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  
  if (words1.length === 0 || words2.length === 0) return 0;
  
  const commonWords = words1.filter(word => words2.includes(word));
  const similarityScore = commonWords.length / Math.max(words1.length, words2.length);
  
  return similarityScore;
}

/**
 * Calculates contribution scores for each source
 */
export function calculateContributionScores(mappings: SourceMapping[]): SourceContribution[] {
  const sourceGroups = mappings.reduce((acc, mapping) => {
    if (!acc[mapping.sourceId]) {
      acc[mapping.sourceId] = [];
    }
    acc[mapping.sourceId].push(mapping);
    return acc;
  }, {} as Record<string, SourceMapping[]>);
  
  const totalMappings = mappings.length;
  
  return Object.entries(sourceGroups).map(([sourceId, sourceMappings]) => {
    const weightedCount = sourceMappings.reduce((sum, mapping) => {
      return sum + mapping.confidence;
    }, 0);
    
    const percentage = totalMappings > 0 ? (weightedCount / totalMappings) * 100 : 0;
    
    return {
      sourceId,
      percentage,
      textSegments: sourceMappings.length,
      avgConfidence: weightedCount / sourceMappings.length,
    };
  }).sort((a, b) => b.percentage - a.percentage);
}