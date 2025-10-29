import React, { useEffect, useState, useCallback } from "react";
import { Eye, EyeOff, Map, Info } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import type { SourceForensicsSettings, SourceMapping, SourceContribution } from "../types";
import { analyzeSourceMappings, calculateContributionScores } from "../utils/analyzer";
import { VisualSourceMap } from "./VisualSourceMap";

interface Props {
  settings: SourceForensicsSettings;
}

export function SourceForensicsAnalyzer({ settings }: Props) {
  const [isActive, setIsActive] = useState(false);
  const [showVisualMap, setShowVisualMap] = useState(false);
  const [sourceMappings, setSourceMappings] = useState<SourceMapping[]>([]);
  const [contributionScores, setContributionScores] = useState<SourceContribution[]>([]);
  const [highlightedSource, setHighlightedSource] = useState<string | null>(null);
  const [highlightedText, setHighlightedText] = useState<string | null>(null);

  const analyzeMessage = useCallback(() => {
    const messageElement = document.querySelector('[data-testid="thread-message"]');
    if (!messageElement) return;

    const mappings = analyzeSourceMappings(messageElement);
    const contributions = calculateContributionScores(mappings);
    
    setSourceMappings(mappings);
    setContributionScores(contributions);
  }, []);

  const handleSourceHover = useCallback((sourceId: string | null) => {
    setHighlightedSource(sourceId);
    
    // Remove previous highlights
    document.querySelectorAll('.sf-highlighted-text').forEach(el => {
      el.classList.remove('sf-highlighted-text');
    });

    if (sourceId) {
      // Find and highlight text segments for this source
      const relevantMappings = sourceMappings.filter(m => m.sourceId === sourceId);
      relevantMappings.forEach(mapping => {
        const textElements = document.querySelectorAll(
          `[data-sf-text-id="${mapping.textId}"]`
        );
        textElements.forEach(el => {
          el.classList.add('sf-highlighted-text');
        });
      });
    }
  }, [sourceMappings]);

  const handleTextClick = useCallback((textId: string) => {
    const mapping = sourceMappings.find(m => m.textId === textId);
    if (mapping) {
      setHighlightedText(textId);
      
      // Scroll to and highlight the source
      const sourceElement = document.querySelector(`[data-source-id="${mapping.sourceId}"]`);
      if (sourceElement) {
        sourceElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        sourceElement.classList.add('sf-highlighted-source');
        
        setTimeout(() => {
          sourceElement.classList.remove('sf-highlighted-source');
        }, 2000);
      }
    }
  }, [sourceMappings]);

  useEffect(() => {
    if (isActive) {
      analyzeMessage();
      
      // Add click listeners to text segments
      const observer = new MutationObserver(() => {
        const textElements = document.querySelectorAll('[data-sf-text-id]');
        textElements.forEach(el => {
          el.addEventListener('click', (e) => {
            e.preventDefault();
            const textId = el.getAttribute('data-sf-text-id');
            if (textId) handleTextClick(textId);
          });
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      return () => {
        observer.disconnect();
        // Clean up highlights
        document.querySelectorAll('.sf-highlighted-text, .sf-highlighted-source').forEach(el => {
          el.classList.remove('sf-highlighted-text', 'sf-highlighted-source');
        });
      };
    }
  }, [isActive, handleTextClick]);

  // Inject styles
  useEffect(() => {
    const styleId = 'source-forensics-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .sf-highlighted-text {
          background-color: ${settings.highlightColor}33 !important;
          border-radius: 2px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .sf-highlighted-text:hover {
          background-color: ${settings.highlightColor}66 !important;
        }
        .sf-highlighted-source {
          background-color: ${settings.highlightColor}22 !important;
          border: 2px solid ${settings.highlightColor} !important;
          border-radius: 4px;
          transition: all 0.3s ease;
        }
        [data-sf-text-id] {
          cursor: pointer;
        }
        [data-sf-text-id]:hover {
          background-color: rgba(59, 130, 246, 0.1);
        }
      `;
      document.head.appendChild(style);
    }

    return () => {
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, [settings.highlightColor]);

  return (
    <div className="x:flex x:items-center x:gap-2 x:mt-2 x:p-2 x:border x:border-gray-200 x:rounded-md x:bg-gray-50">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsActive(!isActive)}
        className={`x:gap-2 ${isActive ? 'x:bg-blue-100 x:border-blue-300' : ''}`}
      >
        {isActive ? <EyeOff className="x:w-4 x:h-4" /> : <Eye className="x:w-4 x:h-4" />}
        {isActive ? 'Disable' : 'Enable'} Source Forensics
      </Button>

      {isActive && (
        <>
          {settings.enableVisualSourceMap && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowVisualMap(!showVisualMap)}
              className="x:gap-2"
            >
              <Map className="x:w-4 x:h-4" />
              {showVisualMap ? 'Hide' : 'Show'} Source Map
            </Button>
          )}

          {settings.showContributionScore && contributionScores.length > 0 && (
            <div className="x:flex x:items-center x:gap-2">
              <Tooltip>
                <TooltipTrigger>
                  <Info className="x:w-4 x:h-4 x:text-gray-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Source contribution scores (% of content derived from each source)</p>
                </TooltipContent>
              </Tooltip>
              <div className="x:flex x:gap-1">
                {contributionScores
                  .filter(score => score.percentage >= settings.contributionScoreThreshold)
                  .slice(0, 5)
                  .map((score) => (
                    <Badge
                      key={score.sourceId}
                      variant="secondary"
                      className="x:text-xs x:cursor-pointer"
                      onMouseEnter={() => handleSourceHover(score.sourceId)}
                      onMouseLeave={() => handleSourceHover(null)}
                    >
                      [{score.sourceId}] {score.percentage.toFixed(1)}%
                    </Badge>
                  ))
                }
              </div>
            </div>
          )}

          <div className="x:text-sm x:text-gray-600">
            Found {sourceMappings.length} source mappings
          </div>
        </>
      )}

      {showVisualMap && isActive && (
        <VisualSourceMap
          mappings={sourceMappings}
          contributions={contributionScores}
          onSourceHover={handleSourceHover}
          highlightColor={settings.highlightColor}
        />
      )}
    </div>
  );
}