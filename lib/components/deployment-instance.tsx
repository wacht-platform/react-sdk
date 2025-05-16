import type { ReactNode } from "react";
import { useDeployment } from "../hooks/use-deployment";

interface DeploymentInstanceProps {
  children: ReactNode;
}

const DeploymentInitialized: React.FC<DeploymentInstanceProps> = ({
  children,
}: DeploymentInstanceProps) => {
  const { loading } = useDeployment();

  if (loading) return null;

  return <>{children}</>;
};

const DeploymentInitializing: React.FC<DeploymentInstanceProps> = ({
  children,
}: DeploymentInstanceProps) => {
  const { loading } = useDeployment();

  if (loading) return <>{children}</>;

  return null;
};

export { DeploymentInitialized, DeploymentInitializing };
