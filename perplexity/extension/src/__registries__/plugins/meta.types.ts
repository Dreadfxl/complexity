import type { Transaction } from "dexie";
import type Dexie from "dexie";
import type z from "zod";
import type { settingsSchema as customConnectorsSchema } from '@/plugins/custom-connectors/index.manifest';
import type { CorePluginId } from "@/__registries__/core-plugins/types";
import type { UiGroupId } from "@/__registries__/cs-ui/types";
import type {
  PluginCategoryKey,
  PluginTagKeys,
} from "@/data/dashboard/plugin-meta/types";

export type PluginMeta<T extends PluginId> = {
  devOnly?: boolean;

  id: T;
  title: string;
  description: string;

  dashboardMeta: {
    tags: readonly PluginTagKeys[];
    categories: readonly PluginCategoryKey[];
    uiRouteSegment: string;
  };

  dependencies?: {
    corePlugins?: readonly CorePluginId[];
    uiGroups?: readonly UiGroupId[];
    plugins?: readonly PluginId[];
  };

  extensionPermissions?: {
    requiredPermissions?: readonly {
      permission: chrome.runtime.ManifestPermissions;
      rationale: string;
    }[];
    optionalPermissions?: readonly {
      permission: chrome.runtime.ManifestPermissions;
      rationale: string;
    }[];
  };
};

export type PluginMetaMap = {
  [K in PluginId]: PluginMeta<K>;
};

export interface PluginsSettingsRegistry {
  'custom-connectors': z.infer<typeof customConnectorsSchema>;
}

export type PluginsSettingsSchema = {
  [K in keyof PluginsSettingsRegistry]: PluginsSettingsRegistry[K];
};

export type PluginId = keyof PluginsSettingsRegistry;

export interface PluginsIndexedDbRegistry {}

export type PluginsIndexedDbSchema = {
  [K in keyof PluginsIndexedDbRegistry]: PluginsIndexedDbRegistry[K];
};

export type PluginTables = {
  [K in keyof PluginsIndexedDbRegistry]: Dexie.Table<
    PluginsIndexedDbRegistry[K]
  >;
};

export type PluginIndexedDbVersion = {
  version: number;
  schema?: string;
  tableName?: string;
  upgrade?: (tx: Transaction) => Promise<void> | void;
};

export type PluginIndexedDbConfig = {
  versions: PluginIndexedDbVersion[];
  schema?: z.ZodType<unknown>;
};

export interface PluginsDbDataRegistry {}

export type PluginsDbDataSchema = {
  [K in keyof PluginsDbDataRegistry]: PluginsDbDataRegistry[K];
};
