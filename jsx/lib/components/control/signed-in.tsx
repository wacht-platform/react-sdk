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

    if (!session.signins?.length) {
      const signInUrl = deployment?.ui_settings?.sign_in_page_url;
      if (signInUrl) navigate(signInUrl);
      return;
    }

    if (!session.active_signin) {
      navigate("/");
    }
  }, [loading, session, deployment, navigate]);

  if (loading) return null;
  if (!session.signins?.length || !session.active_signin) return null;

  return <>{children}</>;
};
