import type { ReactNode } from "react";
import { useDeployment } from "../hooks/use-deployment";

interface DeploymentInstanceProps {
	children: ReactNode;
}

const DeploymentInstanceInitialized: React.FC<DeploymentInstanceProps> = ({
	children,
}: DeploymentInstanceProps) => {
	const { loading } = useDeployment();

	if (loading) return null;

	return <>{children}</>;
};

const DeploymentInstanceInitializing: React.FC<DeploymentInstanceProps> = ({
	children,
}: DeploymentInstanceProps) => {
	const { loading } = useDeployment();

	if (loading) return <>{children}</>;

	return null;
};

export { DeploymentInstanceInitialized, DeploymentInstanceInitializing };
