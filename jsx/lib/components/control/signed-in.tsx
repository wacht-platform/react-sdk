import { useEffect } from "react";
import { useSession, useDeployment, useNavigation } from "@/hooks";

interface SignedInProps {
  children: React.ReactNode;
}

export const SignedIn = ({ children }: SignedInProps) => {
  const { session, loading } = useSession();
  const { deployment } = useDeployment();
  const { navigateToAccountSelection } = useNavigation();

  useEffect(() => {
    if (loading) return;

    if (session?.signins?.length && !session.active_signin) {
      navigateToAccountSelection();
    }
  }, [loading, session, deployment, navigateToAccountSelection]);

  if (loading) return null;
  if (!session.signins?.length || !session.active_signin) return null;

  return <>{children}</>;
};
