import { useSession } from "@/hooks";

interface SignedOutProps {
    children: React.ReactNode;
}

export const SignedOut = ({ children }: SignedOutProps) => {
    const { loading, session } = useSession();

    if (loading) return null;
    if (session.signins?.length) return null;

    return <>
        {children}
    </>
}