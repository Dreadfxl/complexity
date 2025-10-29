import React from "react";

import { usePluginSettings } from "@/services/infra/extension-api-wrappers/extension-settings/usePluginSettings";

import { SourceForensicsAnalyzer } from "./components/SourceForensicsAnalyzer";

export default function SourceForensicsWrapper() {
  const settings = usePluginSettings("sourceForensics");

  if (!settings?.enabled) {
    return null;
  }

  return <SourceForensicsAnalyzer settings={settings} />;
}