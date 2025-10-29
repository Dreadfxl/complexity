import React from "react";

import { Portal } from "@/components/ui/portal";
import { ExtensionSettingsService } from "@/services/infra/extension-api-wrappers/extension-settings";
import { useThreadDomObserverStore } from "@/plugins/__core__/dom-observers/thread/store";

import { SourceForensicsAnalyzer } from "./components/SourceForensicsAnalyzer";

function SourceForensicsWrapper() {
  const settings = ExtensionSettingsService.cachedSync;

  // Use the thread DOM observer to get a reliable container
  const $overflowMenuButtonWrapper = useThreadDomObserverStore(
    (state) => state.$overflowMenuButtonWrapper,
    deepEqual,
  );

  const portalContainer = (() => {
    if ($overflowMenuButtonWrapper == null || !$overflowMenuButtonWrapper[0]) {
      return null;
    }

    const $wrapper = $($overflowMenuButtonWrapper[0]).parent();
    const containerId = 'cplx-source-forensics-container';
    
    let $existingContainer = $wrapper.find(`#${containerId}`);
    
    if ($existingContainer.length) {
      return $existingContainer[0];
    }

    const $portalContainer = $(`<div id="${containerId}" style="display: contents;"></div>`);
    $wrapper.append($portalContainer);

    return $portalContainer[0];
  })();

  if (!settings?.plugins.sourceForensics?.enabled || !portalContainer) {
    return null;
  }

  return (
    <Portal container={portalContainer}>
      <SourceForensicsAnalyzer settings={settings.plugins.sourceForensics} />
    </Portal>
  );
}

SourceForensicsWrapper.displayName = 'SourceForensicsWrapper';

export default SourceForensicsWrapper;
export const uiGroup = 'global';