import { z } from 'zod';
import type { PluginManifest } from '@/__registries__/plugins/types';

const id = 'custom-connectors' as const;

export const settingsSchema = z.object({
  enabled: z.boolean().default(false),
  mcpConfigJson: z.string().default(''),
});

const manifest: PluginManifest<typeof id> = {
  meta: {
    id,
    title: 'Custom Connectors (MCP)',
    description: 'Inject custom MCP sources into Perplexity requests',
    dashboardMeta: {
      tags: ['experimental'],
      categories: ['misc'],
      uiRouteSegment: 'custom-connectors',
    },
  },
  settingsSchema: {
    schema: settingsSchema,
    fallback: settingsSchema.parse({}),
  },
};

export default manifest;