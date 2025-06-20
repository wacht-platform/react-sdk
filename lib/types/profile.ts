export interface ProfileCompletionData {
  first_name?: string;
  last_name?: string;
  username?: string;
  phone_number?: string;
  email?: string;
}

export interface ProfileCompletionProps {
  redirectUri?: string;
  onComplete?: (session: any) => void;
  onError?: (error: Error) => void;
  onBack?: () => void;
  autoRedirect?: boolean;
}
