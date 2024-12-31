import { useContext } from "react";
import { DeploymentContext } from "../context/deployment-provider";

export function useDeployment() {
  const context = useContext(DeploymentContext);
  if (context === undefined) {
    throw new Error("useDeployment must be used within a DeploymentProvider");
  }
  return context;
}
