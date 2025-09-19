import { SigninAttempt, Session } from './session';
import { ApiResult } from './client';

export interface ProfileCompletionData {
  first_name?: string;
  last_name?: string;
  username?: string;
  phone_number?: string;
  email?: string;
}

// Match the actual VerificationParams type from use-signin
type VerificationParams =
  | { strategy: "email_otp"; redirectUri?: string }
  | { strategy: "phone_otp"; lastDigits?: string }
  | { strategy: "magic_link"; redirectUri?: string };

type PrepareVerificationResponse = {
  otp_sent?: boolean;
  masked_phone?: string;
  masked_email?: string;
  verification_method?: string;
};

export interface ProfileCompletionProps {
  attempt: SigninAttempt;
  onBack?: () => void;
  completeProfile: (data: ProfileCompletionData) => Promise<Session>;
  completeVerification: (code: string) => Promise<Session>;
  prepareVerification: (params: VerificationParams) => Promise<ApiResult<PrepareVerificationResponse>>;
}
