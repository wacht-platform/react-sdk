import { Session } from "@/types";

// Utility functions for checking and redirecting
export function hasIncompleteProfile(session: Session): boolean {
  if (!session) return false;

  const incompleteSigninAttempt = session.signin_attempts?.find(
    (attempt: any) => attempt.requires_completion && !attempt.completed
  );

  if (incompleteSigninAttempt) return true;

  const incompleteSignupAttempt = session.signup_attempts?.find(
    (attempt) =>
      attempt.missing_fields?.length > 0 ||
      (attempt.remaining_steps?.length > 0 && !attempt.completed)
  );

  return !!incompleteSignupAttempt;
}

export function redirectToProfileCompletion(returnUrl?: string) {
  const url = returnUrl 
    ? `/profile-completion?redirect_uri=${encodeURIComponent(returnUrl)}`
    : "/profile-completion";
  
  window.location.href = url;
}
