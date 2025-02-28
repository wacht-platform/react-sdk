type VerificationStrategy = "otp" | "oath_google" | "oath_github" | "oauth_microsoft" | "oauth_facebook" | "oauth_linkedin" | "oauth_discord" | "oauth_apple"

interface SocialConnection {
  id: number;
  provider: SocialConnectionProvider;
  email_address: string;
  first_name: string;
  last_name: string;
}

interface UserEmailAddress {
  id: string;
  email: string;
  is_primary: boolean;
  verified: boolean;
  verified_at: string;
  verification_strategy: VerificationStrategy
}

interface UserPhoneNumber {
  id: string;
  phone_number: string;
  verified: boolean;
  verified_at: string;
}

interface CurrentUser {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  primary_email_address_id: string;
  primary_phone_number_id: string;
  second_factor_policy: SecondFactorPolicy;
  user_email_addresses: UserEmailAddress[];
  user_phone_numbers: UserPhoneNumber[];
  social_connections: SocialConnection[];
  public_metadata: Record<string, any>;
}
