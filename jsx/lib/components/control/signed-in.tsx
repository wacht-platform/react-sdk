import { useSession } from "@/hooks"

interface SignedInProps {
    children: React.ReactNode;
}

export const SignedIn = ({ children }: SignedInProps) => {
    const { session, loading } = useSession();

    if (loading) return null;
    if (!session.signins?.length) return null;

    return <>
        {children}
    </>
}