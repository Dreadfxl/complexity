import { lazily } from "react-lazily";

import type { UiGroupId } from "@/__registries__/cs-ui/types";
import { withPluginsGuard } from "@/plugins/__async-deps__/plugins-guard/withPluginsGuard";

const { ThreadExportMenu } = lazily(
  () => import("@/plugins/thread-export/ExportMenu"),
);

const ExportThreadWrapper = withPluginsGuard(ThreadExportMenu, {
  dependentPluginIds: ["thread:exportThread"],
  location: ["thread"],
});

export const uiGroup: UiGroupId = "thread:navbarAttributes";

export default ExportThreadWrapper;
