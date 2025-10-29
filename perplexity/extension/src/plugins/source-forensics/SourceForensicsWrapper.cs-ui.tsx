import React from "react";

import { ExtensionSettingsService } from "@/services/infra/extension-api-wrappers/extension-settings";

import { SourceForensicsAnalyzer } from "./components/SourceForensicsAnalyzer";

export default function SourceForensicsWrapper() {
  const settings = ExtensionSettingsService.cachedSync;

  if (!settings?.plugins.sourceForensics?.enabled) {
    return null;
  }

  return <SourceForensicsAnalyzer settings={settings.plugins.sourceForensics} />;
}