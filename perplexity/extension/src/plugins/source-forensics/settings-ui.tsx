import React from "react";

import type { PluginId } from "@/__registries__/plugins/meta.types";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Image } from "@/components/ui/image";
import useExtensionSettings from "@/services/infra/extension-api-wrappers/extension-settings/useExtensionSettings";

export const pluginId: PluginId = "sourceForensics";

export default function SourceForensicsSettingsUi() {
  const { settings, mutation } = useExtensionSettings();
  const pluginSettings = settings?.plugins.sourceForensics;

  if (!settings) return null;

  return (
    <div className="x:flex x:max-w-lg x:flex-col x:gap-6">
      <Switch
        textLabel="Enable Source Forensics"
        checked={pluginSettings?.enabled ?? false}
        onCheckedChange={({ checked }) => {
          mutation.mutate((draft) => {
            draft.plugins.sourceForensics.enabled = checked;
          });
        }}
      />

      {settings.plugins.sourceForensics.enabled && (
        <>
          <Switch
            textLabel="Show Contribution Scores"
            description="Display percentage of content derived from each source"
            checked={pluginSettings?.showContributionScore ?? true}
            onCheckedChange={({ checked }) => {
              mutation.mutate((draft) => {
                draft.plugins.sourceForensics.showContributionScore = checked;
              });
            }}
          />

          <Switch
            textLabel="Enable Visual Source Map"
            description="Show interactive visual representation of source mappings"
            checked={pluginSettings?.enableVisualSourceMap ?? false}
            onCheckedChange={({ checked }) => {
              mutation.mutate((draft) => {
                draft.plugins.sourceForensics.enableVisualSourceMap = checked;
              });
            }}
          />

          <div className="x:space-y-2">
            <Label htmlFor="highlight-color">Highlight Color</Label>
            <Input
              id="highlight-color"
              type="color"
              value={pluginSettings?.highlightColor ?? "#3b82f6"}
              onChange={(e) => {
                mutation.mutate((draft) => {
                  draft.plugins.sourceForensics.highlightColor = e.target.value;
                });
              }}
              className="x:w-20 x:h-10"
            />
          </div>

          <div className="x:space-y-2">
            <Label>Contribution Score Threshold: {pluginSettings?.contributionScoreThreshold ?? 10}%</Label>
            <Slider
              value={[pluginSettings?.contributionScoreThreshold ?? 10]}
              onValueChange={([value]) => {
                mutation.mutate((draft) => {
                  draft.plugins.sourceForensics.contributionScoreThreshold = value;
                });
              }}
              max={100}
              min={0}
              step={5}
              className="x:w-full"
            />
            <p className="x:text-sm x:text-gray-600">
              Only show sources that contribute at least this percentage of content
            </p>
          </div>
        </>
      )}

      <div className="x:mx-auto x:w-full x:max-w-[700px] x:mt-6">
        <div className="x:space-y-4">
          <h3 className="x:text-lg x:font-semibold">How Source Forensics Works</h3>
          <div className="x:space-y-2 x:text-sm x:text-gray-700">
            <p><strong>Source-to-Text Highlighting:</strong> Hover over source citations to see which parts of the answer were derived from that source.</p>
            <p><strong>Text-to-Source Navigation:</strong> Click on any sentence in the answer to highlight and scroll to the corresponding source.</p>
            <p><strong>Contribution Analysis:</strong> View percentage scores showing how much each source contributed to the final answer.</p>
            <p><strong>Visual Source Map:</strong> Get a bird's-eye view of how sources are distributed throughout the response.</p>
          </div>
        </div>
      </div>
    </div>
  );
}