import { useContext } from "react";
import { DeploymentContext } from "../context/deployment-provider";

export function useDeployment() {
  const context = useContext(DeploymentContext);
  if (context === undefined) {
    throw new Error("useDeployment must be used within a DeploymentProvider");
  }
  if (!context.loading && !context.deployment) {
    throw new Error("Deployment is not loaded");
  }
  return context;
}
