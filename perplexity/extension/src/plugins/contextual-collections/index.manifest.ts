import { z } from 'zod';
import type { PluginManifest } from '@/__registries__/plugins/types';

const id = 'contextual-collections' as const;

export const settingsSchema = z.object({
  enabled: z.boolean().default(true),
  showAddButton: z.boolean().default(true),
  autoSynthesis: z.boolean().default(true),
  maxCollections: z.number().min(1).max(50).default(10),
  synthesisMethod: z.enum(['summarize', 'extract-key-points', 'build-context']).default('build-context'),
});

const manifest: PluginManifest<typeof id> = {
  meta: {
    id,
    title: 'Contextual Collections',
    description: 'Group related Perplexity threads into Collections for enhanced multi-thread research context and synthesis.',
    dashboardMeta: {
      tags: ['productivity', 'research', 'organization'],
      categories: ['workflow'],
      uiRouteSegment: 'contextual-collections',
    },
  },
  settingsSchema: {
    schema: settingsSchema,
    fallback: settingsSchema.parse({}),
  },
};

export default manifest;