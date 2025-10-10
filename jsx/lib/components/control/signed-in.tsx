import { useEffect } from "react";
import { useSession, useDeployment, useNavigation } from "@/hooks";

interface SignedInProps {
  children: React.ReactNode;
}

export const SignedIn = ({ children }: SignedInProps) => {
  const { session, loading } = useSession();
  const { deployment } = useDeployment();
  const { navigate } = useNavigation();

  useEffect(() => {
    if (loading) return;

    if (session?.signins?.length && !session.active_signin) {
      let currentHref = window.location.href;
      let redirectUrl = new URL(currentHref);
      redirectUrl.searchParams.set("redirect_uri", currentHref);

      navigate(redirectUrl.toString());
    }
  }, [loading, session, deployment, navigate]);

  if (loading) return null;
  if (!session.signins?.length || !session.active_signin) return null;

  return <>{children}</>;
};
