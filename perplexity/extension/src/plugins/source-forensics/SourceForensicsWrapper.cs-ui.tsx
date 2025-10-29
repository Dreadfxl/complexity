import React from "react";

import { createPortal } from "react-dom";

import { ExtensionSettingsService } from "@/services/infra/extension-api-wrappers/extension-settings";

import { SourceForensicsAnalyzer } from "./components/SourceForensicsAnalyzer";
import { useCreatePortalContainer } from "./useCreatePortalContainer";

export default function SourceForensicsWrapper() {
  const settings = ExtensionSettingsService.cachedSync;

  const container = useCreatePortalContainer({
    id: "cplx-source-forensics",
    selector: '[data-testid="thread-header"]',
    position: "append",
  });

  if (!settings?.plugins.sourceForensics?.enabled || !container) {
    return null;
  }

  return createPortal(
    <SourceForensicsAnalyzer settings={settings.plugins.sourceForensics} />,
    container,
  );
}
