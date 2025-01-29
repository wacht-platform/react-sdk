import { useState } from "react";
import { SignInAttempt } from "../types/session";

type UseSignInAttemptReturnType = {
    signInAttempt: SignInAttempt | null;
    discardSignInAttempt: () => void;
    setSignInAttempt: (attempt: SignInAttempt | null) => void;
} | {
    signInAttempt: null;
    setSignInAttempt: (attempt: SignInAttempt | null) => void;
    discardSignInAttempt: () => void;
};

export function useSignInAttempt(): UseSignInAttemptReturnType {
    const [signInAttempt, setSignInAttempt] = useState<SignInAttempt | null>(
        null,
    );

    return {
        signInAttempt,
        discardSignInAttempt: () => setSignInAttempt(null),
        setSignInAttempt,
    }
}