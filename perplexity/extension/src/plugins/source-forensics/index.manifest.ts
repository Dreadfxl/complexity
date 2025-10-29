import { z } from "zod";

import { definePlugin } from "@/__registries__/plugins/utils";

declare module "@/__registries__/plugins/meta.types" {
  interface PluginsSettingsRegistry {
    sourceForensics: z.infer<typeof schema>;
  }
}

const schema = z.object({
  enabled: z.boolean(),
  showContributionScore: z.boolean(),
  enableVisualSourceMap: z.boolean(),
  highlightColor: z.string(),
  contributionScoreThreshold: z.number().min(0).max(100),
});

export default definePlugin({
  meta: {
    id: "sourceForensics",
    title: "Source Forensics",
    description:
      "Interactive source-to-text mapping with visual highlighting and contribution analysis",
    dashboardMeta: {
      tags: ["ui", "analysis", "sources"],
      categories: ["thread", "productivity"],
      uiRouteSegment: "source-forensics",
    },
    dependencies: {
      corePlugins: ["domObservers:thread:messageBlocks"],
      uiGroups: ["thread:header:actions"],
    },
  },
  settingsSchema: {
    schema,
    fallback: {
      enabled: false,
      showContributionScore: true,
      enableVisualSourceMap: false,
      highlightColor: "#3b82f6",
      contributionScoreThreshold: 10,
    },
  },
});
