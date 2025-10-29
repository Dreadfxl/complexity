import React from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";

import type { SourceMapping, SourceContribution } from "../types";

interface Props {
  mappings: SourceMapping[];
  contributions: SourceContribution[];
  onSourceHover: (sourceId: string | null) => void;
  highlightColor: string;
}

export function VisualSourceMap({ mappings, contributions, onSourceHover, highlightColor }: Props) {
  const [isVisible, setIsVisible] = React.useState(true);

  if (!isVisible) return null;

  // Group mappings by source
  const sourceGroups = mappings.reduce((acc, mapping) => {
    if (!acc[mapping.sourceId]) {
      acc[mapping.sourceId] = [];
    }
    acc[mapping.sourceId].push(mapping);
    return acc;
  }, {} as Record<string, SourceMapping[]>);

  return (
    <div className="x:fixed x:top-4 x:right-4 x:w-80 x:bg-white x:border x:border-gray-200 x:rounded-lg x:shadow-lg x:p-4 x:z-50 x:max-h-96 x:overflow-y-auto">
      <div className="x:flex x:items-center x:justify-between x:mb-3">
        <h3 className="x:font-semibold x:text-sm">Source Map</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsVisible(false)}
          className="x:p-1 x:h-6 x:w-6"
        >
          <X className="x:w-4 x:h-4" />
        </Button>
      </div>

      <div className="x:space-y-3">
        {Object.entries(sourceGroups).map(([sourceId, sourceMappings]) => {
          const contribution = contributions.find(c => c.sourceId === sourceId);
          const nodeCount = sourceMappings.length;
          
          return (
            <div
              key={sourceId}
              className="x:border x:border-gray-100 x:rounded-md x:p-3 x:cursor-pointer x:transition-colors hover:x:bg-gray-50"
              onMouseEnter={() => onSourceHover(sourceId)}
              onMouseLeave={() => onSourceHover(null)}
            >
              <div className="x:flex x:items-center x:justify-between x:mb-2">
                <div className="x:flex x:items-center x:gap-2">
                  <div
                    className="x:w-3 x:h-3 x:rounded-full"
                    style={{ backgroundColor: highlightColor }}
                  />
                  <span className="x:font-medium x:text-sm">Source [{sourceId}]</span>
                </div>
                {contribution && (
                  <span className="x:text-xs x:bg-gray-100 x:px-2 x:py-1 x:rounded">
                    {contribution.percentage.toFixed(1)}%
                  </span>
                )}
              </div>
              
              <div className="x:flex x:flex-wrap x:gap-1">
                {sourceMappings.slice(0, 8).map((mapping, index) => (
                  <div
                    key={`${mapping.textId}-${index}`}
                    className="x:w-2 x:h-2 x:bg-gray-300 x:rounded-full"
                    style={{
                      backgroundColor: `${highlightColor}${Math.max(30, 100 - index * 10).toString(16).padStart(2, '0')}`
                    }}
                    title={`Text segment ${mapping.textId}`}
                  />
                ))}
                {sourceMappings.length > 8 && (
                  <span className="x:text-xs x:text-gray-500">+{sourceMappings.length - 8}</span>
                )}
              </div>
              
              <div className="x:text-xs x:text-gray-500 x:mt-1">
                {nodeCount} text segment{nodeCount !== 1 ? 's' : ''} • 
                Confidence: {sourceMappings[0]?.confidence ? (sourceMappings[0].confidence * 100).toFixed(0) : 'N/A'}%
              </div>
            </div>
          );
        })}
      </div>

      {Object.keys(sourceGroups).length === 0 && (
        <div className="x:text-center x:text-gray-500 x:text-sm x:py-4">
          No source mappings detected
        </div>
      )}
    </div>
  );
}