import type { Deployment } from "@snipextt/wacht-types";
import type { PlatformAdapter } from "./platform-adapter";

export interface DeploymentContextType {
  loading: boolean;
  deployment: Deployment | null;
  adapter: PlatformAdapter;
}